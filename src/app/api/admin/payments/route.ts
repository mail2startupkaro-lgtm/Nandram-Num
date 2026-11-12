import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { payments, users } from '@/lib/db/schema';
import { withAdmin } from '@/lib/server/admin';
import { json } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withAdmin(async () => {
  const rows = await getDb().select({
    id: payments.id, planCode: payments.planCode, status: payments.status, amountPaise: payments.amountPaise, currency: payments.currency, discountPaise: payments.discountPaise, couponCode: payments.couponCode,
    invoiceNumber: payments.invoiceNumber, gatewayOrderId: payments.gatewayOrderId, createdAt: payments.createdAt, paidAt: payments.paidAt, email: users.email, phone: users.phone,
  }).from(payments).innerJoin(users, eq(users.id, payments.userId)).orderBy(desc(payments.createdAt)).limit(200);
  return json({ payments: rows });
});
