import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { generateNumerology } from '../src/lib/numerology';
import { closeBrowser, renderReportPdf } from '../src/lib/pdf/render';

const SYSTEM_CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

async function run() {
  const result = generateNumerology(
    {
      fullName: 'Riya Sharma',
      commonName: 'Riya Sharma',
      gender: 'female',
      dob: '14-08-1992',
      profession: 'Architect',
      maritalStatus: 'single',
      city: 'Jaipur',
      state: 'Rajasthan',
      concerns: ['career', 'money', 'marriage'],
      mobile: '9876543210',
      language: 'en',
    },
    { asOf: { day: 27, month: 11, year: 2026 }, modules: ['complete'] }
  );

  console.log('Rendering actual Complete Life Report PDF...');
  const out = await renderReportPdf({
    result,
    theme: 'royal-gold-maroon',
    reportTitle: 'Complete Life Report',
  });
  await closeBrowser();
  console.log('PDF rendered:', out.pageCount, 'pages. TOC:', out.tocPages);

  const exe = SYSTEM_CHROME_PATHS.find((p) => existsSync(p));
  const browser = await chromium.launch({ executablePath: exe, headless: true });
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 1.5 });

  const pdfB64 = Buffer.from(out.pdf).toString('base64');
  const pdfJsCode = readFileSync(path.resolve('node_modules/pdfjs-dist/legacy/build/pdf.mjs'), 'utf8')
    .replace(/export\s*\{[\s\S]*?\};?\s*$/, '');
  const workerB64 = readFileSync(path.resolve('node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')).toString('base64');

  await page.setContent(`
    <!doctype html>
    <html>
      <body style="margin:0;padding:0;background:#fff;overflow:hidden;">
        <canvas id="c" style="display:block;width:794px;height:1123px;"></canvas>
        <script type="module">
          import * as pdfjsLib from 'data:text/javascript;base64,${Buffer.from(readFileSync(path.resolve('node_modules/pdfjs-dist/build/pdf.mjs'))).toString('base64')}';
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'data:text/javascript;base64,${workerB64}';
          const bytes = Uint8Array.from(atob('${pdfB64}'), c => c.charCodeAt(0));
          window.__pdfDoc = await pdfjsLib.getDocument({ data: bytes }).promise;
          window.__renderPage = async (num) => {
            const p = await window.__pdfDoc.getPage(num);
            const vp = p.getViewport({ scale: 1191 / p.getViewport({ scale: 1 }).width });
            const canvas = document.getElementById('c');
            canvas.width = vp.width;
            canvas.height = vp.height;
            await p.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
          };
        </script>
      </body>
    </html>
  `);

  await page.waitForFunction(() => Boolean((window as unknown as { __pdfDoc?: unknown }).__pdfDoc));

  const coverPage = 1;
  const gridPage = (out.tocPages.grid ?? 6) + 1; // +1 because cover is page 1 and body starts at page 2
  const forecastPage = (out.tocPages.timing ?? 9) + 1;
  const remediesPage = (out.tocPages.remedies ?? 19) + 1;

  const targets: [string, number][] = [
    ['cover.webp', Math.min(coverPage, out.pageCount)],
    ['grid.webp', Math.min(gridPage, out.pageCount)],
    ['forecast.webp', Math.min(forecastPage, out.pageCount)],
    ['remedies.webp', Math.min(remediesPage, out.pageCount)],
  ];

  const outDir = path.resolve('public/images/personal-report');
  mkdirSync(outDir, { recursive: true });

  for (const [name, pNum] of targets) {
    console.log(`Capturing ${name} from PDF page ${pNum}...`);
    await page.evaluate((n) => (window as unknown as { __renderPage: (n: number) => Promise<void> }).__renderPage(n), pNum);
    await page.screenshot({ path: path.join(outDir, name), type: 'webp', quality: 90 });
  }

  await browser.close();
  console.log('Done! Sample images updated from actual PDF.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
