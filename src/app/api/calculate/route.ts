import { NextResponse } from 'next/server';
import { ClientInputSchema, generateNumerology, NumerologyInputError, type ReportModule } from '@/lib/numerology';
import { clientIp, readJson } from '@/lib/server/http';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store, max-age=0' };
const MODULES: ReportModule[] = ['dob', 'name', 'mobile', 'aadhaar', 'couple', 'complete'];

/**
 * POST { input: ClientInput, asOf?: 'YYYY-MM-DD', modules?: ReportModule[] }
 * PRIVACY: the request body is never logged or stored. The response contains no full Aadhaar.
 */
export async function POST(req: Request) {
  const rl = rateLimit(`calc:${clientIp(req)}`, 60, 10 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);
  let body: { input?: unknown; asOf?: unknown; modules?: unknown };
  try {
    body = await readJson<{ input?: unknown; asOf?: unknown; modules?: unknown }>(req, 100_000);
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400, headers: NO_STORE });
  }

  const parsed = ClientInputSchema.safeParse(body.input);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    return NextResponse.json({ error: 'VALIDATION', issues }, { status: 422, headers: NO_STORE });
  }
  const asOf = typeof body.asOf === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.asOf) ? body.asOf : undefined;
  const modules = Array.isArray(body.modules) ? (body.modules.filter((m) => MODULES.includes(m)) as ReportModule[]) : undefined;

  try {
    const result = generateNumerology(parsed.data, { asOf, modules: modules?.length ? modules : undefined });
    return NextResponse.json(result, { headers: NO_STORE });
  } catch (e) {
    if (e instanceof NumerologyInputError) {
      return NextResponse.json({ error: 'VALIDATION', issues: [{ path: e.code, message: e.message }] }, { status: 422, headers: NO_STORE });
    }
    // Deliberately log only the error type – never the input.
    console.error('calculate failed:', e instanceof Error ? e.name : 'unknown');
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500, headers: NO_STORE });
  }
}
