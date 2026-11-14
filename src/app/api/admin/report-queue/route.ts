import { z } from 'zod';
import { adminQueueAction, listQueue } from '@/lib/report-queue';
import { NotFoundError } from '@/lib/db/repo/profiles';
import { withAdmin } from '@/lib/server/admin';
import { json, readJson } from '@/lib/server/http';
import { deliverReportByEmail } from '@/lib/server/report-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withAdmin(async () => json({ items: await listQueue() }));
export const POST = withAdmin(async (req) => {
  const b = z.object({ id: z.string().min(1), action: z.enum(['release', 'hold', 'resume']) }).parse(await readJson(req));
  if (!(await adminQueueAction(b.id, b.action))) throw new NotFoundError('REPORT_NOT_FOUND');
  if (b.action === 'release') {
    deliverReportByEmail({ reportId: b.id }).catch((err) => {
      console.warn('[Admin Report Queue] Release email delivery error:', err);
    });
  }
  return json({ ok: true });
});
