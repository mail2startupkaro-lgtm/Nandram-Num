import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { getAccount } from '@/lib/billing/entitlements';
import { getDb } from '@/lib/db/client';
import { creditLedger, payments, users } from '@/lib/db/schema';
import { eraseAccount } from '@/lib/auth/account-security';
import { listServiceOrders, listServices } from '@/lib/billing/services';
import { deliveryState, intakeToClientInput, isAutoService } from '@/lib/service-delivery';
import { clearSessionCookie } from '@/lib/auth/session';
import { json, readJson, withUser } from '@/lib/server/http';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';
import { syncPendingUserPayments } from '@/lib/server/sync-pending-payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withUser(async (_req, user) => {
  // Reconcile pending gateway payments (throttled to once a minute per user; a slow gateway never blocks the page for long).
  await Promise.race([syncPendingUserPayments(user.id), new Promise((ok) => setTimeout(ok, 4000))]);

  const db = getDb();
  // All reads run in parallel; one failing section (e.g. service orders) never takes the whole page down.
  const [pays, ledger, account, serviceOrders] = await Promise.all([
    db.select({ id: payments.id, planCode: payments.planCode, amountPaise: payments.amountPaise, currency: payments.currency, status: payments.status, invoiceNumber: payments.invoiceNumber, createdAt: payments.createdAt, paidAt: payments.paidAt })
      .from(payments).where(eq(payments.userId, user.id)).orderBy(desc(payments.createdAt)).limit(50),
    db.select().from(creditLedger).where(eq(creditLedger.userId, user.id)).orderBy(desc(creditLedger.createdAt)).limit(50).catch(() => []),
    getAccount(user.id),
    myServiceOrders(user.id, user.email).catch((e) => { console.error('[account] service orders:', e instanceof Error ? e.message : e); return []; }),
  ]);
  return json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, billingState: user.billingState, hasPassword: !!user.passwordHash }, account, payments: pays, ledger, serviceOrders });
});

/** Paid service orders with their live delivery status (shown in My reports and My account). */
async function myServiceOrders(userId: string, email: string | null) {
  const [orders, catalogue] = await Promise.all([listServiceOrders({ userId }), listServices({ includeInactive: true }).catch(() => [])]);
  const names = new Map(catalogue.map((s) => [s.code, { en: s.en.name, hi: s.hi.name }]));
  const now = new Date();
  return orders.filter((o) => o.status !== 'awaiting_payment' && o.payment.status === 'paid').map((o) => {
    const auto = isAutoService(o.serviceCode);
    const d = o.details as Record<string, string | undefined>;
    return {
      id: o.id, serviceCode: o.serviceCode, name: names.get(o.serviceCode) ?? null, status: o.status, createdAt: o.createdAt, paidAt: o.payment.paidAt, deliveredAt: o.deliveredAt,
      invoiceNumber: o.payment.invoiceNumber, forName: d.clientName || d.currentName || d.businessName || null, forRelation: d.forRelation ?? null, forProfileId: d.forProfileId ?? null,
      auto, needsDetails: auto && !intakeToClientInput(o.serviceCode, d, { email }),
      delivery: deliveryState({ status: o.status, paidAt: o.payment.paidAt, deliveredAt: o.deliveredAt, onHold: o.onHold, hasFile: o.hasReportFile, auto }, now),
    };
  });
}

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
