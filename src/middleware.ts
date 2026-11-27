import { NextResponse, type NextRequest } from 'next/server';
import { REF_COOKIE, REF_COOKIE_MAX_DAYS, REF_PARAM, refCookieValue } from '@/lib/affiliate/program';

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
      // Admin is secret: do not reveal or redirect to /login?next=/admin; redirect unauthenticated visitors to /
      if (path === '/admin' || path.startsWith('/admin/')) {
        url.pathname = '/';
        url.search = '';
        return NextResponse.redirect(url);
      }
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
  // 3. Affiliate links (?ref=CODE on any page): remember the code and click time; the last click wins.
  const ref = (req.nextUrl.searchParams.get(REF_PARAM) || '').trim().toUpperCase();
  if (/^[A-Z0-9]{4,20}$/.test(ref)) {
    res.cookies.set(REF_COOKIE, refCookieValue(ref), { path: '/', maxAge: REF_COOKIE_MAX_DAYS * 86_400, sameSite: 'lax', httpOnly: true, secure: req.nextUrl.protocol === 'https:' });
  }
  const country = (req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || '').toUpperCase();
  if (/^[A-Z]{2}$/.test(country) && country !== 'XX' && req.cookies.get('mn_geo')?.value !== country) {
    res.cookies.set('mn_geo', country, { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax', secure: req.nextUrl.protocol === 'https:' });
  }
  return res;
}

// Pages only – not API routes, Next.js assets or files with an extension.
export const config = { matcher: ['/((?!api/|_next/|.*\\.[a-zA-Z0-9]+$).*)'] };
