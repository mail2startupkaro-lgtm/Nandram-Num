/**
 * PDF generation service.
 *   cover (full-bleed) + body (two passes so the table of contents shows real page numbers)
 *   → pdf-lib composition: themed paper under every body page, decorative frame on top,
 *     metadata rewritten to the brand (no Chromium/Skia/AI traces).
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import QRCode from 'qrcode';
import type { Browser, Page } from 'playwright-core';
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

const SYSTEM_CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

function resolveLocalChrome(): string | undefined {
  if (process.env.LOCAL_CHROME_PATH && existsSync(process.env.LOCAL_CHROME_PATH)) {
    return process.env.LOCAL_CHROME_PATH;
  }
  for (const p of SYSTEM_CHROME_PATHS) {
    try {
      if (existsSync(p)) return p;
    } catch { /* ignore */ }
  }
  return undefined;
}

// ---------- browser pool (one shared browser per server instance) ----------
let browserPromise: Promise<Browser> | null = null;
async function getBrowser(): Promise<Browser> {
  if (browserPromise) {
    const existing = await browserPromise.catch(() => null);
    if (!existing || !existing.isConnected()) {
      browserPromise = null;
    }
  }

  if (!browserPromise) {
    browserPromise = (async () => {
      const { chromium } = await import('playwright-core');
      let executablePath = process.env.PDF_CHROMIUM_PATH;
      let args = ['--font-render-hinting=none', '--disable-dev-shm-usage', '--no-sandbox'];

      const isServerless = !!(process.env.VERCEL || process.env.AWS_EXECUTION_ENV || (process.env.NODE_ENV === 'production' && process.platform === 'linux'));
      console.log(`[pdf] getBrowser start (isServerless=${isServerless}, arch=${process.arch})`);
      const t0 = Date.now();

      if (!executablePath && isServerless) {
        try {
          console.log('[pdf] importing @sparticuz/chromium-min...');
          const chromiumMin = (await import('@sparticuz/chromium-min')).default;
          chromiumMin.setGraphicsMode = false;
          const packUrl = process.env.CHROMIUM_PACK_URL ||
            (process.arch === 'arm64'
              ? 'https://github.com/Sparticuz/chromium/releases/download/v153.0.0/chromium-v153.0.0-pack.arm64.tar'
              : 'https://github.com/Sparticuz/chromium/releases/download/v153.0.0/chromium-v153.0.0-pack.x64.tar');
          console.log(`[pdf] resolving executablePath from ${packUrl}...`);
          executablePath = await chromiumMin.executablePath(packUrl);
          console.log(`[pdf] executablePath resolved in ${Date.now() - t0}ms: ${executablePath}`);
          if (chromiumMin.args && chromiumMin.args.length > 0) {
            args = chromiumMin.args.filter((a: string) => a !== '--single-process');
          }
          if (executablePath) {
            const dir = path.dirname(executablePath);
            const al2023Lib = path.join(dir, 'al2023', 'lib');
            const libDirs = [dir, al2023Lib, '/tmp/al2023/lib'].filter((d) => {
              try { return existsSync(d); } catch { return false; }
            });
            if (libDirs.length > 0) {
              process.env.LD_LIBRARY_PATH = `${libDirs.join(':')}:${process.env.LD_LIBRARY_PATH || ''}`;
            }
          }
        } catch (e) {
          console.error('[pdf] Failed to load @sparticuz/chromium-min:', e);
        }
      }

      if (!executablePath && !isServerless) {
        executablePath = resolveLocalChrome();
      }

      console.log(`[pdf] launching chromium at ${executablePath} (elapsed: ${Date.now() - t0}ms)...`);
      const tLaunch = Date.now();
      const b = await chromium.launch({
        executablePath: executablePath || undefined,
        args,
        headless: true,
      });
      console.log(`[pdf] chromium launched successfully in ${Date.now() - tLaunch}ms (total: ${Date.now() - t0}ms)`);
      b.on('disconnected', () => {
        console.log('[pdf] browser disconnected');
        browserPromise = null;
      });
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

async function printPageToPdf(page: Page, html: string, opts: { margin0?: boolean; header?: string; footer?: string }): Promise<Uint8Array> {
  await page.setContent(html, { waitUntil: 'load' });
  await Promise.race([
    page.evaluate(() => (document as Document & { fonts: FontFaceSet }).fonts.ready.then(() => true)),
    new Promise((r) => setTimeout(r, 2000)),
  ]);
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
}

async function htmlToPdf(browser: Browser, html: string, opts: { margin0?: boolean; header?: string; footer?: string }): Promise<Uint8Array> {
  const ctx = await browser.newContext();
  try {
    const page = await ctx.newPage();
    // SSRF guard: only data:, blob:, or about: URLs allowed inside rendered HTML
    await page.route('**', (route) => {
      const u = route.request().url();
      if (u.startsWith('data:') || u.startsWith('blob:') || u.startsWith('about:')) return route.continue();
      return route.abort();
    });
    return await printPageToPdf(page, html, opts);
  } catch (err) {
    browserPromise = null;
    throw err;
  } finally {
    await ctx.close().catch(() => {});
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
  const qrSvg = await QRCode.toString(branding.bookingUrl || DEFAULT_BRANDING.bookingUrl || 'https://www.mynumerologist.com', { type: 'svg', margin: 0, width: 150, errorCorrectionLevel: 'M', color: { dark: '#111111', light: '#ffffff' } });
  const hf = headerFooter(inp);
  const browser = await getBrowser();

  const ctx = await browser.newContext();
  let cover: Uint8Array;
  let pass1: Uint8Array;
  let tocPages: Record<string, number>;
  let body: Uint8Array;

  try {
    const page = await ctx.newPage();
    await page.route('**', (route) => {
      const u = route.request().url();
      if (u.startsWith('data:') || u.startsWith('blob:') || u.startsWith('about:')) return route.continue();
      return route.abort();
    });

    console.log('[pdf] rendering cover...');
    const tCover = Date.now();
    cover = await printPageToPdf(page, buildCoverHtml(inp), { margin0: true });
    console.log(`[pdf] cover rendered in ${Date.now() - tCover}ms`);

    console.log('[pdf] rendering pass1...');
    const tPass1 = Date.now();
    pass1 = await printPageToPdf(page, buildBodyHtml(inp, null, qrSvg).html, hf);
    console.log(`[pdf] pass1 rendered in ${Date.now() - tPass1}ms`);

    console.log('[pdf] finding chapter pages...');
    const tToc = Date.now();
    tocPages = await findChapterPages(pass1);
    console.log(`[pdf] TOC pages found in ${Date.now() - tToc}ms`);

    console.log('[pdf] rendering body with TOC...');
    const tBody = Date.now();
    body = await printPageToPdf(page, buildBodyHtml(inp, tocPages, qrSvg).html, hf);
    console.log(`[pdf] body rendered in ${Date.now() - tBody}ms`);
  } catch (err) {
    browserPromise = null;
    throw err;
  } finally {
    await ctx.close().catch(() => {});
  }

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
