/**
 * Client-safe helpers for the admin reports that print in the browser (Destiny Matrix, Pythagoras Square,
 * Complete Business, Business Compatibility, Celebrity, Name calculator): a contents list, and the
 * Report Reading Guide + services CTA that /api/admin/report-cover returns when `extras` is requested.
 */
export type PrintExtrasKind = 'personal' | 'mobile' | 'signature' | 'baby' | 'business' | 'compat' | 'destiny' | 'psychomatrix' | 'celebrity' | 'name';
export interface PrintExtras { css: string; guide: string; cta: string }
export interface CoverWithExtras { css: string; html: string; extras?: PrintExtras }

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

export const PRINT_TOC_CSS = `.ptoc{margin:16px 0 4px;border:1px solid #e5d3a1;border-radius:12px;padding:14px 20px;background:#fff;break-inside:avoid}
.ptoc h2{margin:0 0 8px!important;border:0!important;padding:0!important;font-size:18px}.ptoc ol{margin:0;padding:0;list-style:none;columns:2;column-gap:28px}
.ptoc li{display:flex;gap:8px;align-items:baseline;break-inside:avoid;padding:3px 0;border-bottom:1px dotted #e5d3a1;font-size:13px}.ptoc li b{color:#b8892b;min-width:22px;font-family:Georgia,serif}
.pend{break-before:page}`;

/** Contents list (section titles in order) – the Reading Guide goes right after it. */
export function printContents(titles: string[], lang: 'en' | 'hi'): string {
  return `<div class="ptoc"><h2>${lang === 'hi' ? 'विषय सूची' : 'Contents'}</h2><ol>${titles.map((t, i) => `<li><b>${String(i + 1).padStart(2, '0')}</b><span>${esc(t)}</span></li>`).join('')}</ol></div>`;
}

/** Contents + guide block placed after the report header. */
export const contentsAndGuide = (titles: string[], lang: 'en' | 'hi', ex?: PrintExtras) => `${printContents(titles, lang)}${ex?.guide ?? ''}`;
/** Services CTA placed at the end of the report, on its own page. */
export const endCta = (ex?: PrintExtras) => (ex?.cta ? `<section class="pend">${ex.cta}</section>` : '');
export const extrasCss = (ex?: PrintExtras) => `${PRINT_TOC_CSS}${ex?.css ?? ''}`;
