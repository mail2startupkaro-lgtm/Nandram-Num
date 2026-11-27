import { googleEnabled } from '@/lib/auth/google';
import { getAccount } from '@/lib/billing/entitlements';
import { json, withOptionalUser } from '@/lib/server/http';
import { syncPendingUserPayments } from '@/lib/server/sync-pending-payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withOptionalUser(async (_req, user) => {
  const providers = { email: true, sms: true, google: googleEnabled() };
  if (!user) return json({ user: null, providers });
  // Check pending payments so user.credits and account are refreshed
  await syncPendingUserPayments(user.id);
  const acct = await getAccount(user.id);
  return json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, billingState: user.billingState }, account: acct, providers });
});
