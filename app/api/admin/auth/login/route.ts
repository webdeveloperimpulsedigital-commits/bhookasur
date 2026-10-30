import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import type { RowDataPacket } from 'mysql2';
import { getMySQLPool } from '@/lib/db';
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSessionToken,
  type AdminRole
} from '@/lib/adminSession';

export const dynamic = 'force-dynamic';

function hashPasswordWithSalt(password: string, salt: string): string {
  const digest = crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex');
  return `sha256$${salt}$${digest}`;
}

function verifyStoredPassword(plainPassword: string, storedHash: string): { matched: boolean; needsUpgrade: boolean } {
  if (!storedHash || !plainPassword) {
    return { matched: false, needsUpgrade: false };
  }

  // 1. Salted SHA-256 format: sha256$<salt>$<hex>
  if (storedHash.startsWith('sha256$')) {
    const parts = storedHash.split('$');
    if (parts.length === 3) {
      const salt = parts[1];
      const expectedHex = parts[2];
      const actualHex = crypto.createHash('sha256').update(`${salt}:${plainPassword}`).digest('hex');
      if (expectedHex.length === actualHex.length) {
        const matched = crypto.timingSafeEqual(Buffer.from(actualHex, 'utf8'), Buffer.from(expectedHex, 'utf8'));
        return { matched, needsUpgrade: false };
      }
    }
    return { matched: false, needsUpgrade: false };
  }

  // 2. Unsalted 64-char SHA-256 hex (e.g. set via MySQL SHA2(password, 256) in phpMyAdmin)
  if (/^[a-f0-9]{64}$/i.test(storedHash)) {
    const actualHex = crypto.createHash('sha256').update(plainPassword).digest('hex').toLowerCase();
    const expectedHex = storedHash.toLowerCase();
    const matched = crypto.timingSafeEqual(Buffer.from(actualHex, 'utf8'), Buffer.from(expectedHex, 'utf8'));
    return { matched, needsUpgrade: matched };
  }

  // 3. Direct value (if an admin updated the row directly in phpMyAdmin -> upgrade to salted hash on login)
  const aBuf = Buffer.from(plainPassword, 'utf8');
  const bBuf = Buffer.from(storedHash, 'utf8');
  if (aBuf.length === bBuf.length && crypto.timingSafeEqual(aBuf, bBuf)) {
    return { matched: true, needsUpgrade: true };
  }

  return { matched: false, needsUpgrade: false };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawEmail = body.email ?? body.username ?? '';
    const rawPassword = body.password ?? '';

    const cleanEmail = String(rawEmail).trim().toLowerCase();
    const cleanPass = String(rawPassword);

    if (!cleanEmail || !cleanPass) {
      return NextResponse.json(
        { success: false, error: 'Please enter both Email ID and password.' },
        { status: 400 }
      );
    }

    const pool = getMySQLPool();
    if (!pool) {
      return NextResponse.json(
        { success: false, error: 'Database connection unavailable. Please try again.' },
        { status: 503 }
      );
    }

    // Ensure admin_users table structure exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        email VARCHAR(191) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('super_admin', 'admin') NOT NULL DEFAULT 'admin',
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        last_login_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_admin_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Query admin_users strictly from the database
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, email, password_hash, role, is_active
       FROM admin_users
       WHERE LOWER(TRIM(email)) = ?
       LIMIT 1`,
      [cleanEmail]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid Email ID or password.' },
        { status: 401 }
      );
    }

    const adminRow = rows[0];
    if (Number(adminRow.is_active) !== 1) {
      return NextResponse.json(
        { success: false, error: 'This admin account is disabled.' },
        { status: 403 }
      );
    }

    const { matched, needsUpgrade } = verifyStoredPassword(cleanPass, String(adminRow.password_hash || ''));
    if (!matched) {
      return NextResponse.json(
        { success: false, error: 'Invalid Email ID or password.' },
        { status: 401 }
      );
    }

    const authenticatedRole: AdminRole = adminRow.role === 'super_admin' ? 'super_admin' : 'admin';
    const authenticatedEmail = String(adminRow.email).trim();

    // Update last_login_at (and upgrade hash if admin edited password in phpMyAdmin)
    if (needsUpgrade) {
      const newSalt = crypto.randomBytes(12).toString('hex');
      const upgradedHash = hashPasswordWithSalt(cleanPass, newSalt);
      await pool.query(
        'UPDATE admin_users SET password_hash = ?, last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
        [upgradedHash, adminRow.id]
      ).catch(() => {});
    } else {
      await pool.query(
        'UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
        [adminRow.id]
      ).catch(() => {});
    }

    const token = await createAdminSessionToken(authenticatedRole, authenticatedEmail);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Failed to create admin session.' },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ADMIN_SESSION_MAX_AGE_SECONDS
    });

    return NextResponse.json({
      success: true,
      message: `${authenticatedRole === 'super_admin' ? 'Super Admin' : 'Admin'} logged in successfully`,
      user: {
        username: authenticatedEmail,
        email: authenticatedEmail,
        role: authenticatedRole
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
