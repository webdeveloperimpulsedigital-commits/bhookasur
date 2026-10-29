/**
 * Signed admin session tokens (HMAC-SHA256 via Web Crypto).
 * Supports two distinct roles:
 *  - 'super_admin': Full access (View, Edit, Delete, Export to Excel)
 *  - 'admin': View-only access (Can view dashboard, searches & participants; cannot edit, delete, or export)
 *
 * Works in both the Edge runtime (middleware) and the Node runtime (route handlers).
 */

export const ADMIN_COOKIE_NAME = 'bakasur_admin_session';
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type AdminRole = 'super_admin' | 'admin';

export interface AdminSessionInfo {
  valid: boolean;
  role: AdminRole;
  username: string;
}

/** Super Admin credentials (Full access: View, Edit, Delete, Export Excel) */
export function getSuperAdminCredentials(): { username: string; password: string } {
  const username = (process.env.SUPER_ADMIN_USERNAME || 'superadmin').trim();
  const password = (process.env.SUPER_ADMIN_PASSWORD || 'superadmin123').trim();
  return { username, password };
}

/** Regular Admin credentials (View-only access) */
export function getAdminCredentials(): { username: string; password: string } {
  const username = (process.env.ADMIN_USERNAME || process.env.ADMIN_USER || 'admin').trim();
  const password = (process.env.ADMIN_PASSWORD || process.env.ADMIN_PASS || 'admin123').trim();
  return { username, password };
}

function getSigningSecret(): string {
  const explicit = process.env.ADMIN_SESSION_SECRET || '';
  if (explicit) return explicit;
  const superCreds = getSuperAdminCredentials();
  const adminCreds = getAdminCredentials();
  return `bakasur-admin-v2::${superCreds.password}::${adminCreds.password}`;
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createAdminSessionToken(
  role: AdminRole = 'admin',
  username: string = 'admin'
): Promise<string | null> {
  const secret = getSigningSecret();
  if (!secret) return null;
  const expiry = Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000;
  const cleanUser = encodeURIComponent(username);
  const payload = `${role}.${cleanUser}.${expiry}`;
  const sig = await hmacHex(secret, `admin:${payload}`);
  return `${payload}.${sig}`;
}

export async function verifyAdminSession(token: string | undefined | null): Promise<AdminSessionInfo | null> {
  if (!token) return null;
  const secret = getSigningSecret();
  if (!secret) return null;

  const parts = token.split('.');
  if (parts.length === 4) {
    const [roleStr, encodedUser, expiryStr, sig] = parts;
    const role: AdminRole = roleStr === 'super_admin' ? 'super_admin' : 'admin';
    const expiry = Number(expiryStr);
    if (!expiryStr || !sig || !Number.isFinite(expiry) || expiry < Date.now()) return null;
    const payload = `${roleStr}.${encodedUser}.${expiryStr}`;
    const expected = await hmacHex(secret, `admin:${payload}`);
    if (!timingSafeEqualHex(sig, expected)) return null;
    return {
      valid: true,
      role,
      username: decodeURIComponent(encodedUser)
    };
  }

  return null;
}

export async function verifyAdminSessionToken(token: string | undefined | null): Promise<boolean> {
  const session = await verifyAdminSession(token);
  return Boolean(session?.valid);
}
