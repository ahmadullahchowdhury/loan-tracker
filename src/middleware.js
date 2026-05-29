import { NextResponse } from 'next/server';

const PROTECTED = ['/dashboard', '/money-lent', '/money-borrowed'];
const AUTH_PAGES = ['/login', '/register'];

export function middleware(request) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/money-lent/:path*', '/money-borrowed/:path*', '/login', '/register'],
};
