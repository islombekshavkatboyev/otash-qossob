import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, TOKEN_NAME } from './app/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Login sahifasi — agar token bo'lsa, /admin ga o'tkazish
  if (pathname === '/admin/login') {
    const token = request.cookies.get(TOKEN_NAME)?.value;
    if (token) {
      const valid = await verifyToken(token);
      if (valid) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    }
    return NextResponse.next();
  }

  // /admin/* sahifalari — token tekshirish
  const token = request.cookies.get(TOKEN_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  const valid = await verifyToken(token);
  if (!valid) {
    const response = NextResponse.redirect(new URL('/admin/login', request.url));
    response.cookies.delete(TOKEN_NAME);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
