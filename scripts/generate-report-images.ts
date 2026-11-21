import { chromium } from 'playwright-core';
import { existsSync, mkdirSync, rmSync } from 'node:fs';

const SYSTEM_CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Poppins:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 600px;
    height: 849px;
    overflow: hidden;
    background: #fdfbf7;
    font-family: 'Poppins', sans-serif;
    color: #2b2520;
    position: relative;
    padding: 32px 28px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .frame {
    position: absolute;
    inset: 12px;
    border: 1.5px solid rgba(180, 135, 45, 0.7);
    pointer-events: none;
  }
  .frame2 {
    position: absolute;
    inset: 16px;
    border: 0.5px solid rgba(180, 135, 45, 0.4);
    pointer-events: none;
  }
  .corner {
    position: absolute;
    width: 8px;
    height: 8px;
    background: #b4872d;
    transform: rotate(45deg);
  }
  .c-tl { top: 9px; left: 9px; }
  .c-tr { top: 9px; right: 9px; }
  .c-bl { bottom: 9px; left: 9px; }
  .c-br { bottom: 9px; right: 9px; }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(180, 135, 45, 0.35);
    padding-bottom: 8px;
    font-size: 10px;
    color: #7a6340;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid rgba(180, 135, 45, 0.35);
    padding-top: 8px;
    font-size: 9.5px;
    color: #8c7853;
  }
  .font-cinzel { font-family: 'Cinzel', serif; }
  .font-playfair { font-family: 'Playfair Display', serif; }
  .gold-text { color: #8e6212; }
  .seal {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    border: 2px dashed #b4872d;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(245, 230, 190, 0.3);
    color: #744e0b;
    font-size: 8px;
    font-weight: 700;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

function layout(content: string, headerRight: string, footerRight: string): string {
  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8">
      <style>${CSS}</style>
    </head>
    <body>
      <div class="frame"></div>
      <div class="frame2"></div>
      <div class="corner c-tl"></div>
      <div class="corner c-tr"></div>
      <div class="corner c-bl"></div>
      <div class="corner c-br"></div>

      <div class="header">
        <span>Acharya Nandram Numerology</span>
        <span>${headerRight}</span>
      </div>

      <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-around; padding: 12px 0;">
        ${content}
      </div>

      <div class="footer">
        <span>Personal & Confidential · Prepared by Acharya Nandram</span>
        <span>${footerRight}</span>
      </div>
    </body>
  </html>`;
}

async function run() {
  const exe = SYSTEM_CHROME_PATHS.find((p) => existsSync(p));
  console.log('Launching Chrome:', exe);
  const browser = await chromium.launch({ executablePath: exe, headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 600, height: 849 });

  const outDir = 'public/images/personal-report';
  mkdirSync(outDir, { recursive: true });

  // 1. COVER PAGE
  const page1 = layout(`
    <div style="text-align: center; padding-top: 10px;">
      <div style="font-size: 11px; letter-spacing: 0.28em; text-transform: uppercase; color: #a1731f; font-weight: 700;">
        Vedic · Chaldean · Lo Shu Numerology
      </div>
      <h1 class="font-cinzel" style="font-size: 26px; color: #4a151b; margin-top: 6px; letter-spacing: 0.04em;">
        Personal Numerology Report
      </h1>
      <p style="font-size: 12px; color: #6b5839; margin-top: 4px;">Complete Life, Destiny & Remedial Blueprint</p>
    </div>

    <div style="background: rgba(247, 237, 216, 0.6); border: 1.5px solid rgba(180, 135, 45, 0.45); border-radius: 12px; padding: 14px 18px; text-align: center; margin: 0 10px;">
      <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #8c6721; font-weight: 600;">Specially Prepared For</div>
      <div class="font-playfair" style="font-size: 28px; font-weight: 700; color: #2e1a1c; margin: 4px 0;">Riya Sharma</div>
      <div style="font-size: 12px; color: #5c4e38;">Female · Date of Birth: 14 August 1992</div>
      <div style="font-size: 11px; color: #786443; margin-top: 2px;">Report Date: November 2026 · Confidential</div>
    </div>

    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 0 10px;">
      <div style="background: #fff; border: 1.5px solid #d9be85; border-radius: 10px; padding: 10px 6px; text-align: center; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
        <div style="font-size: 9px; font-weight: 700; color: #7a5c1e; text-transform: uppercase;">Moolank</div>
        <div class="font-cinzel" style="font-size: 32px; font-weight: 800; color: #8e6212; line-height: 1.1;">5</div>
        <div style="font-size: 9px; color: #6b5c47; font-weight: 600;">Budh (Mercury)</div>
      </div>
      <div style="background: #fff; border: 1.5px solid #d9be85; border-radius: 10px; padding: 10px 6px; text-align: center; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
        <div style="font-size: 9px; font-weight: 700; color: #7a5c1e; text-transform: uppercase;">Bhagyank</div>
        <div class="font-cinzel" style="font-size: 32px; font-weight: 800; color: #8e6212; line-height: 1.1;">7</div>
        <div style="font-size: 9px; color: #6b5c47; font-weight: 600;">Ketu (Neptune)</div>
      </div>
      <div style="background: #fff; border: 1.5px solid #d9be85; border-radius: 10px; padding: 10px 6px; text-align: center; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
        <div style="font-size: 9px; font-weight: 700; color: #7a5c1e; text-transform: uppercase;">Kua Number</div>
        <div class="font-cinzel" style="font-size: 32px; font-weight: 800; color: #8e6212; line-height: 1.1;">7</div>
        <div style="font-size: 9px; color: #6b5c47; font-weight: 600;">West Group</div>
      </div>
      <div style="background: #fff; border: 1.5px solid #d9be85; border-radius: 10px; padding: 10px 6px; text-align: center; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
        <div style="font-size: 9px; font-weight: 700; color: #7a5c1e; text-transform: uppercase;">Name No.</div>
        <div class="font-cinzel" style="font-size: 32px; font-weight: 800; color: #8e6212; line-height: 1.1;">21/3</div>
        <div style="font-size: 9px; color: #6b5c47; font-weight: 600;">Crown of Magi</div>
      </div>
    </div>

    <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(245, 237, 222, 0.5); border: 1px solid #dfc79b; border-radius: 10px; padding: 12px 16px; margin: 0 10px;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <div class="seal">
          <span>Acharya</span>
          <span>Nandram</span>
          <span style="font-size: 6px;">Verified</span>
        </div>
        <div>
          <div style="font-size: 13px; font-weight: 700; color: #361f12;">Acharya Nandram</div>
          <div style="font-size: 10.5px; color: #6b5536;">Senior Numerologist & Vastu Expert · 15+ Yrs Exp</div>
          <div style="font-size: 9.5px; color: #2e7d32; font-weight: 600; margin-top: 1px;">✓ Authenticated Handcrafted Analysis</div>
        </div>
      </div>
      <div style="text-align: right; font-size: 10px; color: #786443;">
        <div>New Delhi, India</div>
        <div style="font-weight: 600;">mynumerologist.com</div>
      </div>
    </div>
  `, 'Confidential Report', 'Cover Page · 1 of 15');

  await page.setContent(page1);
  await page.screenshot({ path: `${outDir}/cover.webp`, type: 'webp', quality: 92 });
  console.log('Generated cover.webp');

  // 2. LO SHU GRID & PLANES PAGE
  const page2 = layout(`
    <div style="border-bottom: 2px solid rgba(180, 135, 45, 0.3); padding-bottom: 6px; margin: 0 10px;">
      <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #9c6e1c; font-weight: 700;">Chapter 02 · Cosmic Blueprint</div>
      <h2 class="font-cinzel" style="font-size: 20px; color: #431a20; margin-top: 2px;">Lo Shu Grid & Energy Planes</h2>
    </div>

    <div style="display: flex; gap: 16px; align-items: center; margin: 0 10px;">
      <!-- Grid visual -->
      <div style="width: 170px; height: 170px; background: #fff; border: 2.5px solid #8e6212; border-radius: 10px; display: grid; grid-template-columns: repeat(3, 1fr); padding: 4px; gap: 3px; box-shadow: 0 4px 10px rgba(142, 98, 18, 0.12);">
        <div style="background: #fdf5e2; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; color: #431a20; border-radius: 6px;">4</div>
        <div style="background: #fbeac4; display: flex; align-items: center; justify-content: center; font-size: 17px; font-weight: 800; color: #8e6212; border-radius: 6px;">9 9</div>
        <div style="background: #fdf5e2; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; color: #431a20; border-radius: 6px;">2</div>
        <div style="background: #f9f8f5; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #b5a996; border-radius: 6px;">-</div>
        <div style="background: #fbeac4; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; color: #8e6212; border-radius: 6px;">5</div>
        <div style="background: #fbeac4; display: flex; align-items: center; justify-content: center; font-size: 17px; font-weight: 800; color: #8e6212; border-radius: 6px;">7 7</div>
        <div style="background: #fdf5e2; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; color: #431a20; border-radius: 6px;">8</div>
        <div style="background: #fbeac4; display: flex; align-items: center; justify-content: center; font-size: 17px; font-weight: 800; color: #8e6212; border-radius: 6px;">1 1</div>
        <div style="background: #f9f8f5; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #b5a996; border-radius: 6px;">-</div>
      </div>

      <div style="flex: 1; font-size: 11px; line-height: 1.45;">
        <div style="font-weight: 700; color: #431a20; font-size: 13px;">Mental & Will Planes Dominance</div>
        <p style="color: #5c4e38; margin-top: 4px;">
          Riya, your 3×3 square possesses the <b>Arrow of Intellect (4-9-2)</b> and <b>Arrow of Determination (9-5-1)</b> fully energized. You carry lightning calculation and supreme perseverance.
        </p>
        <div style="margin-top: 6px; padding: 6px 10px; background: #e8f5e9; border: 1px solid #a5d6a7; border-radius: 6px; color: #1b5e20; font-size: 10px; font-weight: 600;">
          ✓ Silver Yog (2-5-8) complete: Solid land, real estate and financial growth.
        </div>
      </div>
    </div>

    <div style="display: flex; flex-direction: column; gap: 8px; margin: 0 10px;">
      <div style="background: #fff; border: 1px solid #e2d2b0; border-radius: 8px; padding: 10px 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 700; color: #1b5e20; font-size: 11.5px;">✓ Arrow of Intellect (4-9-2) — 100% Strength</span>
          <span style="background: #c8e6c9; color: #1b5e20; font-size: 9px; font-weight: 700; padding: 2px 8px; border-radius: 10px;">Active</span>
        </div>
        <p style="font-size: 10px; color: #554832; margin-top: 3px;">High mental sharpness, photographic memory, and talent for complex structural design.</p>
      </div>

      <div style="background: #fff; border: 1px solid #e2d2b0; border-radius: 8px; padding: 10px 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 700; color: #1b5e20; font-size: 11.5px;">✓ Arrow of Determination (9-5-1) — 100% Strength</span>
          <span style="background: #c8e6c9; color: #1b5e20; font-size: 9px; font-weight: 700; padding: 2px 8px; border-radius: 10px;">Active</span>
        </div>
        <p style="font-size: 10px; color: #554832; margin-top: 3px;">Unshakable stamina. Whatever project you commit to is brought to completion without compromise.</p>
      </div>

      <div style="background: #fff; border: 1px solid #f0c9c9; border-radius: 8px; padding: 10px 14px; background: #fffbfa;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 700; color: #b71c1c; font-size: 11.5px;">⚠ Missing Numbers: 3 (Jupiter) & 6 (Venus)</span>
          <span style="background: #ffcdd2; color: #b71c1c; font-size: 9px; font-weight: 700; padding: 2px 8px; border-radius: 10px;">Remedy Required</span>
        </div>
        <p style="font-size: 10px; color: #6a4c4c; margin-top: 3px;">Planning foresight (3) and domestic luxury harmony (6) require conscious daily spiritual remedies.</p>
      </div>
    </div>
  `, 'Lo Shu Grid Analysis', 'Page 4 of 15');

  await page.setContent(page2);
  await page.screenshot({ path: `${outDir}/grid.webp`, type: 'webp', quality: 92 });
  console.log('Generated grid.webp');

  // 3. CAREER, FORECAST & QUESTIONS PAGE
  const page3 = layout(`
    <div style="border-bottom: 2px solid rgba(180, 135, 45, 0.3); padding-bottom: 6px; margin: 0 10px;">
      <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #9c6e1c; font-weight: 700;">Chapter 04 · Career & Personal Questions</div>
      <h2 class="font-cinzel" style="font-size: 20px; color: #431a20; margin-top: 2px;">Personal Year 5 & Consultation Answers</h2>
    </div>

    <div style="background: rgba(247, 237, 216, 0.7); border: 1.5px solid #d9be85; border-radius: 10px; padding: 12px 16px; margin: 0 10px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 12px; font-weight: 700; color: #8e6212;">Current Personal Year: 5 (Budh / Mercury)</span>
        <span style="font-size: 10px; color: #5c4e38; font-weight: 600;">14 Aug 2026 – 13 Aug 2027</span>
      </div>
      <p style="font-size: 10.5px; color: #423522; margin-top: 5px; line-height: 1.45;">
        Year 5 acts as an accelerator of expansion, travel, brand pivots, and bold commercial leaps. This cycle heavily favors calculated career autonomy over routine corporate hierarchy.
      </p>
    </div>

    <!-- Questions answered section -->
    <div style="display: flex; flex-direction: column; gap: 8px; margin: 0 10px;">
      <div style="background: #fff; border: 1.5px solid #dfcfab; border-radius: 8px; padding: 10px 14px;">
        <div style="font-size: 11px; font-weight: 700; color: #2e1a1c;">
          Q1: "Should I start my own interior design studio this year?"
        </div>
        <div style="margin-top: 4px; padding-left: 8px; border-left: 2.5px solid #8e6212; font-size: 10px; color: #4e3d23; line-height: 1.4;">
          <b>Acharya's Verdict: YES. Highly auspicious.</b> Launch in Personal Year 5 on a date adding to 1 (e.g. 1st, 10th, 19th or 28th). Your name compound 21/3 gives superior commercial visibility in creative design fields.
        </div>
      </div>

      <div style="background: #fff; border: 1.5px solid #dfcfab; border-radius: 8px; padding: 10px 14px;">
        <div style="font-size: 11px; font-weight: 700; color: #2e1a1c;">
          Q2: "What is my financial trajectory for 2027-2028?"
        </div>
        <div style="margin-top: 4px; padding-left: 8px; border-left: 2.5px solid #8e6212; font-size: 10px; color: #4e3d23; line-height: 1.4;">
          <b>Verdict:</b> From August 2027, you enter Personal Year 6 (Venus), stabilizing family finances, followed by 2029 (Year 8) which marks your largest harvest of capital and asset accumulation. Avoid speculative gambling.
        </div>
      </div>

      <div style="background: #fff; border: 1.5px solid #dfcfab; border-radius: 8px; padding: 10px 14px;">
        <div style="font-size: 11px; font-weight: 700; color: #2e1a1c;">
          Q3: "Which business partners or employees harmonize with my chart?"
        </div>
        <div style="margin-top: 4px; padding-left: 8px; border-left: 2.5px solid #8e6212; font-size: 10px; color: #4e3d23; line-height: 1.4;">
          <b>Verdict:</b> People carrying numbers 1, 3, or 5 (Sun, Jupiter, Mercury) bring exponential synergy. Avoid taking financial loans or entering binding contracts with individuals dominated by number 8 (Saturn).
        </div>
      </div>
    </div>
  `, 'Career & Personal Answers', 'Page 8 of 15');

  await page.setContent(page3);
  await page.screenshot({ path: `${outDir}/forecast.webp`, type: 'webp', quality: 92 });
  console.log('Generated forecast.webp');

  // 4. REMEDIAL BLUEPRINT PAGE
  const page4 = layout(`
    <div style="border-bottom: 2px solid rgba(180, 135, 45, 0.3); padding-bottom: 6px; margin: 0 10px;">
      <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #9c6e1c; font-weight: 700;">Chapter 06 · Sacred Remedies</div>
      <h2 class="font-cinzel" style="font-size: 20px; color: #431a20; margin-top: 2px;">Your Personal Remedial Blueprint</h2>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 0 10px;">
      <div style="background: #fff; border: 1px solid #dfcfab; border-radius: 8px; padding: 10px 12px;">
        <div style="font-size: 10px; font-weight: 700; color: #7a5c1e; text-transform: uppercase;">Auspicious Colors</div>
        <div style="display: flex; gap: 8px; margin-top: 6px; align-items: center;">
          <div style="width: 22px; height: 22px; border-radius: 50%; background: #2e7d32; border: 1.5px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.2);"></div>
          <div style="width: 22px; height: 22px; border-radius: 50%; background: #fbc02d; border: 1.5px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.2);"></div>
          <div style="width: 22px; height: 22px; border-radius: 50%; background: #ffffff; border: 1.5px solid #ccc; box-shadow: 0 1px 4px rgba(0,0,0,0.2);"></div>
        </div>
        <p style="font-size: 9.5px; color: #5c4e38; margin-top: 6px;">Emerald Green, Sun Gold, Pristine White</p>
      </div>

      <div style="background: #fff; border: 1px solid #dfcfab; border-radius: 8px; padding: 10px 12px;">
        <div style="font-size: 10px; font-weight: 700; color: #7a5c1e; text-transform: uppercase;">Lucky Days & Deity</div>
        <div style="font-size: 13px; font-weight: 700; color: #431a20; margin-top: 4px;">Wednesday & Friday</div>
        <p style="font-size: 9.5px; color: #5c4e38; margin-top: 4px;">Lord Ganesha & Goddess Saraswati</p>
      </div>

      <div style="background: #fff; border: 1px solid #dfcfab; border-radius: 8px; padding: 10px 12px;">
        <div style="font-size: 10px; font-weight: 700; color: #7a5c1e; text-transform: uppercase;">Auspicious Vastu Direction</div>
        <div style="font-size: 13px; font-weight: 700; color: #1b5e20; margin-top: 4px;">North-West (Kua 7)</div>
        <p style="font-size: 9.5px; color: #5c4e38; margin-top: 4px;">Face North-West at your work desk for victory</p>
      </div>

      <div style="background: #fff; border: 1px solid #dfcfab; border-radius: 8px; padding: 10px 12px;">
        <div style="font-size: 10px; font-weight: 700; color: #7a5c1e; text-transform: uppercase;">Recommended Daan</div>
        <div style="font-size: 13px; font-weight: 700; color: #431a20; margin-top: 4px;">Green Moong Dal</div>
        <p style="font-size: 9.5px; color: #5c4e38; margin-top: 4px;">Feed cows on Wednesdays to activate Mercury 5</p>
      </div>
    </div>

    <!-- Sacred Mantra Card -->
    <div style="background: #fffbfa; border: 1.5px solid #e0c8b0; border-radius: 10px; padding: 12px 16px; text-align: center; margin: 0 10px;">
      <div style="font-size: 10px; font-weight: 700; color: #9c6e1c; text-transform: uppercase; letter-spacing: 0.15em;">Sacred Daily Beej Mantra</div>
      <div class="font-playfair" style="font-size: 20px; font-weight: 700; color: #4a151b; margin: 6px 0;">"ॐ ब्रां ब्रीं ब्रौं सः बुधाय नमः"</div>
      <div style="font-size: 10px; color: #6b5536;">Chant 108 times on Wednesday mornings facing East</div>
    </div>

    <div style="background: #f7eedb; border: 1px solid #dfcfab; border-radius: 8px; padding: 10px 14px; margin: 0 10px; font-size: 10px; color: #5a482b; display: flex; justify-content: space-between; align-items: center;">
      <span>Practical daily remedies requiring zero expensive rituals.</span>
      <span style="font-weight: 700; color: #8e6212;">✓ Handcrafted by Acharya Nandram</span>
    </div>
  `, 'Remedial Blueprint', 'Page 13 of 15');

  await page.setContent(page4);
  await page.screenshot({ path: `${outDir}/remedies.webp`, type: 'webp', quality: 92 });
  console.log('Generated remedies.webp');

  await browser.close();
  rmSync('scripts/test-screenshot.ts', { force: true });
  console.log('Done generating all report images!');
}

run().catch(console.error);
