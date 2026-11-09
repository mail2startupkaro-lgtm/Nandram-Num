/**
 * GET /api/admin/finance?report=sales|payments|gst|audit&from=YYYY-MM-DD&to=YYYY-MM-DD[&format=csv]
 *   payments: &status=paid|created|failed &plan=CODE &q=search
 *   gst csv:  &kind=b2b|b2cs|hsn
 */
import { auditChecks, gstSummary, parseRange, paymentRegister, rupees, salesReport, toCsv } from '@/lib/admin/finance';
import { CheckoutError, syncCashfreeOrder } from '@/lib/billing/checkout';
import { withAdmin } from '@/lib/server/admin';
import { json, NO_STORE, readJson } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const csv = (body: string, name: string) => new Response(body, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${name}"`, ...NO_STORE } });
const istDateTime = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() + 5.5 * 3600_000).toISOString().slice(0, 16).replace('T', ' ') : '');

export const GET = withAdmin(async (req) => {
  const sp = new URL(req.url).searchParams;
  const report = sp.get('report') ?? 'sales';
  const asCsv = sp.get('format') === 'csv';
  const r = parseRange(sp);
  const tag = `${r.from}_to_${r.to}`;

  if (report === 'audit') return json(await auditChecks());

  if (report === 'payments') {
    const list = await paymentRegister(r, { status: sp.get('status') ?? undefined, plan: sp.get('plan') ?? undefined, q: sp.get('q') ?? undefined });
    if (!asCsv) return json({ range: { from: r.from, to: r.to }, payments: list });
    return csv(toCsv(
      ['Created (IST)', 'Paid (IST)', 'Status', 'Plan', 'Customer', 'Email', 'Mobile', 'Billing name', 'State', 'GSTIN', 'List price', 'Coupon', 'Discount', 'Taxable', 'CGST', 'SGST', 'IGST', 'Amount', 'Invoice', 'Gateway', 'Gateway order id', 'Gateway payment id'],
      list.map((p) => [istDateTime(p.createdAt), istDateTime(p.paidAt), p.status, p.planName ?? p.planCode, p.customer, p.email, p.phone, p.billingName, p.billingState, p.gstin,
        rupees(p.listPaise), p.couponCode, rupees(p.discountPaise), rupees(p.taxablePaise), rupees(p.cgstPaise), rupees(p.sgstPaise), rupees(p.igstPaise), rupees(p.amountPaise), p.invoiceNumber, p.orderId.startsWith('cf_') ? 'Cashfree' : p.orderId.startsWith('mock_') ? 'Test mode' : 'Razorpay (old)', p.orderId, p.paymentId]),
    ), `payments_${tag}.csv`);
  }

  if (report === 'gst') {
    const g = await gstSummary(r);
    if (!asCsv) return json(g);
    const kind = sp.get('kind') ?? 'b2cs';
    if (kind === 'b2b') return csv(toCsv(['GSTIN of recipient', 'Receiver name', 'Invoice number', 'Invoice date', 'Invoice value', 'Place of supply', 'Rate', 'Taxable value', 'IGST', 'CGST', 'SGST'],
      g.b2b.map((x) => [x.gstin, x.billingName, x.invoiceNumber, x.date, rupees(x.invoiceValue), x.placeOfSupply, g.rate, rupees(x.taxable), rupees(x.igst), rupees(x.cgst), rupees(x.sgst)])), `gstr1_b2b_${tag}.csv`);
    if (kind === 'hsn') return csv(toCsv(['SAC', 'Description', 'UQC', 'Total quantity', 'Total value', 'Taxable value', 'IGST', 'CGST', 'SGST'],
      [[g.hsn.sac, g.hsn.description, 'OTH', g.hsn.quantity, rupees(g.hsn.total), rupees(g.hsn.taxable), rupees(g.hsn.igst), rupees(g.hsn.cgst), rupees(g.hsn.sgst)]]), `gstr1_hsn_${tag}.csv`);
    return csv(toCsv(['Type', 'Place of supply', 'Rate', 'Invoices', 'Taxable value', 'IGST', 'CGST', 'SGST', 'Total'],
      g.b2cs.map((x) => ['OE', x.placeOfSupply, g.rate, x.invoices, rupees(x.taxable), rupees(x.igst), rupees(x.cgst), rupees(x.sgst), rupees(x.gross)])), `gstr1_b2cs_${tag}.csv`);
  }

  const s = await salesReport(r);
  if (!asCsv) return json(s);
  return csv(toCsv(['Section', 'Item', 'Orders / uses', 'Gross (₹ incl. GST)', 'Taxable (₹)', 'Discount (₹)'], [
    ['Summary', `${r.from} to ${r.to}`, s.totals.orders, rupees(s.totals.gross), rupees(s.totals.taxable), rupees(s.totals.discount)],
    ['Summary', 'GST collected', '', rupees(s.totals.gst), '', ''],
    ...s.series.map((x) => [s.range.bucket === 'month' ? 'Month' : 'Day', x.key, x.orders, rupees(x.gross), rupees(x.taxable), '']),
    ...s.byPlan.map((x) => ['Plan', x.name, x.orders, rupees(x.gross), rupees(x.taxable), rupees(x.discount)]),
    ...s.byCoupon.map((x) => ['Coupon', x.code, x.uses, rupees(x.gross), '', rupees(x.discount)]),
    ...s.byState.map((x) => ['State', x.state, x.orders, rupees(x.gross), rupees(x.taxable), '']),
  ]), `sales_${tag}.csv`);
});

/** POST { orderId } – re-check a pending Cashfree order with the gateway and record it if it was paid. */
export const POST = withAdmin(async (req) => {
  const { orderId } = (await readJson<{ orderId?: string }>(req)) ?? {};
  if (!orderId || !orderId.startsWith('cf_')) return json({ error: 'ONLY_CASHFREE_ORDERS' }, 400);
  try { return json(await syncCashfreeOrder(orderId)); }
  catch (e) { if (e instanceof CheckoutError) return json({ error: e.code }, 400); throw e; }
});
