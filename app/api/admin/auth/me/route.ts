import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/adminSession';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);

  const isAuthenticated = await verifyAdminSessionToken(sessionCookie?.value);

  return NextResponse.json({
    success: true,
    authenticated: isAuthenticated
  });
}
