import { exchangeGoogleCode } from '@/lib/auth/google';
import { upsertVerifiedUser } from '@/lib/auth/otp';
import { createSession, readCookie, sessionCookie } from '@/lib/auth/session';
import { appOrigin } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const fail = (origin: string, code: string) => new Response(null, { status: 302, headers: { location: `${origin}/login?error=${code}` } });

export async function GET(req: Request) {
  const origin = appOrigin(req);
  const u = new URL(req.url);
  let saved: { state: string; verifier: string; next: string };
  try { saved = JSON.parse(readCookie(req, 'g_oauth') ?? ''); } catch { return fail(origin, 'google_state'); }
  if (!saved?.state || u.searchParams.get('state') !== saved.state || !u.searchParams.get('code')) return fail(origin, 'google_state');
  try {
    const p = await exchangeGoogleCode(u.searchParams.get('code')!, saved.verifier, `${origin}/api/auth/google/callback`);
    if (!p.emailVerified) return fail(origin, 'google_unverified');
    const user = await upsertVerifiedUser({ googleSub: p.sub, email: p.email }, p.name);
    const token = await createSession(user.id, req.headers.get('user-agent'));
    const headers = new Headers({ location: `${origin}${saved.next}` });
    headers.append('set-cookie', sessionCookie(token));
    headers.append('set-cookie', 'g_oauth=; Path=/api/auth/google; Max-Age=0');
    return new Response(null, { status: 302, headers });
  } catch {
    return fail(origin, 'google_failed');
  }
}
