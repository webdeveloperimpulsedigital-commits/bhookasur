/**
 * Signed admin session tokens (HMAC-SHA256 via Web Crypto).
 * Works in both the Edge runtime (middleware) and the Node runtime (route handlers).
 *
 * Token format: `<expiryEpochMs>.<hexSignature>`. The signing secret is never sent to the browser.
 */

export const ADMIN_COOKIE_NAME = 'bakasur_admin_session';
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

const isProduction = () => process.env.NODE_ENV === 'production';

/** Admin credentials from env. In production there is NO default password: admin login stays disabled until set. */
export function getAdminCredentials(): { username: string; password: string | null } {
  const username = (process.env.ADMIN_USERNAME || process.env.ADMIN_USER || 'admin').trim();
  const envPassword = process.env.ADMIN_PASSWORD || process.env.ADMIN_PASS || '';
  if (envPassword) return { username, password: envPassword };
  return { username, password: isProduction() ? null : 'admin123' };
}

function getSigningSecret(): string | null {
  const explicit = process.env.ADMIN_SESSION_SECRET || '';
  if (explicit) return explicit;
  const { password } = getAdminCredentials();
  if (!password) return null;
  // Derive from the admin password so changing the password invalidates every existing session
  return `bakasur-admin::${password}`;
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

export async function createAdminSessionToken(): Promise<string | null> {
  const secret = getSigningSecret();
  if (!secret) return null;
  const expiry = Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000;
  const sig = await hmacHex(secret, `admin:${expiry}`);
  return `${expiry}.${sig}`;
}

export async function verifyAdminSessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const secret = getSigningSecret();
  if (!secret) return false;
  const [expiryStr, sig] = token.split('.');
  const expiry = Number(expiryStr);
  if (!expiryStr || !sig || !Number.isFinite(expiry) || expiry < Date.now()) return false;
  const expected = await hmacHex(secret, `admin:${expiry}`);
  return timingSafeEqualHex(sig, expected);
}
