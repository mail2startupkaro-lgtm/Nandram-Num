import { z } from 'zod';
import { withAdmin } from '@/lib/server/admin';
import { json, readJson } from '@/lib/server/http';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';
import { answerClientQuestions } from '@/lib/report/client-questions';
import { isoDob } from '@/lib/service-delivery';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const Body = z.object({ questions: z.string().max(3000), name: z.string().max(120).optional(), dob: z.string().max(10), gender: z.string().max(10).optional(), lang: z.enum(['en', 'hi']).default('en') });

/** Admin report generators: the client's questions answered from their numbers (for reports printed in the browser). */
export const POST = withAdmin(async (req, user) => {
  const rl = rateLimit(`cq:${user.id}`, 60, 10 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const b = Body.parse(await readJson(req, 20_000));
  return json({ qa: await answerClientQuestions({ questions: b.questions, name: b.name, dob: isoDob(b.dob), gender: b.gender, lang: b.lang }) });
});
