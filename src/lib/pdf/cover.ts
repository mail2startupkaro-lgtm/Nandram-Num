/**
 * Full-page cover for customised reports that are not built from the main report template
 * (Signature analysis, Business compatibility…). Same look as the main report cover: themed background,
 * double frame, mandala, brand, report title, "Prepared for", key facts, date and the expert.
 */
import { divider, esc, mandala, monogram, portraitPlaceholder } from './svg';
import { baseCss } from './template';
import type { Branding, PdfTheme } from './themes';

export interface CoverInput {
  /** Report name printed large in small caps, e.g. "Signature Analysis Report". */
  title: string;
  /** Optional line under the title, e.g. "Graphology & Numerology". */
  subtitle?: string;
  clientName: string;
  /** Second-script name (e.g. Hindi), optional. */
  altName?: string;
  /** Up to 4 facts shown under the name: [label, value]. Empty values are skipped. */
  facts: [string, string][];
  /** A small image shown in the middle of the cover (e.g. the client's signature), data: URL only. */
  imageDataUrl?: string;
  imageCaption?: string;
  lang: 'en' | 'hi';
  theme: PdfTheme;
  branding: Branding;
  preparedBy?: string;
}

const L = {
  en: { preparedFor: 'Prepared for', by: 'Prepared by', confidential: 'Personal & confidential' },
  hi: { preparedFor: 'के लिए तैयार', by: 'द्वारा तैयार', confidential: 'व्यक्तिगत एवं गोपनीय' },
};

const titleCase = (s: string) => s.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());

/** Body of the cover (one A4 page, no margins); wrap with `coverDocument` for a standalone page. */
export function coverInner(c: CoverInput): string {
  const t = c.theme, b = c.branding, l = L[c.lang];
  const logo = b.logoDataUrl ? `<img src="${esc(b.logoDataUrl)}" style="height:20mm" alt="">` : monogram(b.brandName, t, 72, true);
  const photo = b.photoDataUrl ? `<img src="${esc(b.photoDataUrl)}" alt="" style="width:26mm;height:26mm;border-radius:50%;object-fit:cover;border:1.5px solid ${t.coverAccent}">` : portraitPlaceholder(b.expertName, { ...t, soft: 'rgba(255,255,255,.12)', accent: t.coverAccent }, 98);
  const facts = c.facts.filter(([, v]) => v && v.trim()).slice(0, 4);
  const img = c.imageDataUrl && c.imageDataUrl.startsWith('data:image/') ? `<div class="rc-img"><img src="${esc(c.imageDataUrl)}" alt="">${c.imageCaption ? `<span>${esc(c.imageCaption)}</span>` : ''}</div>` : '';
  return `<div class="rc"><div class="rc-f1"></div><div class="rc-f2"></div>
    <div class="rc-md">${mandala(560, t.coverAccent, 0.36, 32)}</div>
    <div style="position:relative">${logo}<div class="rc-brand">${esc(b.brandName)}</div></div>
    <div style="position:relative;margin-top:${img ? 38 : 58}mm">
      <div class="rc-type">${esc(c.title)}</div>
      ${c.subtitle ? `<div class="rc-sub">${esc(c.subtitle)}</div>` : ''}
      <div class="rc-for">${esc(l.preparedFor)}</div>
      <h1 class="rc-name">${esc(titleCase(c.clientName))}</h1>
      ${c.altName ? `<div style="font-family:'Noto Sans Devanagari';font-size:15pt;margin-top:1mm">${esc(c.altName)}</div>` : ''}
      <div style="margin:5mm auto 0;width:60mm">${divider({ ...t, accent: t.coverAccent }, 220)}</div>
      ${facts.length ? `<div class="rc-meta">${facts.map(([k, v]) => `<div><span>${esc(k)}</span>${esc(v)}</div>`).join('')}</div>` : ''}
      ${img}
    </div>
    <div class="rc-exp">${photo}<div style="text-align:left"><span class="rc-lab">${esc(l.by)}</span><b>${esc(c.preparedBy || b.expertName)}</b>${esc(b.expertTitle ?? '')}</div></div>
    <div class="rc-conf">${esc(l.confidential)}${b.contactLine ? ` · ${esc(b.contactLine)}` : ''}</div>
  </div>`;
}

/** Cover CSS (scoped by the .rc class, safe to add to a longer document). */
export function coverCss(t: PdfTheme): string {
  return `
  .rc{position:relative;width:210mm;height:297mm;overflow:hidden;background:${t.coverBg};color:${t.coverInk};display:flex;flex-direction:column;align-items:center;text-align:center;padding:20mm 18mm 16mm;box-sizing:border-box;break-after:page;page-break-after:always}
  .rc-f1{position:absolute;inset:8mm;border:1px solid ${t.coverAccent}88;border-radius:2mm}
  .rc-f2{position:absolute;inset:10mm;border:.4px solid ${t.coverAccent}55;border-radius:1.5mm}
  .rc-md{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%)}
  .rc-brand{font-family:'Playfair Display',serif;font-size:14pt;letter-spacing:.12em;margin-top:3mm;color:${t.coverInk}}
  .rc-type{font-size:10pt;letter-spacing:.42em;text-transform:uppercase;color:${t.coverAccent};margin:6mm 0 2mm}
  .rc-sub{font-family:'Playfair Display',serif;font-style:italic;font-size:12pt;opacity:.9;margin-bottom:4mm}
  .rc-for{font-size:9pt;letter-spacing:.3em;text-transform:uppercase;opacity:.8}
  .rc .rc-name{color:${t.coverInk};font-size:34pt;line-height:1.1;margin:0}
  .rc-meta{display:flex;flex-wrap:wrap;gap:6mm 12mm;justify-content:center;font-size:9.5pt;margin-top:5mm}
  .rc-meta div span{display:block;font-size:7.5pt;letter-spacing:.2em;text-transform:uppercase;color:${t.coverAccent};opacity:.9}
  .rc-img{margin:7mm auto 0;display:inline-block;background:#fff;border-radius:3mm;padding:3mm 5mm;border:1px solid ${t.coverAccent}}
  .rc-img img{display:block;max-width:110mm;max-height:32mm;object-fit:contain}
  .rc-img span{display:block;font-size:7pt;letter-spacing:.2em;text-transform:uppercase;color:#7a6a55;margin-top:1mm}
  .rc-exp{position:absolute;bottom:24mm;left:0;right:0;display:flex;align-items:center;justify-content:center;gap:5mm;font-size:9.5pt}
  .rc-exp b{font-family:'Playfair Display',serif;font-size:13pt;display:block}
  .rc-lab{font-size:7.5pt;letter-spacing:.2em;text-transform:uppercase;color:${t.coverAccent}}
  .rc-conf{position:absolute;bottom:13mm;left:0;right:0;font-size:7.5pt;letter-spacing:.12em;opacity:.75}`;
}

/** A standalone one-page cover document (rendered with zero margins and prepended to the report). */
export function coverDocument(c: CoverInput): string {
  return `<!doctype html><html lang="${c.lang}"><head><meta charset="utf-8"><style>${baseCss(c.theme, c.lang)}
    @page{size:A4;margin:0}
    html,body{width:210mm;height:297mm;overflow:hidden}
    ${coverCss(c.theme)}</style></head><body>${coverInner(c)}</body></html>`;
}
