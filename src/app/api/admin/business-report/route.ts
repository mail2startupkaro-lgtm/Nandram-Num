import { z } from 'zod';
import { todayIST } from '@/lib/numerology';
import { withAdmin } from '@/lib/server/admin';
import { json, readJson } from '@/lib/server/http';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';
import { analyseCompleteBusiness, writeCompleteBusiness } from '@/lib/business/complete';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const date = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a valid date');
const Body = z.object({
  ownerName: z.string().trim().min(2).max(120).regex(/[A-Za-z]/, 'Write the owner name in English letters'),
  dob: date, gender: z.enum(['male', 'female', 'other']).default('male'),
  names: z.array(z.string().trim().max(120)).min(1).max(5),
  businessType: z.string().trim().max(200).optional(), launchDate: date.optional().or(z.literal('')),
  partners: z.array(z.object({ name: z.string().trim().min(2).max(120), dob: date })).max(6).default([]),
  tagline: z.string().trim().max(160).optional(), brandColours: z.string().trim().max(200).optional(), businessMobile: z.string().trim().max(20).optional(),
  lang: z.enum(['en', 'hi']).default('en'),
});

/** Admin-only Complete Business Numerology Report (deterministic – nothing is stored). Returns the data and both language versions. */
export const POST = withAdmin(async (req, user) => {
  const rl = rateLimit(`bizfull:${user.id}`, 60, 10 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const b = Body.parse(await readJson(req));
  try {
    if (!b.names.some((n) => /[A-Za-z]/.test(n))) return json({ error: 'VALIDATION', issues: [{ path: 'names', message: 'Enter at least one business name in English letters' }] }, 422);
    const data = analyseCompleteBusiness({ owner: { name: b.ownerName, dob: b.dob, gender: b.gender }, names: b.names, businessType: b.businessType, launchDate: b.launchDate || undefined,
      partners: b.partners, tagline: b.tagline, brandColours: b.brandColours, businessMobile: b.businessMobile, asOf: todayIST() });
    return json({ data, report: { en: writeCompleteBusiness(data, 'en'), hi: writeCompleteBusiness(data, 'hi') }, generatedAt: new Date().toISOString() });
  } catch (e) {
    if (e instanceof Error && !(e as { code?: string }).code) return json({ error: 'VALIDATION', issues: [{ path: '', message: e.message }] }, 422);
    throw e;
  }
});
