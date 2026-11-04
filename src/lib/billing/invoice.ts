/** GST tax invoice PDF for a paid order. */
import type { Payment, User } from '@/lib/db/schema';
import type { SellerSettings } from '@/lib/admin/settings';
import { esc } from '@/lib/pdf/svg';
import { baseCss } from '@/lib/pdf/template';
import { DEFAULT_BRANDING, THEMES, type Branding } from '@/lib/pdf/themes';
import { renderSheetPdf } from '@/lib/pdf/render';
import { formatInr } from './plans';

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const two = (n: number) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`);
const three = (n: number) => (n >= 100 ? `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${two(n % 100)}` : ''}` : two(n));

/** Indian numbering system: 2,49,900 → "Two Lakh Forty Nine Thousand Nine Hundred". */
export function rupeesInWords(paise: number): string {
  let n = Math.floor(paise / 100);
  const p = paise % 100;
  if (n === 0 && p === 0) return 'Zero Rupees Only';
  const parts: string[] = [];
  const crore = Math.floor(n / 1e7); n %= 1e7;
  const lakh = Math.floor(n / 1e5); n %= 1e5;
  const thousand = Math.floor(n / 1e3); n %= 1e3;
  if (crore) parts.push(`${three(crore)} Crore`);
  if (lakh) parts.push(`${two(lakh)} Lakh`);
  if (thousand) parts.push(`${two(thousand)} Thousand`);
  if (n) parts.push(three(n));
  return `${parts.join(' ') || 'Zero'} Rupees${p ? ` and ${two(p)} Paise` : ''} Only`;
}

export function buildInvoiceHtml(p: Payment, user: Pick<User, 'name' | 'email' | 'phone'>, planName: string, seller: SellerSettings, brand: Branding) {
  const t = THEMES['minimal-white'];
  const date = (p.paidAt ?? p.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' });
  const taxRows = p.igstPaise
    ? `<tr><td colspan="3" style="text-align:right">IGST @ 18%</td><td style="text-align:right">${formatInr(p.igstPaise)}</td></tr>`
    : `<tr><td colspan="3" style="text-align:right">CGST @ 9%</td><td style="text-align:right">${formatInr(p.cgstPaise)}</td></tr><tr><td colspan="3" style="text-align:right">SGST @ 9%</td><td style="text-align:right">${formatInr(p.sgstPaise)}</td></tr>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${baseCss(t, 'en')}@page{size:A4;margin:18mm}
    .h{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6mm}.h h1{font-size:22pt}.box2{border:1px solid ${t.border};border-radius:2mm;padding:3mm 4mm;font-size:9pt;line-height:1.5}
    td,th{font-size:9.5pt}</style></head><body>
    <div class="h"><div><h1>Tax Invoice</h1><div class="small muted">${esc(brand.brandName)}</div></div>
      <div style="text-align:right;font-size:9.5pt"><b>${esc(p.invoiceNumber ?? 'DRAFT')}</b><br>Date: ${esc(date)}<br>Order: ${esc(p.razorpayOrderId)}<br>Payment: ${esc(p.razorpayPaymentId ?? '—')}</div></div>
    <div class="row" style="margin-bottom:6mm">
      <div class="box2"><b>Supplier</b><br>${esc(seller.legalName)}<br>${esc(seller.address)}<br>${esc(seller.state)} (State code ${esc(seller.stateCode)})${seller.gstin ? `<br>GSTIN: <b>${esc(seller.gstin)}</b>` : ''}${seller.email ? `<br>${esc(seller.email)}` : ''}</div>
      <div class="box2"><b>Bill to</b><br>${esc(p.billingName || user.name || '—')}<br>${esc(user.email ?? user.phone ?? '')}<br>Place of supply: ${esc(p.billingState ?? '—')}${p.gstin ? `<br>GSTIN: <b>${esc(p.gstin)}</b>` : ''}</div>
    </div>
    <table><thead><tr><th>Description</th><th>SAC</th><th style="text-align:right">Qty</th><th style="text-align:right">Amount</th></tr></thead><tbody>
      <tr><td>${esc(planName)} – numerology report service${p.discountPaise ? `<div class="small muted">List price ${formatInr(p.listPricePaise)} · Discount ${formatInr(p.discountPaise)}${p.couponCode ? ` (${esc(p.couponCode)})` : ''}</div>` : ''}</td><td>${esc(seller.sac)}</td><td style="text-align:right">1</td><td style="text-align:right">${formatInr(p.taxablePaise)}</td></tr>
      <tr><td colspan="3" style="text-align:right">Taxable value</td><td style="text-align:right">${formatInr(p.taxablePaise)}</td></tr>
      ${taxRows}
      <tr><td colspan="3" style="text-align:right"><b>Total (incl. GST)</b></td><td style="text-align:right"><b>${formatInr(p.amountPaise)}</b></td></tr>
    </tbody></table>
    <p style="margin-top:4mm;text-align:left"><b>Amount in words:</b> ${esc(rupeesInWords(p.amountPaise))}</p>
    <p class="small muted" style="text-align:left;margin-top:10mm">This is a computer-generated invoice and does not require a signature. Paid online via Razorpay.${seller.gstin ? '' : ' Supplier GSTIN to be added in Admin → Settings before going live.'}</p>
  </body></html>`;
}

export async function renderInvoicePdf(p: Payment, user: Pick<User, 'name' | 'email' | 'phone'>, planName: string, seller: SellerSettings) {
  const branding = { ...DEFAULT_BRANDING } as Branding;
  const t = THEMES['minimal-white'];
  return renderSheetPdf({
    html: buildInvoiceHtml(p, user, planName, seller, branding),
    header: '<span></span>', footer: `<div style="width:100%;font-size:7px;color:${t.muted};text-align:center;margin-bottom:8mm;font-family:Georgia,serif">${esc(seller.legalName)} · ${esc(p.invoiceNumber ?? '')}</div>`,
    theme: t, branding, title: `Invoice ${p.invoiceNumber}`, subject: 'Tax invoice', isoDate: (p.paidAt ?? p.createdAt).toISOString().slice(0, 10), language: 'en',
  });
}
