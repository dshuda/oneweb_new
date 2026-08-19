import { NextRequest, NextResponse } from 'next/server';

// Middleware redirects are NOT basePath-aware — NextResponse.redirect writes the
// path verbatim, so without this prefix the portal bounces users to
// /admin/login on the host root (the storefront's nginx location) instead of
// /portal/admin/login. Inlined at build time; the runtime env is shared with
// the storefront and would carry the wrong value.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── ADMIN ROUTES ────────────────────────────────────────────────────────────
  // Skip middleware for the admin login page itself to prevent redirect loops
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin')) {
    const adminToken = request.cookies.get('admin_token')?.value;
    const adminType = request.cookies.get('admin_type')?.value?.toLowerCase();

    // Must have admin_token AND be admin or staff role
    if (!adminToken || (adminType !== 'admin' && adminType !== 'staff')) {
      return NextResponse.redirect(new URL(`${BASE_PATH}/admin/login`, request.url));
    }

    return NextResponse.next();
  }

  // ─── CUSTOMER PROTECTED ROUTES ───────────────────────────────────────────────
  // const customerProtectedRoutes = ['', '/cart'];
  // const isCustomerProtected = customerProtectedRoutes.some((route) =>
  //   pathname.startsWith(route)
  // );

  // if (isCustomerProtected) {
  //   const custToken = request.cookies.get('cust_token')?.value;
  //   if (!custToken) {
  //     return NextResponse.redirect(new URL(`${BASE_PATH}/auth/login`, request.url));
  //   }
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/admin/login',
    '/dashboard/:path*',
    '/vendor/:path*',
    '/orders/:path*',
    '/cart/:path*',
  ],
};
