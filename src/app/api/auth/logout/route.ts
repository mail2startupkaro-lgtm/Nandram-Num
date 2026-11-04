import { clearSessionCookie, destroySession, readCookie } from '@/lib/auth/session';
import { assertSameOrigin, errorResponse, json } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    await destroySession(readCookie(req));
    return json({ ok: true }, 200, { 'set-cookie': clearSessionCookie() });
  } catch (e) { return errorResponse(e); }
}
