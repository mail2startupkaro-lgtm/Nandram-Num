import { z } from 'zod';
import { createShareLink, listShareLinks, revokeShareLink } from '@/lib/db/repo/shares';
import { getAccount, isReportUnlocked } from '@/lib/billing/entitlements';
import { getReport } from '@/lib/db/repo/reports';
import { PaymentRequiredError } from '@/lib/server/http';
import { appOrigin, json, readJson, withUser } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type P = { id: string };

export const GET = withUser<P>(async (_req, user, { params }) => json({ links: await listShareLinks(user.id, params.id) }));

export const POST = withUser<P>(async (req, user, { params }) => {
  const body = z.object({ days: z.number().int().min(1).max(30).default(7), password: z.string().min(4).max(64).optional() }).parse(await readJson(req));
  await getReport(user.id, params.id);
  if (!(await getAccount(user.id)).features.share && !(await isReportUnlocked(params.id))) throw new PaymentRequiredError('share_requires_unlock');
  const link = await createShareLink(user.id, params.id, body);
  const url = `${appOrigin(req)}/s/${link.token}`;
  const text = `Your numerology report is ready. View it here: ${url}${link.passwordProtected ? ' (password shared separately)' : ''}`;
  return json({
    ...link, url,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
    email: `mailto:?subject=${encodeURIComponent('Your numerology report')}&body=${encodeURIComponent(text)}`,
  }, 201);
});

export const DELETE = withUser<P>(async (req, user) => {
  const shareId = new URL(req.url).searchParams.get('shareId');
  if (shareId) await revokeShareLink(user.id, shareId);
  return json({ ok: true });
});
