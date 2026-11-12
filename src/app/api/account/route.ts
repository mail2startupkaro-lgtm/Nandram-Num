import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { getAccount } from '@/lib/billing/entitlements';
import { getDb } from '@/lib/db/client';
import { creditLedger, payments, users } from '@/lib/db/schema';
import { eraseAccount } from '@/lib/auth/account-security';
import { listServiceOrders } from '@/lib/billing/services';
import { clearSessionCookie } from '@/lib/auth/session';
import { json, readJson, withUser } from '@/lib/server/http';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withUser(async (_req, user) => {
  const db = getDb();
  const pays = await db.select({ id: payments.id, planCode: payments.planCode, amountPaise: payments.amountPaise, status: payments.status, invoiceNumber: payments.invoiceNumber, createdAt: payments.createdAt, paidAt: payments.paidAt })
    .from(payments).where(eq(payments.userId, user.id)).orderBy(desc(payments.createdAt)).limit(50);
  const ledger = await db.select().from(creditLedger).where(eq(creditLedger.userId, user.id)).orderBy(desc(creditLedger.createdAt)).limit(50);
  return json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, billingState: user.billingState, hasPassword: !!user.passwordHash }, account: await getAccount(user.id), payments: pays, ledger,
    serviceOrders: (await listServiceOrders({ userId: user.id })).filter((o) => o.status !== 'awaiting_payment').map((o) => ({ id: o.id, serviceCode: o.serviceCode, status: o.status, createdAt: o.createdAt, deliveredAt: o.deliveredAt, invoiceNumber: o.payment.invoiceNumber })) });
});

export const PATCH = withUser(async (req, user) => {
  const b = z.object({ name: z.string().min(1).max(120).optional() }).parse(await readJson(req));
  if (b.name) await getDb().update(users).set({ name: b.name }).where(eq(users.id, user.id));
  return json({ ok: true });
});

/** Erase my account and saved data. Requires the password and the word DELETE. */
export const DELETE = withUser(async (req, user) => {
  const rl = rateLimit(`erase:${user.id}`, 5, 15 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const b = z.object({ password: z.string().max(200).default(''), confirm: z.literal('DELETE') }).parse(await readJson(req, 10_000));
  const outcome = await eraseAccount(user, b.password);
  return json({ ok: true, outcome }, 200, { 'set-cookie': clearSessionCookie() });
});
