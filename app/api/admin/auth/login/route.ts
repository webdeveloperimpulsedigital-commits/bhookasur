import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSessionToken,
  getAdminCredentials,
  getSuperAdminCredentials,
  type AdminRole
} from '@/lib/adminSession';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, role: requestedRole } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const cleanUser = String(username).trim();
    const cleanPass = String(password);

    const superCreds = getSuperAdminCredentials();
    const adminCreds = getAdminCredentials();

    let authenticatedRole: AdminRole | null = null;
    let authenticatedUsername = '';

    if (requestedRole === 'super_admin') {
      if (cleanUser === superCreds.username && cleanPass === superCreds.password) {
        authenticatedRole = 'super_admin';
        authenticatedUsername = superCreds.username;
      } else {
        return NextResponse.json(
          { success: false, error: 'Invalid Super Admin credentials' },
          { status: 401 }
        );
      }
    } else if (requestedRole === 'admin') {
      if (cleanUser === adminCreds.username && cleanPass === adminCreds.password) {
        authenticatedRole = 'admin';
        authenticatedUsername = adminCreds.username;
      } else {
        return NextResponse.json(
          { success: false, error: 'Invalid Admin (View-Only) credentials' },
          { status: 401 }
        );
      }
    } else {
      // Auto-detect if role was not explicitly passed
      if (cleanUser === superCreds.username && cleanPass === superCreds.password) {
        authenticatedRole = 'super_admin';
        authenticatedUsername = superCreds.username;
      } else if (cleanUser === adminCreds.username && cleanPass === adminCreds.password) {
        authenticatedRole = 'admin';
        authenticatedUsername = adminCreds.username;
      } else {
        return NextResponse.json(
          { success: false, error: 'Invalid credentials' },
          { status: 401 }
        );
      }
    }

    const token = await createAdminSessionToken(authenticatedRole, authenticatedUsername);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Admin login is not configured on this server' },
        { status: 503 }
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
        username: authenticatedUsername,
        role: authenticatedRole
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
