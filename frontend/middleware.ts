import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE = 'onetap.auth';

export function middleware(request: NextRequest) {
  const loggedIn = request.cookies.get(AUTH_COOKIE)?.value === '1';

  // Protect the profile route — send visitors who aren't logged in back to
  // the home page with a flag that opens the login drawer.
  if (!loggedIn) {
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('login', '1');
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/profile/:path*'],
};
