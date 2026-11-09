/** Small helpers shared by API route handlers. */
import { ZodError } from 'zod';
import { ForbiddenError, getCurrentUser, getOptionalUser, UnauthorizedError } from '@/lib/auth/current-user';
import { AuthError } from '@/lib/auth/otp';
import type { User } from '@/lib/db/schema';
import { NotFoundError } from '@/lib/db/repo/profiles';
import { NumerologyInputError } from '@/lib/numerology';

export const NO_STORE = { 'cache-control': 'no-store, max-age=0' };

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...NO_STORE, ...headers } });

export function errorResponse(e: unknown): Response {
  if (e instanceof UnauthorizedError) return json({ error: 'UNAUTHORIZED' }, 401);
  if (e instanceof ForbiddenError) return json({ error: e.message }, 403);
  if (e instanceof AuthError) return json({ error: e.code }, e.status);
  if (e instanceof PaymentRequiredError) return json({ error: 'PAYMENT_REQUIRED', reason: e.message }, 402);
  if (e instanceof NotFoundError) return json({ error: e.message }, 404);
  if (e instanceof ZodError) return json({ error: 'VALIDATION', issues: e.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) }, 422);
  if (e instanceof NumerologyInputError) return json({ error: 'VALIDATION', issues: [{ path: e.code, message: e.message }] }, 422);
  if (e instanceof Error && e.message === 'REFUSING_TO_STORE_12_DIGIT_NUMBER') return json({ error: 'PII_REJECTED' }, 422);
  if (e instanceof Error && /ENCRYPTION_KEY|DATABASE_URL|CASHFREE_|OTP delivery provider/.test(e.message)) { console.error('config error:', e.message); return json({ error: 'SERVER_NOT_CONFIGURED', issues: [{ path: 'server', message: 'The server is missing required settings (database, encryption, payments or OTP delivery). See .env.example.' }] }, 503); }
  console.error('api error:', e instanceof Error ? `${e.name}: ${e.message.slice(0, 160)}` : 'unknown'); // never log request bodies
  return json({ error: 'INTERNAL' }, 500);
}

export class PaymentRequiredError extends Error {}

type Ctx<P> = { params: P };

/** Blocks cross-site state-changing requests (CSRF) – the browser always sends Origin on POST/PUT/PATCH/DELETE. */
export function assertSameOrigin(req: Request) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return;
  const origin = req.headers.get('origin');
  if (!origin) return; // non-browser clients (curl, server-to-server)
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  try { if (new URL(origin).host !== host) throw new ForbiddenError('BAD_ORIGIN'); } catch (e) { if (e instanceof ForbiddenError) throw e; throw new ForbiddenError('BAD_ORIGIN'); }
}

/** Wraps a handler with the current user and uniform error handling. */
export function withUser<P = Record<string, string>>(fn: (req: Request, user: User, ctx: Ctx<P>) => Promise<Response>) {
  return async (req: Request, ctx: Ctx<P>) => {
    try {
      assertSameOrigin(req);
      const user = await getCurrentUser(req);
      return await fn(req, user, ctx);
    } catch (e) {
      return errorResponse(e);
    }
  };
}

/** Like withUser but the user may be anonymous. */
export function withOptionalUser<P = Record<string, string>>(fn: (req: Request, user: User | null, ctx: Ctx<P>) => Promise<Response>) {
  return async (req: Request, ctx: Ctx<P>) => {
    try {
      assertSameOrigin(req);
      return await fn(req, await getOptionalUser(req), ctx);
    } catch (e) {
      return errorResponse(e);
    }
  };
}

export const clientIp = (req: Request) => (req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? 'local').trim().slice(0, 64);

export async function readJson<T = unknown>(req: Request): Promise<T> {
  try { return (await req.json()) as T; } catch { throw new ZodError([{ code: 'custom', path: [], message: 'Invalid JSON body' }]); }
}

export const pdfResponse = (pdf: Uint8Array, filename: string, extra: Record<string, string> = {}) =>
  new Response(Buffer.from(pdf), { headers: { 'content-type': 'application/pdf', 'content-disposition': `attachment; filename="${filename}"`, ...NO_STORE, ...extra } });

export const slug = (s: string) => s.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'client';

export function appOrigin(req: Request): string {
  return process.env.APP_URL?.replace(/\/$/, '') || new URL(req.url).origin;
}
