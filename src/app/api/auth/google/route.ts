import { googleAuthUrl, googleEnabled } from '@/lib/auth/google';
import { appOrigin } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const next = new URL(req.url).searchParams.get('next') ?? '/dashboard';
  if (!googleEnabled()) {
    const origin = appOrigin(req);
    return new Response(null, {
      status: 302,
      headers: { location: `${origin}/login?error=google_not_configured&next=${encodeURIComponent(next)}` }
    });
  }
  const { url, state, verifier } = googleAuthUrl(`${appOrigin(req)}/api/auth/google/callback`);
  const cookie = `g_oauth=${encodeURIComponent(JSON.stringify({ state, verifier, next: /^\/(?![/\\])/.test(next) ? next : '/dashboard' }))}; Path=/api/auth/google; HttpOnly; SameSite=Lax; Max-Age=600${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
  return new Response(null, { status: 302, headers: { location: url, 'set-cookie': cookie } });
}
