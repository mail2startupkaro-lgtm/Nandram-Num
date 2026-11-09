import { z } from 'zod';
import { parseDate, todayIST } from '@/lib/numerology';
import { withAdmin } from '@/lib/server/admin';
import { json, readJson } from '@/lib/server/http';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';
import { runBusinessAgent } from '@/lib/business/agent';
import { SECTORS } from '@/lib/business/catalogue';
import { businessAnalytics } from '@/lib/business/engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const txt = (max: number) => z.string().trim().max(max).optional();
const Body = z.object({
  fullName: z.string().trim().min(2).max(120).regex(/[A-Za-z]/, 'Name must contain Latin letters'),
  commonName: txt(120), dob: z.string().trim().min(8).max(10), gender: z.enum(['male', 'female', 'other']).default('male'),
  birthPlace: z.string().trim().min(2).max(80), currentCity: txt(80), businessName: txt(120),
  mode: z.enum(['business', 'profession', 'both']).default('both'), capital: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
  risk: z.enum(['low', 'medium', 'high']).default('medium'), interests: z.array(z.enum(SECTORS)).max(10).default([]),
  education: txt(120), currentWork: txt(160), goals: txt(1000), language: z.enum(['en', 'hi', 'hinglish']).default('en'),
});
const CAP = ['', 'Low (up to ₹5 lakh)', 'Medium (₹5–50 lakh)', 'High (above ₹50 lakh)'];
const MODE = { business: 'own business', profession: 'job / profession', both: 'business or profession' };

/** Admin-only Business / Profession compatibility: analytical data + AI agent report. Nothing is stored. */
export const POST = withAdmin(async (req, user) => {
  const rl = rateLimit(`biz:${user.id}`, 30, 10 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const b = Body.parse(await readJson(req));
  const data = businessAnalytics({ ...b, dob: parseDate(b.dob), asOf: todayIST() });
  const ai = await runBusinessAgent({ fullName: b.fullName, dobText: b.dob, birthPlace: b.birthPlace, currentCity: b.currentCity, businessName: b.businessName,
    mode: MODE[b.mode], capitalLabel: CAP[b.capital], risk: b.risk, interests: b.interests, education: b.education, currentWork: b.currentWork, goals: b.goals, language: b.language }, data);
  return json({ data, ...ai, generatedAt: new Date().toISOString() });
});
