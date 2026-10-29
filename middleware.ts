import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE_NAME, verifyAdminSession } from '@/lib/adminSession';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin auth endpoints must always stay reachable without restrictions (login / me / logout)
  if (pathname.includes('/api/admin/auth/')) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const session = await verifyAdminSession(token);
  if (!session || !session.valid) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Enforce Role-Based Access Control (RBAC):
  // 'admin' role has View + Excel Export access (all GET requests).
  // 'super_admin' role has FULL access (GET, POST, PUT, PATCH, DELETE, and Excel exports).
  const isMutatingMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method.toUpperCase());

  if (isMutatingMethod && session.role !== 'super_admin') {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Only Super Admin can edit or delete records.' },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/admin/:path*']
};
