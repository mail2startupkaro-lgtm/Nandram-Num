/** Admin financial reporting: sales summary, payment register, GST (GSTR-1 style) summary and audit checks. Amounts in paise. */
import { sql, type SQL } from 'drizzle-orm';
import { getDb, type Db } from '@/lib/db/client';
import { getSetting } from './settings';
import type { Currency } from '@/lib/billing/currency';

/** Payments in one currency only – ₹ and $ amounts are never added together. */
const pay = (c: Currency) => sql`(select * from payments where currency = ${c})`;

const IST_MS = 5.5 * 3600_000;
const isoIST = (d: Date) => new Date(d.getTime() + IST_MS).toISOString().slice(0, 10);

export interface Range { from: string; to: string; start: Date; end: Date; days: number; currency: Currency }

/** from/to are inclusive IST dates (YYYY-MM-DD). Default: the current month to today. */
export function parseRange(sp: URLSearchParams): Range {
  const today = isoIST(new Date());
  const ok = (s: string | null) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) ? s : null);
  let from = ok(sp.get('from')) ?? `${today.slice(0, 8)}01`;
  let to = ok(sp.get('to')) ?? today;
  if (from > to) [from, to] = [to, from];
  const start = new Date(`${from}T00:00:00+05:30`);
  const end = new Date(new Date(`${to}T00:00:00+05:30`).getTime() + 86_400_000);
  const currency: Currency = sp.get('currency') === 'USD' ? 'USD' : 'INR';
  return { from, to, start, end, days: Math.round((end.getTime() - start.getTime()) / 86_400_000), currency };
}

const rows = async <T,>(db: Db, q: SQL) => (await db.execute(q)).rows as T[];
const num = (v: unknown) => Number(v ?? 0);

async function totals(db: Db, start: Date, end: Date, cur: Currency) {
  const P = pay(cur);
  const [t] = await rows<Record<string, unknown>>(db, sql`
    select count(*)::int orders, coalesce(sum(amount_paise),0)::bigint gross, coalesce(sum(list_price_paise),0)::bigint list,
      coalesce(sum(discount_paise),0)::bigint discount, coalesce(sum(taxable_paise),0)::bigint taxable,
      coalesce(sum(cgst_paise),0)::bigint cgst, coalesce(sum(sgst_paise),0)::bigint sgst, coalesce(sum(igst_paise),0)::bigint igst,
      count(distinct user_id)::int customers
    from ${P} payments where status = 'paid' and paid_at >= ${start} and paid_at < ${end}`);
  const o = Object.fromEntries(Object.entries(t).map(([k, v]) => [k, num(v)])) as Record<'orders' | 'gross' | 'list' | 'discount' | 'taxable' | 'cgst' | 'sgst' | 'igst' | 'customers', number>;
  return { ...o, gst: o.cgst + o.sgst + o.igst, aov: o.orders ? Math.round(o.gross / o.orders) : 0 };
}

export async function salesReport(r: Range, db: Db = getDb()) {
  const P = pay(r.currency);
  const span = r.end.getTime() - r.start.getTime();
  const [cur, prev] = await Promise.all([totals(db, r.start, r.end, r.currency), totals(db, new Date(r.start.getTime() - span), r.start, r.currency)]);
  const bucket = r.days > 62 ? 'month' : 'day';
  const fmt = bucket === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD';

  const [series, byPlan, byCoupon, byState, funnel, top, [newC], [credits], [outstanding], mrr] = await Promise.all([
    rows<{ k: string; orders: number; gross: string; taxable: string }>(db, sql`
      select to_char(date_trunc(${bucket}, paid_at at time zone 'Asia/Kolkata'), ${fmt}) k, count(*)::int orders, sum(amount_paise)::bigint gross, sum(taxable_paise)::bigint taxable
      from ${P} payments where status = 'paid' and paid_at >= ${r.start} and paid_at < ${r.end} group by 1 order by 1`),
    rows<{ code: string; name: string | null; orders: number; gross: string; discount: string; taxable: string }>(db, sql`
      select p.plan_code code, coalesce(pl.name, sv.en->>'name') "name", count(*)::int orders, sum(p.amount_paise)::bigint gross, sum(p.discount_paise)::bigint discount, sum(p.taxable_paise)::bigint taxable
      from ${P} p left join plans pl on pl.code = p.plan_code left join services sv on sv.code = p.plan_code
      where p.status = 'paid' and p.paid_at >= ${r.start} and p.paid_at < ${r.end} group by 1, 2 order by 4 desc`),
    rows<{ code: string; uses: number; discount: string; gross: string }>(db, sql`
      select coupon_code code, count(*)::int uses, sum(discount_paise)::bigint discount, sum(amount_paise)::bigint gross
      from ${P} payments where status = 'paid' and coupon_code is not null and paid_at >= ${r.start} and paid_at < ${r.end} group by 1 order by 3 desc`),
    rows<{ state: string; orders: number; taxable: string; cgst: string; sgst: string; igst: string; gross: string }>(db, sql`
      select coalesce(nullif(billing_state, ''), 'Not given') state, count(*)::int orders, sum(taxable_paise)::bigint taxable, sum(cgst_paise)::bigint cgst,
        sum(sgst_paise)::bigint sgst, sum(igst_paise)::bigint igst, sum(amount_paise)::bigint gross
      from ${P} payments where status = 'paid' and paid_at >= ${r.start} and paid_at < ${r.end} group by 1 order by 7 desc`),
    rows<{ status: string; n: number; gross: string }>(db, sql`
      select status::text, count(*)::int n, coalesce(sum(amount_paise),0)::bigint gross from ${P} payments where created_at >= ${r.start} and created_at < ${r.end} group by 1`),
    rows<{ name: string | null; email: string | null; phone: string | null; orders: number; gross: string }>(db, sql`
      select u.name, u.email, u.phone, count(*)::int orders, sum(p.amount_paise)::bigint gross
      from ${P} p join users u on u.id = p.user_id
      where p.status = 'paid' and p.paid_at >= ${r.start} and p.paid_at < ${r.end} group by u.id, u.name, u.email, u.phone order by 5 desc limit 10`),
    rows<{ n: number }>(db, sql`
      select count(*)::int n from (select user_id, min(paid_at) first from ${P} payments where status = 'paid' group by 1) f where f.first >= ${r.start} and f.first < ${r.end}`),
    rows<{ issued: string; used: string }>(db, sql`
      select coalesce(sum(delta) filter (where delta > 0),0)::bigint issued, coalesce(-sum(delta) filter (where delta < 0),0)::bigint used
      from credit_ledger where created_at >= ${r.start} and created_at < ${r.end}`),
    rows<{ n: string }>(db, sql`select coalesce(sum(credits),0)::bigint n from users`),
    rows<{ code: string; subs: number; mrr: string }>(db, sql`
      select s.plan_code code, count(*)::int subs, coalesce(sum(round(pl.price_paise * 30.0 / nullif(pl.interval_days, 0))),0)::bigint mrr
      from subscriptions s left join plans pl on pl.code = s.plan_code where s.current_period_end > now() group by 1`),
  ]);

  const f = Object.fromEntries(funnel.map((x) => [x.status, { n: x.n, gross: num(x.gross) }])) as Record<string, { n: number; gross: number }>;
  const attempts = (f.created?.n ?? 0) + (f.paid?.n ?? 0) + (f.failed?.n ?? 0);
  const delta = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 1000) / 10 : null);

  return {
    range: { from: r.from, to: r.to, days: r.days, bucket, currency: r.currency },
    totals: { ...cur, newCustomers: num(newC?.n), repeatCustomers: Math.max(0, cur.customers - num(newC?.n)), avgPerDay: Math.round(cur.gross / Math.max(1, r.days)) },
    previous: { gross: prev.gross, orders: prev.orders, grossChangePct: delta(cur.gross, prev.gross), ordersChangePct: delta(cur.orders, prev.orders) },
    series: series.map((x) => ({ key: x.k, orders: x.orders, gross: num(x.gross), taxable: num(x.taxable) })),
    byPlan: byPlan.map((x) => ({ code: x.code, name: x.name ?? x.code, orders: x.orders, gross: num(x.gross), discount: num(x.discount), taxable: num(x.taxable), share: cur.gross ? Math.round((num(x.gross) / cur.gross) * 1000) / 10 : 0 })),
    byCoupon: byCoupon.map((x) => ({ code: x.code, uses: x.uses, discount: num(x.discount), gross: num(x.gross) })),
    byState: byState.map((x) => ({ state: x.state, orders: x.orders, taxable: num(x.taxable), cgst: num(x.cgst), sgst: num(x.sgst), igst: num(x.igst), gross: num(x.gross) })),
    funnel: { attempts, paid: f.paid?.n ?? 0, failed: f.failed?.n ?? 0, pending: f.created?.n ?? 0, successRate: attempts ? Math.round(((f.paid?.n ?? 0) / attempts) * 1000) / 10 : null, lostValue: (f.failed?.gross ?? 0) + (f.created?.gross ?? 0) },
    topCustomers: top.map((x) => ({ who: x.name || x.email || x.phone || '—', contact: x.email ?? x.phone ?? '', orders: x.orders, gross: num(x.gross) })),
    credits: { issued: num(credits?.issued), used: num(credits?.used), outstanding: num(outstanding?.n) },
    subscriptions: { active: mrr.reduce((a, x) => a + x.subs, 0), mrr: mrr.reduce((a, x) => a + num(x.mrr), 0), byPlan: mrr.map((x) => ({ code: x.code, subs: x.subs, mrr: num(x.mrr) })) },
  };
}

export interface PaymentFilters { status?: string; plan?: string; q?: string }

/** Payment register: every order created in the range (any status). */
export async function paymentRegister(r: Range, f: PaymentFilters, db: Db = getDb()) {
  const P = pay(r.currency);
  const conds: SQL[] = [sql`p.created_at >= ${r.start}`, sql`p.created_at < ${r.end}`];
  if (f.status && ['created', 'paid', 'failed'].includes(f.status)) conds.push(sql`p.status = ${f.status}::payment_status`);
  if (f.plan) conds.push(sql`p.plan_code = ${f.plan}`);
  if (f.q?.trim()) {
    const like = `%${f.q.trim().replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
    conds.push(sql`(u.email ilike ${like} or u.phone ilike ${like} or u.name ilike ${like} or p.billing_name ilike ${like} or p.razorpay_order_id ilike ${like} or p.razorpay_payment_id ilike ${like} or p.invoice_number ilike ${like} or p.gstin ilike ${like})`);
  }
  const list = await rows<Record<string, unknown>>(db, sql`
    select p.id, p.created_at "createdAt", p.paid_at "paidAt", p.status::text status, p.plan_code "planCode", coalesce(pl.name, sv.en->>'name') "planName",
      u.name "customer", u.email, u.phone, p.billing_name "billingName", p.billing_state "billingState", p.gstin,
      p.list_price_paise "listPaise", p.discount_paise "discountPaise", p.coupon_code "couponCode", p.taxable_paise "taxablePaise",
      p.cgst_paise "cgstPaise", p.sgst_paise "sgstPaise", p.igst_paise "igstPaise", p.amount_paise "amountPaise",
      p.invoice_number "invoiceNumber", p.razorpay_order_id "orderId", p.razorpay_payment_id "paymentId"
    from ${P} p join users u on u.id = p.user_id left join plans pl on pl.code = p.plan_code left join services sv on sv.code = p.plan_code
    where ${sql.join(conds, sql` and `)} order by p.created_at desc limit 2000`);
  return list.map((x) => ({ ...x, createdAt: new Date(x.createdAt as string).toISOString(), paidAt: x.paidAt ? new Date(x.paidAt as string).toISOString() : null })) as PaymentRow[];
}
export interface PaymentRow {
  id: string; createdAt: string; paidAt: string | null; status: string; planCode: string; planName: string | null; customer: string | null; email: string | null; phone: string | null;
  billingName: string | null; billingState: string | null; gstin: string | null; listPaise: number; discountPaise: number; couponCode: string | null; taxablePaise: number;
  cgstPaise: number; sgstPaise: number; igstPaise: number; amountPaise: number; invoiceNumber: string | null; orderId: string; paymentId: string | null;
}

/** GSTR-1 style summary for paid invoices in the range (by invoice date = paid date). */
export async function gstSummary(r: Range, db: Db = getDb()) {
  const P = pay(r.currency);
  const seller = await getSetting('seller', db);
  const paidInRange = sql`status = 'paid' and paid_at >= ${r.start} and paid_at < ${r.end}`;
  const [b2b, b2cs, [docs]] = await Promise.all([
    rows<Record<string, unknown>>(db, sql`
      select invoice_number "invoiceNumber", paid_at "date", gstin, billing_name "billingName", coalesce(billing_state,'') "placeOfSupply",
        amount_paise "invoiceValue", taxable_paise taxable, cgst_paise cgst, sgst_paise sgst, igst_paise igst
      from ${P} payments where ${paidInRange} and gstin is not null and gstin <> '' order by paid_at`),
    rows<Record<string, unknown>>(db, sql`
      select coalesce(nullif(billing_state,''),'Not given') "placeOfSupply", count(*)::int invoices, sum(taxable_paise)::bigint taxable,
        sum(cgst_paise)::bigint cgst, sum(sgst_paise)::bigint sgst, sum(igst_paise)::bigint igst, sum(amount_paise)::bigint gross
      from ${P} payments where ${paidInRange} and (gstin is null or gstin = '') group by 1 order by 1`),
    rows<Record<string, unknown>>(db, sql`
      select count(*)::int n, min(invoice_number) first, max(invoice_number) last, coalesce(sum(taxable_paise),0)::bigint taxable,
        coalesce(sum(cgst_paise),0)::bigint cgst, coalesce(sum(sgst_paise),0)::bigint sgst, coalesce(sum(igst_paise),0)::bigint igst, coalesce(sum(amount_paise),0)::bigint gross
      from ${P} payments where ${paidInRange}`),
  ]);
  const n = (o: Record<string, unknown>, k: string) => num(o[k]);
  return {
    range: { from: r.from, to: r.to, currency: r.currency }, sellerGstin: seller.gstin, sellerState: seller.state, sac: seller.sac, rate: 18,
    b2b: b2b.map((x) => ({ invoiceNumber: String(x.invoiceNumber ?? ''), date: isoIST(new Date(x.date as string)), gstin: String(x.gstin), billingName: String(x.billingName ?? ''), placeOfSupply: String(x.placeOfSupply), invoiceValue: n(x, 'invoiceValue'), taxable: n(x, 'taxable'), cgst: n(x, 'cgst'), sgst: n(x, 'sgst'), igst: n(x, 'igst') })),
    b2cs: b2cs.map((x) => ({ placeOfSupply: String(x.placeOfSupply), invoices: n(x, 'invoices'), taxable: n(x, 'taxable'), cgst: n(x, 'cgst'), sgst: n(x, 'sgst'), igst: n(x, 'igst'), gross: n(x, 'gross') })),
    hsn: { sac: seller.sac, description: 'Astrology / numerology reports & consultation', quantity: n(docs, 'n'), taxable: n(docs, 'taxable'), cgst: n(docs, 'cgst'), sgst: n(docs, 'sgst'), igst: n(docs, 'igst'), total: n(docs, 'gross') },
    documents: { count: n(docs, 'n'), first: (docs.first as string) ?? null, last: (docs.last as string) ?? null },
  };
}

/** Data-quality checks that keep the books right. */
export async function auditChecks(db: Db = getDb()) {
  const [noInvoice, mathOff, stuck, invoices, badGstin] = await Promise.all([
    rows<{ id: string; orderId: string; paidAt: string }>(db, sql`select id, razorpay_order_id "orderId", paid_at "paidAt" from payments where status = 'paid' and invoice_number is null order by paid_at desc limit 50`),
    rows<{ id: string; invoiceNumber: string | null; amount: number; parts: number; list: number; discount: number }>(db, sql`
      select id, invoice_number "invoiceNumber", amount_paise amount, taxable_paise + cgst_paise + sgst_paise + igst_paise parts, list_price_paise list, discount_paise discount
      from payments where status = 'paid' and (abs(amount_paise - (taxable_paise + cgst_paise + sgst_paise + igst_paise)) > 1 or amount_paise <> list_price_paise - discount_paise) limit 50`),
    rows<{ id: string; orderId: string; createdAt: string; amount: number; email: string | null; phone: string | null }>(db, sql`
      select p.id, p.razorpay_order_id "orderId", p.created_at "createdAt", p.amount_paise amount, u.email, u.phone
      from payments p join users u on u.id = p.user_id where p.status = 'created' and p.created_at < now() - interval '30 minutes' and p.created_at > now() - interval '30 days'
      order by p.created_at desc limit 50`),
    rows<{ invoiceNumber: string }>(db, sql`select invoice_number "invoiceNumber" from payments where invoice_number is not null`),
    rows<{ invoiceNumber: string | null; gstin: string }>(db, sql`select invoice_number "invoiceNumber", gstin from payments where status = 'paid' and gstin is not null and gstin <> '' and gstin !~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$'`),
  ]);
  // Gaps in invoice numbering per prefix + financial year (e.g. INV/2026-27/00007).
  const series = new Map<string, number[]>();
  for (const { invoiceNumber } of invoices) {
    const m = /^(.*\/)(\d+)$/.exec(invoiceNumber);
    if (!m) continue;
    series.set(m[1], [...(series.get(m[1]) ?? []), Number(m[2])]);
  }
  const gaps: { series: string; missing: number[] }[] = [];
  for (const [k, list] of series) {
    const have = new Set(list);
    const max = Math.max(...list);
    const missing: number[] = [];
    for (let i = 1; i <= max && missing.length < 50; i++) if (!have.has(i)) missing.push(i);
    if (missing.length) gaps.push({ series: k, missing });
  }
  return { paidWithoutInvoice: noInvoice, amountMismatch: mathOff, pendingOver30Min: stuck.map((x) => ({ ...x, createdAt: new Date(x.createdAt).toISOString() })), invoiceGaps: gaps, invalidGstin: badGstin };
}

/** RFC-4180 CSV with a BOM so Excel opens ₹ and Hindi text correctly. */
export function toCsv(header: string[], data: (string | number | null | undefined)[][]): string {
  const cell = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? '' : String(v);
    const safe = /^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s) ? `'${s}` : s; // block spreadsheet formula injection
    return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  return '﻿' + [header, ...data].map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n';
}
export const rupees = (paise: number) => (paise / 100).toFixed(2);
