import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { getAccount } from '@/lib/billing/entitlements';
import { getDb } from '@/lib/db/client';
import { creditLedger, payments, users } from '@/lib/db/schema';
import { json, readJson, withUser } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withUser(async (_req, user) => {
  const db = getDb();
  const pays = await db.select({ id: payments.id, planCode: payments.planCode, amountPaise: payments.amountPaise, status: payments.status, invoiceNumber: payments.invoiceNumber, createdAt: payments.createdAt, paidAt: payments.paidAt })
    .from(payments).where(eq(payments.userId, user.id)).orderBy(desc(payments.createdAt)).limit(50);
  const ledger = await db.select().from(creditLedger).where(eq(creditLedger.userId, user.id)).orderBy(desc(creditLedger.createdAt)).limit(50);
  return json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, billingState: user.billingState }, account: await getAccount(user.id), payments: pays, ledger });
});

export const PATCH = withUser(async (req, user) => {
  const b = z.object({ name: z.string().min(1).max(120).optional() }).parse(await readJson(req));
  if (b.name) await getDb().update(users).set({ name: b.name }).where(eq(users.id, user.id));
  return json({ ok: true });
});
