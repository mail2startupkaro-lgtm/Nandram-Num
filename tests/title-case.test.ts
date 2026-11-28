/** Report headings in Title Case (owner's rule, 27 Nov 2026). */
import { existsSync } from 'node:fs';
import { afterAll, describe, expect, it } from 'vitest';
import { chromium, type Browser } from 'playwright-core';
import { titleCase, TITLE_CASE_SCRIPT, withTitleCase } from '@/lib/report/title-case';

const CHROME = [process.env.LOCAL_CHROME_PATH, process.env.PDF_CHROMIUM_PATH, '/usr/bin/google-chrome', '/usr/bin/chromium', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find((p) => p && existsSync(p));
let browser: Browser | null = null;
afterAll(async () => { await browser?.close(); });
/** Runs the heading script on `html` in a real browser and returns the text of the selected elements. */
async function run(html: string, sel: string): Promise<string[]> {
  browser ??= await chromium.launch({ executablePath: CHROME, headless: true });
  const page = await browser.newPage();
  await page.setContent(html);
  await page.evaluate(TITLE_CASE_SCRIPT);
  const out = await page.$$eval(sel, (els) => els.map((e) => e.textContent ?? ''));
  await page.close();
  return out;
}

describe('titleCase', () => {
  it('capitalises the first letter of every word', () => {
    expect(titleCase('What your signature shows')).toBe('What Your Signature Shows');
    expect(titleCase('Lo Shu grid from the date of birth')).toBe('Lo Shu Grid From The Date Of Birth');
    expect(titleCase('step-by-step plan (21 days)')).toBe('Step-By-Step Plan (21 Days)');
    expect(titleCase('“sign as” R. Sharma')).toBe('“Sign As” R. Sharma');
  });
  it('leaves capitals, numbers, addresses, handles and Hindi alone', () => {
    expect(titleCase('LO SHU and CEO report')).toBe('LO SHU And CEO Report');
    expect(titleCase('visit myNumerologist.com or @MYNUMEROLOGIST8')).toBe('Visit myNumerologist.com Or @MYNUMEROLOGIST8');
    expect(titleCase('first letter 1.5× taller, e.g. now')).toBe('First Letter 1.5× Taller, e.g. Now');
    expect(titleCase('client’s iPhone')).toBe('Client’s iPhone');
    expect(titleCase('हस्ताक्षर की दिशा')).toBe('हस्ताक्षर की दिशा');
    expect(titleCase('Your Numbers at a Glance @@C:glance@@')).toBe('Your Numbers At A Glance @@C:glance@@');
  });
});

describe.skipIf(!CHROME)('titleCaseDocument (in the browser, as in the PDF engine)', () => {
  it('changes headings only, keeps split words and skips no-tc', async () => {
    const html = `<h2 class="sec-h">1 what your <b>R</b>ahul signature shows</h2><p>body text stays as it is.</p>
      <div class="serif">How your numbers were calculated</div><div class="serif">A long sentence in a serif block that ends with a full stop.</div>
      <h3 class="no-tc">keep me</h3><ol class="toc"><li><span>2</span>the numbers behind it</li></ol><h1>signature analysis report</h1>`;
    expect(await run(html, 'h2')).toEqual(['1 What Your Rahul Signature Shows']);
    expect(await run(html, 'p')).toEqual(['body text stays as it is.']);
    expect(await run(html, '.serif')).toEqual(['How Your Numbers Were Calculated', 'A long sentence in a serif block that ends with a full stop.']);
    expect(await run(html, 'h3')).toEqual(['keep me']);
    expect(await run(html, '.toc li')).toEqual(['2The Numbers Behind It']);
    expect(await run(html, 'h1')).toEqual(['Signature Analysis Report']);
  }, 30000);
  it('works in a printed report window through an inline script', async () => {
    browser ??= await chromium.launch({ executablePath: CHROME, headless: true });
    const page = await browser.newPage();
    await page.setContent(withTitleCase('<html><body><h2>numbers at a glance</h2><p>keep this</p></body></html>'));
    expect(await page.$$eval('h2,p', (e) => e.map((x) => x.textContent))).toEqual(['Numbers At A Glance', 'keep this']);
    await page.close();
  }, 30000);
});

describe('Hindi clean-up', () => {
  it('replaces the expert name, title, months and business sectors on Hindi pages only', async () => {
    const { hindiPolish, HINDI_POLISH_SCRIPT } = await import('@/lib/report/hindi-polish');
    expect(hindiPolish('Acharya Nandram · Numerologist · Vedic, Chaldean & Lo Shu')).toBe('आचार्य नंदराम · अंक ज्योतिषी · वैदिक, कैल्डियन और लो शू');
    expect(hindiPolish('28 Aug 2026 – 27 August 2027')).toBe('28 अगस्त 2026 – 27 अगस्त 2027');
    expect(hindiPolish('Health & Wellness (96)')).toBe('स्वास्थ्य और कल्याण (96)');
    if (!CHROME) return;
    browser ??= await chromium.launch({ executablePath: CHROME, headless: true });
    const page = await browser.newPage();
    for (const [lang, want] of [['hi', 'आचार्य नंदराम, 5 मई 2027'], ['en', 'Acharya Nandram, 5 May 2027']]) {
      await page.setContent(`<html lang="${lang}"><body><p>Acharya Nandram, 5 May 2027</p></body></html>`);
      await page.evaluate(HINDI_POLISH_SCRIPT);
      expect(await page.textContent('p')).toBe(want);
    }
    await page.close();
  }, 30000);
});
