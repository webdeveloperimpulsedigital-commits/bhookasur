import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSessionToken,
  getAdminCredentials
} from '@/lib/adminSession';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const { username: ADMIN_USERNAME, password: ADMIN_PASSWORD } = getAdminCredentials();
    if (!ADMIN_PASSWORD) {
      // Production without ADMIN_PASSWORD configured: admin login is disabled (no default password)
      return NextResponse.json(
        { success: false, error: 'Admin login is not configured on this server' },
        { status: 503 }
      );
    }

    if (String(username).trim() !== ADMIN_USERNAME || String(password) !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: 'Invalid admin credentials' },
        { status: 401 }
      );
    }

    const token = await createAdminSessionToken();
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Admin login is not configured on this server' },
        { status: 503 }
      );
    }

    // Set signed authentication cookie valid for 7 days
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
      message: 'Admin logged in successfully',
      user: { username: ADMIN_USERNAME }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
