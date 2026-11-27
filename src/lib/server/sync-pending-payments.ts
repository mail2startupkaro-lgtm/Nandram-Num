import { and, desc, eq, gt } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { payments } from '@/lib/db/schema';
import { isCashfreeOrder } from '@/lib/billing/cashfree';
import { isRazorpayOrder } from '@/lib/billing/razorpay';
import { syncCashfreeOrder, syncRazorpayFromGateway } from '@/lib/billing/checkout';

/**
 * Checks and reconciles any recent 'created' payments for a user against the payment gateways.
 * If a customer completed a payment (via UPI app, redirect, or without the frontend callback firing),
 * this automatically verifies with Cashfree or Razorpay and credits their account / fulfils the service order.
 */
/** Last check per user: My reports polls /api/account every 30 s, so the gateways are asked at most once a minute per user. */
const lastSync = new Map<string, number>();
const SYNC_EVERY_MS = 60_000;

export async function syncPendingUserPayments(userId: string, opts: { force?: boolean } = {}) {
  const now = Date.now();
  if (!opts.force && now - (lastSync.get(userId) ?? 0) < SYNC_EVERY_MS) return;
  lastSync.set(userId, now);
  if (lastSync.size > 5000) for (const [k, t] of lastSync) if (now - t > SYNC_EVERY_MS) lastSync.delete(k);
  try {
    const db = getDb();
    // Only check payments created in the last 3 days that are still in 'created' status (older checkouts were abandoned)
    const sevenDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const pendingPayments = await db
      .select({ id: payments.id, gatewayOrderId: payments.gatewayOrderId })
      .from(payments)
      .where(and(eq(payments.userId, userId), eq(payments.status, 'created'), gt(payments.createdAt, sevenDaysAgo)))
      .orderBy(desc(payments.createdAt))
      .limit(5);

    for (const p of pendingPayments) {
      const orderId = p.gatewayOrderId;
      if (!orderId) continue;
      try {
        if (isCashfreeOrder(orderId)) {
          await syncCashfreeOrder(orderId, db);
        } else if (isRazorpayOrder(orderId)) {
          await syncRazorpayFromGateway(orderId, db);
        }
      } catch (err) {
        // Individual order check failure should not block other checks or the page request
        console.warn(`[SyncPending] Failed to sync order ${orderId}:`, err instanceof Error ? err.message : err);
      }
    }
  } catch (err) {
    console.warn('[SyncPending] Error checking pending payments for user:', err instanceof Error ? err.message : err);
  }
}
