/**
 * PDF generation service.
 *   cover (full-bleed) + body (two passes so the table of contents shows real page numbers)
 *   → pdf-lib composition: themed paper under every body page, decorative frame on top,
 *     metadata rewritten to the brand (no Chromium/Skia/AI traces).
 */
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import QRCode from 'qrcode';
import type { Browser } from 'playwright-core';
import type { NumerologyResult } from '@/lib/numerology';
import { generateNarrative, type Narrative } from '@/lib/narrative/service';
import type { LlmProvider } from '@/lib/narrative/providers/llm';
import type { NarrativeLanguage } from '@/lib/narrative/plan';
import { buildBodyHtml, buildCoverHtml, headerFooter, labelsFor, type TemplateInput } from './template';
import { DEFAULT_BRANDING, resolveTheme, type Branding, type PdfTheme, type ThemeId } from './themes';

export interface PdfRequest {
  result: NumerologyResult;
  narrative?: Narrative;
  language?: NarrativeLanguage;
  theme?: ThemeId;
  branding?: Partial<Branding>;
  watermark?: string;        // e.g. Free plan
  reportDate?: string;       // ISO, defaults to result.asOf
  provider?: LlmProvider | null;
  hiddenChapters?: string[];
  expertNote?: string;
}

export interface PdfOutput {
  pdf: Uint8Array;
  pageCount: number;
  tocPages: Record<string, number>;
  ms: number;
}

// ---------- browser pool (one shared browser per server instance) ----------
let browserPromise: Promise<Browser> | null = null;
async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = (async () => {
      const { chromium } = await import('playwright-core');
      const b = await chromium.launch({
        executablePath: process.env.PDF_CHROMIUM_PATH || undefined,
        args: ['--font-render-hinting=none', '--disable-dev-shm-usage', '--no-sandbox'],
      });
      b.on('disconnected', () => { browserPromise = null; });
      return b;
    })().catch((e) => { browserPromise = null; throw e; });
  }
  return browserPromise;
}

export async function closeBrowser() {
  const b = await browserPromise?.catch(() => null);
  browserPromise = null;
  await b?.close();
}

async function htmlToPdf(browser: Browser, html: string, opts: { margin0?: boolean; header?: string; footer?: string }): Promise<Uint8Array> {
  const ctx = await browser.newContext();
  try {
    const page = await ctx.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => (document as Document & { fonts: FontFaceSet }).fonts.ready.then(() => true));
    const buf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: !!(opts.header || opts.footer),
      headerTemplate: opts.header ?? '<span></span>',
      footerTemplate: opts.footer ?? '<span></span>',
      margin: opts.margin0 ? { top: '0', right: '0', bottom: '0', left: '0' } : undefined,
    });
    return new Uint8Array(buf);
  } finally {
    await ctx.close();
  }
}

/** Finds `@@C:<id>@@` markers (invisible text placed in chapter titles) and returns id → page number. */
async function findChapterPages(pdf: Uint8Array): Promise<Record<string, number>> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: pdf.slice(), isEvalSupported: false, disableFontFace: true, useSystemFonts: false, verbosity: 0 }).promise;
  const out: Record<string, number> = {};
  for (let i = 1; i <= doc.numPages; i++) {
    const tc = await (await doc.getPage(i)).getTextContent();
    const text = tc.items.map((x) => ('str' in x ? x.str : '')).join('');
    for (const m of text.matchAll(/@@C:([a-zA-Z]+)@@/g)) if (!(m[1] in out)) out[m[1]] = i;
  }
  await doc.destroy();
  return out;
}

const hex = (h: string) => {
  const n = h.replace('#', '');
  return rgb(parseInt(n.slice(0, 2), 16) / 255, parseInt(n.slice(2, 4), 16) / 255, parseInt(n.slice(4, 6), 16) / 255);
};
const MM = 72 / 25.4;

/** Draws the theme paper under each page and the decorative frame on top (Chromium cannot paint page margins). */
export async function appendFramedPages(out: PDFDocument, source: Uint8Array, theme: PdfTheme) {
  const srcDoc = await PDFDocument.load(source);
  const embedded = await out.embedPages(srcDoc.getPages());
  const paper = hex(theme.paper), frame = hex(theme.border), accent = hex(theme.accent);
  for (const ep of embedded) {
    const { width, height } = ep;
    const page = out.addPage([width, height]);
    page.drawRectangle({ x: 0, y: 0, width, height, color: paper });
    page.drawPage(ep, { x: 0, y: 0, width, height });
    const o = 6 * MM, i2 = 7.3 * MM;
    page.drawRectangle({ x: o, y: o, width: width - 2 * o, height: height - 2 * o, borderColor: frame, borderWidth: 0.9, opacity: 0, borderOpacity: 0.85 });
    page.drawRectangle({ x: i2, y: i2, width: width - 2 * i2, height: height - 2 * i2, borderColor: frame, borderWidth: 0.35, opacity: 0, borderOpacity: 0.6 });
    for (const [x, y] of [[o, o], [width - o, o], [o, height - o], [width - o, height - o]]) {
      const s = 6; // diamond centred on each frame corner
      page.drawRectangle({ x, y: y - s / Math.SQRT2, width: s, height: s, color: accent, rotate: degrees(45) });
    }
  }
}

/** Every generated PDF carries only the brand in its metadata. */
export function brandMetadata(out: PDFDocument, branding: Branding, subject: string, isoDate: string, language: string) {
  out.setAuthor(branding.brandName);
  out.setSubject(subject);
  out.setKeywords(['numerology', branding.brandName]);
  out.setCreator(branding.brandName);
  out.setProducer(branding.brandName);
  const when = new Date(`${isoDate}T09:00:00+05:30`);
  out.setCreationDate(when);
  out.setModificationDate(when);
  out.setLanguage(language === 'hi' ? 'hi-IN' : 'en-IN');
}

/** Single-pass render for short documents (Input Sheet, Output Sheet). */
export async function renderSheetPdf(opts: { html: string; header: string; footer: string; theme: PdfTheme; branding: Branding; title: string; subject: string; isoDate: string; language: string }): Promise<{ pdf: Uint8Array; pageCount: number; ms: number }> {
  const t0 = Date.now();
  const browser = await getBrowser();
  const body = await htmlToPdf(browser, opts.html, { header: opts.header, footer: opts.footer });
  const out = await PDFDocument.create();
  await appendFramedPages(out, body, opts.theme);
  out.setTitle(opts.title, { showInWindowTitleBar: true });
  brandMetadata(out, opts.branding, opts.subject, opts.isoDate, opts.language);
  const pdf = await out.save({ useObjectStreams: true });
  return { pdf, pageCount: out.getPageCount(), ms: Date.now() - t0 };
}

export async function renderReportPdf(req: PdfRequest): Promise<PdfOutput> {
  const t0 = Date.now();
  const branding: Branding = { ...DEFAULT_BRANDING, ...(req.branding ?? {}) } as Branding;
  const theme = resolveTheme(req.theme, branding);
  const narrative = req.narrative ?? (await generateNarrative(req.result, { language: req.language, provider: req.provider ?? null }));

  const inp: TemplateInput = { result: req.result, narrative, theme, branding, reportDate: req.reportDate ?? req.result.asOf, watermark: req.watermark, hiddenChapters: req.hiddenChapters, expertNote: req.expertNote };
  const qrSvg = await QRCode.toString(branding.bookingUrl || 'https://example.com', { type: 'svg', margin: 0, width: 150, errorCorrectionLevel: 'M', color: { dark: '#111111', light: '#ffffff' } });
  const hf = headerFooter(inp);
  const browser = await getBrowser();

  const [cover, pass1] = await Promise.all([
    htmlToPdf(browser, buildCoverHtml(inp), { margin0: true }),
    htmlToPdf(browser, buildBodyHtml(inp, null, qrSvg).html, hf),
  ]);
  const tocPages = await findChapterPages(pass1);
  const body = await htmlToPdf(browser, buildBodyHtml(inp, tocPages, qrSvg).html, hf);

  // ---------- compose ----------
  const out = await PDFDocument.create();
  const coverDoc = await PDFDocument.load(cover);
  const [coverPage] = await out.copyPages(coverDoc, [0]);
  out.addPage(coverPage);

  await appendFramedPages(out, body, theme);

  const lab = labelsFor(narrative.language);
  const client = req.result.client.commonName || req.result.client.fullName;
  out.setTitle(`${client} – Numerology Report`, { showInWindowTitleBar: true });
  brandMetadata(out, branding, lab.reportTypes[(req.result.modules ?? ['complete']).length > 1 ? 'complete' : (req.result.modules?.[0] ?? 'complete')] ?? 'Numerology Report', inp.reportDate, narrative.language);

  const pdf = await out.save({ useObjectStreams: true });
  return { pdf, pageCount: out.getPageCount(), tocPages, ms: Date.now() - t0 };
}
