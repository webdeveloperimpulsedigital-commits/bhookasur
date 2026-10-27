import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/adminSession';

// Admin auth endpoints must stay reachable without a session (login / session check / logout)
const PUBLIC_ADMIN_API = new Set(['/api/admin/auth/login', '/api/admin/auth/me', '/api/admin/auth/logout']);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_ADMIN_API.has(pathname)) return NextResponse.next();

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (await verifyAdminSessionToken(token)) return NextResponse.next();

  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}

export const config = {
  matcher: ['/api/admin/:path*']
};
