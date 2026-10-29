import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSession } from '@/lib/adminSession';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);

  const session = await verifyAdminSession(sessionCookie?.value);

  return NextResponse.json(
    {
      success: true,
      authenticated: Boolean(session?.valid),
      role: session?.role || null,
      username: session?.username || null
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    }
  );
}
