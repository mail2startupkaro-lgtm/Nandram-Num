import { NextResponse, type NextRequest } from 'next/server';

/** Cheap edge check: private areas need a session cookie (the API verifies it properly). */
export function middleware(req: NextRequest) {
  if (process.env.AUTH_DEV_BYPASS_EMAIL && process.env.NODE_ENV !== 'production') return NextResponse.next();
  if (!req.cookies.get('nsid')) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/dashboard/:path*', '/admin/:path*', '/account/:path*', '/settings/:path*'] };
