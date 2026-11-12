import { NextResponse, type NextRequest } from 'next/server';

const PRIVATE = ['/dashboard', '/admin', '/account', '/settings'];
const isPrivate = (p: string) => PRIVATE.some((x) => p === x || p.startsWith(`${x}/`));

/**
 * 1. Private areas need a session cookie (the API verifies it properly).
 * 2. Remembers the visitor's country (from the hosting edge) in `mn_geo`, so cached pages can show $ prices and
 *    international wording to visitors outside India before first paint (see the currency script in layout.tsx).
 */
export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  let res: NextResponse;
  if (isPrivate(path)) {
    if (!(process.env.AUTH_DEV_BYPASS_EMAIL && process.env.NODE_ENV !== 'production') && !req.cookies.get('nsid')) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.search = `?next=${encodeURIComponent(path + req.nextUrl.search)}`;
      return NextResponse.redirect(url);
    }
    res = NextResponse.next();
    res.headers.set('Cache-Control', 'private, no-store');
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  } else {
    res = NextResponse.next();
  }
  const country = (req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || '').toUpperCase();
  if (/^[A-Z]{2}$/.test(country) && country !== 'XX' && req.cookies.get('mn_geo')?.value !== country) {
    res.cookies.set('mn_geo', country, { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax', secure: req.nextUrl.protocol === 'https:' });
  }
  return res;
}

// Pages only – not API routes, Next.js assets or files with an extension.
export const config = { matcher: ['/((?!api/|_next/|.*\\.[a-zA-Z0-9]+$).*)'] };
