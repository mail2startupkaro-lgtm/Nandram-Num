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
export async function syncPendingUserPayments(userId: string) {
  try {
    const db = getDb();
    // Only check payments created in the last 7 days that are still in 'created' status
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
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
