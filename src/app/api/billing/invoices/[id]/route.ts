import { eq } from 'drizzle-orm';
import { getSetting } from '@/lib/admin/settings';
import { renderInvoicePdf } from '@/lib/billing/invoice';
import { getPlan } from '@/lib/billing/plans';
import { getService, isServiceCode } from '@/lib/billing/services';
import { getDb } from '@/lib/db/client';
import { payments, users } from '@/lib/db/schema';
import { json, pdfResponse, withUser } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withUser<{ id: string }>(async (_req, user, { params }) => {
  const db = getDb();
  const [p] = await db.select().from(payments).where(eq(payments.id, params.id)).limit(1);
  if (!p || (p.userId !== user.id && user.role !== 'super_admin')) return json({ error: 'NOT_FOUND' }, 404);
  if (p.status !== 'paid') return json({ error: 'NOT_PAID' }, 409);
  const [buyer] = await db.select().from(users).where(eq(users.id, p.userId)).limit(1);
  const itemName = isServiceCode(p.planCode) ? (await getService(p.planCode))?.en.name : (await getPlan(p.planCode))?.name;
  const out = await renderInvoicePdf(p, buyer, itemName ?? p.planCode, await getSetting('seller'));
  return pdfResponse(out.pdf, `${(p.invoiceNumber ?? 'invoice').replace(/\//g, '-')}.pdf`);
});
