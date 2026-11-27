import { z } from 'zod';
import { listServices, isPayable } from '@/lib/billing/services';
import { listPlans } from '@/lib/billing/plans';
import { serviceUsd } from '@/lib/billing/currency';
import { ACCOUNT_RE, IFSC_RE, UPI_RE } from '@/lib/affiliate/program';
import { AffiliateError, affiliateDashboard, applyAffiliate, updateAffiliateProfile } from '@/lib/affiliate/store';
import { SERVICE_PAGES } from '@/lib/service-pages';
import { json, readJson, withUser } from '@/lib/server/http';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const fail = (e: unknown) => { if (e instanceof AffiliateError) return json({ error: e.message }, e.status); throw e; };

/** The signed-in user's affiliate account: status, link, earnings, commissions, payouts and the products to promote. */
export const GET = withUser(async (_req, user) => {
  const d = await affiliateDashboard(user.id);
  const [svcs, plans] = await Promise.all([listServices().catch(() => []), listPlans().catch(() => [])]);
  const names: Record<string, { en: string; hi: string }> = {};
  for (const s of svcs) names[s.code] = { en: s.en.name, hi: s.hi.name };
  for (const p of plans) names[p.code] = { en: p.name, hi: p.name };
  const products = svcs.filter(isPayable).map((s) => {
    const page = SERVICE_PAGES.find((p) => p.serviceCode === s.code);
    return { code: s.code, name: { en: s.en.name, hi: s.hi.name }, path: page ? `/${page.slug}` : '/services', pricePaise: s.pricePaise, usdCents: serviceUsd(s).usd };
  });
  const life = plans.find((p) => p.code === 'SINGLE' && p.active && p.pricePaise > 0);
  if (life) products.unshift({ code: life.code, name: { en: 'Complete Life Report (PDF)', hi: 'संपूर्ण जीवन रिपोर्ट (PDF)' }, path: '/pricing', pricePaise: life.pricePaise, usdCents: null });
  return json({ ...d, names, products, user: { name: user.name, phone: user.phone } });
});

const Payout = z.discriminatedUnion('payoutMethod', [
  z.object({ payoutMethod: z.literal('upi'), payout: z.object({ upi: z.string().trim().regex(UPI_RE, 'Enter a valid UPI ID, e.g. name@okaxis') }) }),
  z.object({ payoutMethod: z.literal('bank'), payout: z.object({
    accountName: z.string().trim().min(2).max(100), accountNumber: z.string().trim().regex(ACCOUNT_RE, 'Enter the account number (9–18 digits)'),
    ifsc: z.string().trim().toUpperCase().regex(IFSC_RE, 'Enter a valid IFSC, e.g. SBIN0001234'), bankName: z.string().trim().max(80).optional(),
  }) }),
]);
const Apply = z.object({
  name: z.string().trim().min(2).max(120), phone: z.string().trim().max(20).optional(), channel: z.string().trim().max(300).optional(),
  audience: z.enum(['under1k', '1k-10k', '10k-50k', '50k-1L', 'over1L', 'offline']).optional(), promotion: z.string().trim().max(1500).optional(),
  agree: z.literal(true, { errorMap: () => ({ message: 'Please accept the affiliate terms' }) }),
}).and(Payout.or(z.object({ payoutMethod: z.undefined().optional() })));

/** Apply to join the program. */
export const POST = withUser(async (req, user) => {
  const rl = rateLimit(`affapply:${user.id}`, 5, 60 * 60_000); if (!rl.ok) return tooMany(rl.retryAfter);
  const b = Apply.parse(await readJson(req, 10_000));
  try {
    const a = await applyAffiliate(user.id, { name: b.name, phone: b.phone, channel: b.channel, audience: b.audience, promotion: b.promotion, ...('payout' in b ? { payoutMethod: b.payoutMethod, payout: b.payout } : {}) });
    return json({ ok: true, code: a.code, status: a.status }, 201);
  } catch (e) { return fail(e); }
});

/** Update contact / payout details. */
export const PATCH = withUser(async (req, user) => {
  const b = z.object({ phone: z.string().trim().max(20).optional(), channel: z.string().trim().max(300).optional() }).and(Payout.or(z.object({ payoutMethod: z.undefined().optional() }))).parse(await readJson(req, 10_000));
  try {
    await updateAffiliateProfile(user.id, { phone: b.phone, channel: b.channel, ...('payout' in b ? { payoutMethod: b.payoutMethod, payout: b.payout } : {}) });
    return json({ ok: true });
  } catch (e) { return fail(e); }
});
