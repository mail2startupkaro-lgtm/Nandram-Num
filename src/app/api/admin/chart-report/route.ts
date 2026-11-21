import { z } from 'zod';
import { todayIST } from '@/lib/numerology';
import { withAdmin } from '@/lib/server/admin';
import { json, readJson } from '@/lib/server/http';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';
import { analyseDestiny, writeDestiny } from '@/lib/destiny/report';
import { analysePsychomatrix, writePsychomatrix } from '@/lib/psychomatrix/report';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  kind: z.enum(['destiny', 'psychomatrix']),
  name: z.string().trim().min(2).max(120),
  dob: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a valid date'),
});

/** Admin-only Destiny Matrix / Pythagorean birth chart reports (deterministic – nothing is stored). Returns the data and both language versions. */
export const POST = withAdmin(async (req, user) => {
  const rl = rateLimit(`chart:${user.id}`, 120, 10 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const b = Body.parse(await readJson(req));
  try {
    const t = todayIST();
    const asOf = `${t.year}-${String(t.month).padStart(2, '0')}-${String(t.day).padStart(2, '0')}`;
    if (b.kind === 'destiny') {
      const data = analyseDestiny({ name: b.name, dob: b.dob, asOf });
      if (data.age < 0) return json({ error: 'VALIDATION', issues: [{ path: 'dob', message: 'The date of birth is in the future' }] }, 422);
      return json({ kind: b.kind, name: data.name, dob: data.dob, report: { en: writeDestiny(data, 'en'), hi: writeDestiny(data, 'hi') }, generatedAt: new Date().toISOString() });
    }
    const data = analysePsychomatrix({ name: b.name, dob: b.dob });
    return json({ kind: b.kind, name: data.name, dob: data.dob, report: { en: writePsychomatrix(data, 'en'), hi: writePsychomatrix(data, 'hi') }, generatedAt: new Date().toISOString() });
  } catch (e) {
    if (e instanceof Error && !(e as { code?: string }).code) return json({ error: 'VALIDATION', issues: [{ path: 'dob', message: e.message }] }, 422);
    if (e instanceof Error && /DATE_/.test((e as { code?: string }).code ?? '')) return json({ error: 'VALIDATION', issues: [{ path: 'dob', message: 'Enter a valid date of birth' }] }, 422);
    throw e;
  }
});
