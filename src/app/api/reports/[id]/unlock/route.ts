import { z } from 'zod';
import { getReport } from '@/lib/db/repo/reports';
import { getAccount, unlockReport } from '@/lib/billing/entitlements';
import { json, readJson, withUser } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withUser<{ id: string }>(async (req, user, { params }) => {
  await getReport(user.id, params.id); // ownership
  const { useCredit } = z.object({ useCredit: z.boolean().default(false) }).parse(await readJson(req).catch(() => ({})));
  const how = await unlockReport(user, params.id, { useCredit });
  return json({ unlocked: true, how, account: await getAccount(user.id) });
});
