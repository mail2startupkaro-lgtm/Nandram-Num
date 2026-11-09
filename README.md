# Numerology Prediction SaaS

**Status:** Phase 1 (engine) ✅ · Phase 2 (input wizard + results page) ✅ · Phase 3 (narrative layer) ✅ · Phase 4 (PDF reports) ✅ · Phase 5 (save, import/export, sheets, sharing) ✅ · Phase 6 (login, payments, admin, SEO) ✅

```bash
npm install
cp .env.example .env.local      # set DATABASE_URL and ENCRYPTION_KEY (openssl rand -base64 32)
npm run db:migrate              # creates the tables
npm run dev                     # http://localhost:3000  →  /reading, /dashboard
npm test                        # TEST_DATABASE_URL=… also runs the database tests
```

## Phase 6 – Login, roles, payments, admin, white-label, SEO

**Login** (`src/lib/auth`)
- **Email OTP** (Resend), **mobile OTP** (MSG91, DLT template) and **Google** (OAuth 2.0 + PKCE).
- Codes are 6 digits, valid for 10 minutes, and stored only as hashes.
- Limits: 5 wrong tries per code, 5 codes per hour per address, a 30-second gap between codes, 20 per hour per IP.
- Sessions are opaque httpOnly cookies (`nsid`, 30 days). Only a hash of the token is stored.
- `src/middleware.ts` protects `/dashboard`, `/admin`, `/account` and `/settings`.
- Every state-changing API checks the request origin (CSRF protection).

**Roles:** `super_admin` (any email in `SUPER_ADMIN_EMAILS`), `expert` (assigned by an admin, or automatically on buying Pro) and `customer`. An admin can disable a user, which also ends all their sessions.

**Plans** (INR, GST-inclusive, editable in Admin → Plans)

| Plan | Price | What it gives |
|---|---|---|
| Free | ₹0 | On-screen reading, watermarked Date of Birth preview PDF, watermarked snapshot, 3 saved clients |
| Single Report | ₹499 | 1 credit |
| 5 Report Credits | ₹1,999 | 5 credits |
| Pro Monthly | ₹2,499 / 30 days | Unlimited full reports, white-label, bulk import/export, share links |
| Pro Yearly | ₹24,999 / 365 days | Same as Pro Monthly |

- One credit unlocks a client's report **for good**: regenerated versions of the same report type stay unlocked.
- The app asks for confirmation before spending a credit.
- Pro is a prepaid period; buying again extends it. Recurring subscriptions can be added later.

**Cashfree Payments** (`src/lib/billing`) – the only payment gateway
- Orders API (2023-08-01) → `payment_session_id` → Cashfree JS v3 checkout (modal).
- The server never trusts the browser: it re-fetches the order and its payments from Cashfree (PAID + SUCCESS for the exact amount) before fulfilling. The webhook is checked with base64 HMAC-SHA256(timestamp + body, secret key).
- Fulfilment is **idempotent**: the browser callback and the webhook can both arrive and the order is still granted once.
- Coupons can be a percentage or a fixed amount, with an optional usage limit, expiry and plan restriction.
- Every paid order gets a **GST tax invoice** PDF. Numbers run sequentially per financial year (`INV/2026-27/00001`). The tax is split into CGST + SGST for buyers in your state and IGST for other states, the amount is printed in words, and a business GSTIN is optional.
- In development without Cashfree keys, a test mode adds a "Simulate payment" button. It can never run in production (a live server without keys refuses orders).
- Older orders created through Razorpay (if any) stay readable in the admin reports; the database columns keep their original names (`razorpay_order_id`, `razorpay_payment_id`), so no migration of the payments table is needed.

**Admin panel** (`/admin`)
- Overview: users, experts, active Pro, reports, revenue by month, popular report types, sales by plan.
- Users: change role, add credits, grant Pro, disable.
- Plans, coupons and payments (with invoice links).
- **Knowledge base editor:** your own interpretations override the defaults, per language. A change takes effect on the next report.
- PDF themes: enable or disable themes, set the default, override colours.
- **Writer prompt templates:** extra house-style rules and per-section briefs.
- Invoice / GST seller settings.

**White-label** (`/settings/branding`, Pro): brand name, expert name, title, contact, website, **booking link** (shown as a QR code on the last page), logo, photo and signature, theme colours and default theme.
- Uploaded images are checked by their file signature: PNG, JPEG or WebP only, at most 400 KB, no SVG.
- The expert's name also becomes the voice of the written report.

**SEO**
- `/calculators` plus six free calculator pages (Moolank, Bhagyank, Lo Shu, name, mobile, Kua). Each has its own metadata, canonical URL and FAQ + WebApplication JSON-LD, and a call to action leading to the full reading.
- Also included: `/pricing`; `/terms`, `/privacy` (DPDP) and `/refund` templates; `sitemap.xml`; `robots.txt`.

**Abuse protection:** per-IP rate limits on calculate, narrative, PDF and OTP. Anonymous visitors get the offline writer only, so they cause no LLM cost. Free PDFs are recalculated as Date-of-Birth-only on the server.

## Deployment (Vercel + Supabase)

1. **Supabase:** create a project in the Mumbai region (`ap-south-1`) for data residency. Copy the *transaction pooler* connection string (port 6543) into `DATABASE_URL`.
2. **Secrets:** run `openssl rand -base64 32` and set the result as `ENCRYPTION_KEY`. Back it up safely: without it, saved data cannot be decrypted.
3. **Migrate:** run `DATABASE_URL=… npm run db:migrate` locally, or as a deploy step.
4. **Vercel:** import the repository, framework *Next.js*, and set every variable from `.env.example` (`APP_URL` = your domain).
5. **PDF rendering needs Chromium.** On Vercel, add `@sparticuz/chromium`, set `PDF_CHROMIUM_PATH` to its `executablePath()`, and give the PDF routes up to 1 GB of memory. Alternatively, deploy the same app on a small VM, Railway or Render with `npx playwright install chromium`; that is simpler and faster when PDF volume is high.
6. **Cashfree:** add `CASHFREE_APP_ID` and `CASHFREE_SECRET_KEY` (production keys) to the hosting env, whitelist your domain in the Cashfree dashboard, and create the webhook `https://yourdomain/api/billing/cashfree/webhook` (API version 2023-08-01; events PAYMENT_SUCCESS, PAYMENT_FAILED, PAYMENT_USER_DROPPED).
7. **Login providers:** verify your sending domain in Resend; register a DLT template with MSG91; create a Google OAuth client with redirect URI `https://yourdomain/api/auth/google/callback`.
8. Sign in with an email listed in `SUPER_ADMIN_EMAILS`, then fill in Admin → Invoice settings (GSTIN, address, SAC confirmed by your CA) and review the plans.
9. Optional: `LLM_PROVIDER` / `LLM_MODEL` / API key for the AI writer; `BOOKING_URL`; `BRAND_NAME` / `EXPERT_NAME`.

## Phase 5 – Save, history, Input/Output Sheets, JSON & CSV, sharing

**Database.** It's PostgreSQL (Supabase, Neon or any Postgres 14+) accessed through **Drizzle ORM**. The schema is in `src/lib/db/schema.ts` and the SQL migrations in `drizzle/`.

*Why not Prisma?* Prisma's engine binaries could not be downloaded or verified in the build environment. Drizzle is pure TypeScript and also avoids engine bundling problems on serverless hosts. All data access goes through `src/lib/db/repo/*`, so switching ORMs later would touch only that folder.

**Privacy**
- Client inputs, results and report text are stored **AES-256-GCM encrypted** (`ENCRYPTION_KEY`; rotation is supported via `ENCRYPTION_KEY_PREVIOUS`).
- No column can hold an Aadhaar number, only its last 4 digits.
- The repository refuses to save anything containing a 12-digit number.
- Share links store only a SHA-256 hash of the token. Share passwords are hashed with scrypt.
- Deleting a profile hard-deletes all its reports and links (DPDP erasure).

**Saved data**
- Profiles: create / list and search / edit / duplicate (copies the latest version of each report) / delete.
- Reports are versioned per profile and report type. You can open, regenerate (from the stored inputs), edit the report text (Expert Review), or delete a version.
- Results sent by the browser are **recalculated on the server** before saving, so tampered numbers can't be stored.

**Sheets**
- **Input Sheet** PDF (1–2 pages): all details, Aadhaar masked, consent date, signature lines, privacy note.
- **Output Sheet**: a one-page Numerology Snapshot with core numbers, Lo Shu grid, Personal Year chart, scores, lucky items and the top 5 remedies.

**JSON**
- Export format is `schemaVersion: 2` (`numerology.profile` / `numerology.bundle`), containing inputs, every report version, report text and theme.
- Import validates with Zod and gives clear errors (for example `profiles[2].input.dob: Enter a valid date`).
- It also accepts the older v1 results-page export and bare input objects, and refuses files from newer app versions.
- Imported numbers are recalculated, with a warning if they differed.
- The export → import round trip is covered by tests.

**CSV:** bulk import and export of clients (template columns are in `CSV_COLUMNS`). Each row is validated and errors report row numbers. Cells are protected against spreadsheet formula injection. Import with `?generate=1` creates a report for each imported row.

**Sharing**
- `/s/<token>` links expire after 1–30 days and can have an optional password.
- They can be revoked, and views are counted.
- The dialog has Copy, WhatsApp (`wa.me`) and Email buttons.
- A shared PDF is only available once the report text is final.

**Login:** see Phase 6.

| API | |
|---|---|
| `GET/POST /api/profiles` | list (search `q`) / create (+ save the on-screen reading) |
| `GET/PATCH/DELETE /api/profiles/:id` | read with report history / edit inputs / erase |
| `POST /api/profiles/:id/duplicate` | copy profile + latest reports |
| `POST /api/profiles/:id/reports` | `{mode:'save', result, narrative}` or `{mode:'regenerate', aadhaar?}` → new version |
| `GET /api/profiles/:id/export?all=1` · `GET /api/profiles/:id/input-sheet` | JSON export · Input Sheet PDF |
| `GET/PATCH/DELETE /api/reports/:id` | read / update narrative, status, theme / delete version |
| `GET /api/reports/:id/pdf?kind=report\|output\|input&theme=` | full report, snapshot, input sheet |
| `GET/POST/DELETE /api/reports/:id/share` | list / create (`days`, `password`) / revoke |
| `GET /api/export?format=json\|csv` · `POST /api/import` | bulk export · import JSON or CSV (`?generate=1`, `?dryRun=1`) |
| `POST /api/share/:token` · `POST /api/share/:token/pdf` | public share view and PDF |

**Supabase setup:** create a project, then copy the connection string from *Project Settings → Database* into `DATABASE_URL`. For serverless, use the transaction pooler on port 6543. Then run `npm run db:migrate`.

## Phase 4 – Premium PDF reports (`src/lib/pdf`)

How a PDF is put together:

1. The **cover** is rendered on its own, full-bleed, with no header or footer.
2. The **body** is rendered twice. Pass 1 finds which page each chapter landed on, using invisible markers read back with pdfjs. Pass 2 writes those page numbers into the **table of contents**.
3. pdf-lib combines the pages:
   - draws the theme's paper colour under every page
   - draws the double frame with corner diamonds on top
   - rewrites the metadata (Title, Author, Creator and Producer are all set to the brand name)

The output contains no traces of Chromium, Skia or pdf-lib.

| File | Purpose |
|---|---|
| `themes.ts` | The four themes: Royal Gold & Maroon, Cosmic Blue, Saffron & Cream, Minimal White. `Branding` holds the white-label settings (logo, photo, signature, colours, contact details, booking URL). |
| `svg.ts` | Server-side SVG graphics: Lo Shu/Vedic grids, radar, Personal Year bars, gauges, couple ring, Kua compass, pinnacle timeline, planet icons, number medallions, remedy icons, mandala. |
| `template.ts` | Cover, contents, eleven chapters with highlight boxes (Key Strengths / Watch Out For / Expert Advice / Your Remedy), and the closing page with signature and booking QR code. Labels are in English and Hindi. |
| `fonts.ts` | Playfair Display, Poppins and Noto Sans Devanagari embedded as base64, so the PDF needs no network. |
| `render.ts` | `renderReportPdf()`. Reuses one shared browser. Takes about 1–4 seconds per report. |

- API: `POST /api/pdf { result, narrative?, theme?, language?, preview? }` returns `application/pdf`. If the narrative is still `awaiting_review` (Expert Review), it returns 409.
- UI: a theme picker and a **Download PDF** button on the results page.
- `npm run samples:pdf` writes 10 sample PDFs to `samples/pdf/`: each theme, each module, and Hinglish.
- **Deployment note:** the PDF route needs a Chromium binary. Locally, Playwright's Chromium works out of the box. On Vercel, install `@sparticuz/chromium` and set `PDF_CHROMIUM_PATH` to its executable path. A small Node service on Railway, Render or a VPS is simpler and faster for heavy PDF use.

## Phase 3 – Narrative layer (`src/lib/narrative`)

How a report gets written:

1. The engine produces the result JSON.
2. `plan.ts` breaks the report into 18 sections. Each section gets only its own slice of facts, plus the matching knowledge-base keys and a short brief.
3. The writer receives the style guide, the client's context, those facts and the expert notes.
4. The text is cleaned by the post-processing filter, then validated. If it fails, the section is regenerated (up to three tries) and, failing that, written by the offline writer.
5. Sentences repeated across sections are removed.
6. The finished report is cached by an input hash.

| File | Purpose |
|---|---|
| `knowledge/seed.ts` | Default expert interpretations, keyed by engine codes (`NUMBER_n`, `MOOLANK_n`, `MISSING_n`, `YOG_RAJ_YOG`, `PY_n`, …). These seed the `KnowledgeEntry` table, which the expert edits in Phase 6. |
| `prompts.ts` | System prompt (the style guide from §6.2) and the per-section prompt. `PROMPT_VERSION` is part of the cache key. |
| `providers/llm.ts` | Anthropic and OpenAI over plain `fetch`, configured by env vars. Temperature is clamped to 0.4–0.6. |
| `providers/template.ts` | Offline writer built from the knowledge base. It's used when there's no API key, as the fallback, and in tests. It writes English and Hinglish. Hindi needs the LLM, so a Hindi request without an API key comes back in Hinglish with a note. |
| `filter.ts` | Removes banned phrases, emojis, extra em dashes and any mention of AI. Varies paragraph lengths and removes duplicates across sections. |
| `validate.ts` | Every number in the text must exist in that section's facts. Masked IDs and Devanagari digits are handled. |
| `service.ts` | `generateNarrative()`, `MemoryCache`, `applyExpertEdits()`. |

- API: `POST /api/narrative { result, language?, expertReview? }`. In production the internal diagnostics (`writer`, `warnings`) are stripped from the response.
- UI: the **Your personal report** panel on the results page. It has a language picker and Write / Rewrite buttons. The **Expert review** toggle makes every section editable; edits pass through the same filter. **Approve & finalise** marks the report final. Export and Import JSON now include the narrative.
- To use a real LLM, copy `.env.example` to `.env.local` and set `LLM_PROVIDER`, `LLM_MODEL` and the API key. With none set, the app uses the offline writer.
- `npm run samples:narrative` writes `samples/narrative-en.md` and `samples/narrative-hinglish.md`.

## Phase 2 – Input wizard & results page

- `/reading`: a 5-step wizard (Personal → Life details → Numbers → Partner → Review) with a progress bar and per-step validation. A live preview panel runs the same engine in the browser.
- `POST /api/calculate`: validates input with Zod and returns the engine JSON. Responses are sent with `no-store`, and request bodies are never logged.
- Results page:
  - interactive Lo Shu / Vedic grid (tap a number for its meaning and remedy; tap a plane to highlight it)
  - life-area radar chart, Personal Year bar chart, pinnacles and challenges
  - name table and gauge, plus spelling corrections
  - mobile gauge with digit-pair chips
  - masked Aadhaar
  - couple ring, radar chart and overlay grid
  - remedies
- Buttons: Save (browser storage for now; the database arrives in Phase 5), Export JSON, Import JSON (restores a reading), Edit, New. Download PDF stays disabled until Phase 4.
- EN/हिं toggle in the header, dark/light mode, mobile-first layout, animated mandala background, glass cards.
- Privacy: Aadhaar uses a password-style input. It is removed from browser drafts and dropped from memory once the reading is generated. It never reaches the DOM, local storage or exports.
- UI components live in `src/components/ui`. They follow shadcn/ui's API and file layout, and `components.json` is included, so `npx shadcn add` works later.

---

# Phase 1: Calculation Engine

Deterministic, rule-based TypeScript engine (no AI) for six modules: DOB, Name, Mobile,
Aadhaar, Couple, and the Complete Life Report + Remedies. The narrative layer (Phase 3)
receives **only** the JSON this engine returns.

```bash
npm install
npm test            # 26 unit tests (20 numbered known cases + integrity/privacy checks)
npm run typecheck
npm run samples     # writes sample JSON for a dummy client into /samples
```

## Usage

```ts
import { generateNumerology } from '@/lib/numerology';

const report = generateNumerology(
  { fullName: 'Rahul Kumar Sharma', commonName: 'Rahul Sharma', gender: 'male', dob: '28-08-1990',
    mobile: '9876543210', partner: { name: 'Priya Verma', gender: 'female', dob: '15-05-1992' } },
  { asOf: '2026-11-03', modules: ['complete'] },
);
```

Individual modules are exported too: `analyseDob`, `analyseName`, `suggestNameCorrections`,
`analyseMobile`, `analyseAadhaar`, `analyseCouple`, `buildRemedies`.

## Folder structure (full app; Phase 1 items marked ✅)

```
numerology-saas/
├─ src/lib/db/schema.ts + drizzle/     ✅ database schema & migrations (no Aadhaar column by design)
├─ src/
│  ├─ lib/numerology/                  ✅ calculation engine
│  │  ├─ core/reduce.ts                ✅ digit sums, reduction, master numbers
│  │  ├─ core/date.ts                  ✅ TZ-safe date parsing (DD-MM-YYYY / ISO)
│  │  ├─ data/planets.ts               ✅ planets, gems, mantras, daan, careers
│  │  ├─ data/relations.ts             ✅ friendly / neutral / enemy table
│  │  ├─ data/grids.ts                 ✅ Lo Shu & Vedic layouts, planes, yogs, Lo Shu remedies
│  │  ├─ data/tables.ts                ✅ Chaldean/Pythagorean, compounds, Kua, scoring weights
│  │  ├─ modules/{dob,name,mobile,aadhaar,couple,remedies}.ts ✅
│  │  ├─ schemas.ts                    ✅ Zod Input Sheet schema
│  │  └─ index.ts                      ✅ generateNumerology()
│  ├─ lib/narrative/                   Phase 3 – LLM service, style guide, filter, validator
│  ├─ lib/pdf/                         Phase 4 – HTML templates (4 themes) + Playwright
│  ├─ app/(marketing) (wizard) (dashboard) (admin) api/   Phases 2, 5, 6
│  └─ components/                      Phase 2 – shadcn/ui wizard, grids, charts
├─ tests/engine.test.ts                ✅
├─ scripts/generate-samples.ts         ✅
└─ samples/*.json, SUMMARY.txt         ✅ dummy-client output for each module
```

## Formulas implemented

| Item | Rule |
|---|---|
| Moolank | Birth day reduced to 1–9 |
| Bhagyank | All DDMMYYYY digits summed, reduced; 11/22/33 reported as `master` |
| Kua | Y = reduced year digits. Male 11−Y (5→2); Female 4+Y (5→8) |
| Lo Shu | DOB digits (no 0s) + Moolank (only when day is 11–31, not 20/30) + Bhagyank + Kua |
| Planes | Mental 4-9-2, Emotional 3-5-7, Practical 8-1-6, Thought 4-3-8, Will 9-5-1, Action 2-7-6 |
| Yogs | Golden 4-5-6, Raj 2-5-8, Silver 3-5-7 (complete line); empty line = arrow of weakness |
| Vedic grid | 3-1-9 / 6-7-5 / 2-8-4 with planets |
| Personal Y/M/D | PY = day+month+year digits; PM = PY+month; PD = PM+day |
| Pinnacles | P1 m+d, P2 d+y, P3 P1+P2, P4 m+y; first ends at 36 − Life Path, then 9-year steps |
| Challenges | \|m−d\|, \|d−y\|, \|C1−C2\|, \|m−y\| |
| Name | Chaldean (primary) & Pythagorean; Soul Urge = vowels, Personality = consonants |
| Corrections | Doubling letters, I↔EE, U↔OO, silent final H, final Y/I→EE — pronunciation kept |
| Mobile | 10-digit total, relations, malefic pairs (48/84/44/88/00 + mutual-enemy pairs), zeros, last 4, grid fill |
| Aadhaar | Verhoeff-validated, consent required, returns only `XXXX-XXXX-1234` + vibration |
| Couple | Six symmetric area scores + weighted overall, overlay grid, marriage dates/years |

## Assumptions (please confirm or override)

1. **Friendly/enemy table** comes from Vedic natural planetary friendship (Rahu ≈ Saturn, Ketu ≈ Mars), and every number counts as a friend of itself. Different schools use slightly different tables, so it sits in `data/relations.ts` and moves to the admin knowledge base later.
2. **Yog names** (Golden 4-5-6, Raj 2-5-8, Silver 3-5-7) and arrow names follow common Indian Lo Shu usage. They can be edited in `data/grids.ts`.
3. **Kua** uses the calendar year. There's no Chinese-New-Year/Lichun adjustment for births in Jan to early Feb. For gender "Other" the male formula is used unless `kuaBasis` is given, and the result is flagged.
4. **Kua is plotted in the Lo Shu grid** (as the brief asks), but not in the Vedic grid.
5. **Personal Year** changes on 1 January, not on the birthday.
6. **Scores** (name, mobile, life areas, couple) are transparent weighted rules in `SCORING` (`data/tables.ts`). The mobile score also returns a per-factor `scoreBreakdown`, so the expert can tune it.
7. Numbers **4 and 8** are not suggested as lucky totals or marriage dates unless they are the person's own Moolank or Bhagyank.
8. **Mobile number** is kept in results (it is stored under DPDP consent). **Aadhaar** is removed from the result object; only the last 4 digits survive.
9. `asOf` defaults to today's date in IST. Tests and cached reports pass it explicitly so output stays reproducible.
10. Gemstone, mantra, daan and Lo Shu remedy data are standard defaults for you, the expert, to review.

## Design update (cosmic theme)

The home page and global background were redesigned in a numerologist style: starfield with shooting stars, rotating yantra wheel with orbiting planets, scroll-reveal animations, a Navagraha strip, and an instant reading (Moolank, Bhagyank, Kua, Chaldean name number, Lo Shu grid) that runs on the real calculation engine in the browser. Files: `src/app/cosmic.css`, `src/components/layout/cosmic-bg.tsx`, `src/components/home/*`, `src/app/page.tsx`. All animation is switched off for visitors who enable "reduce motion". Deployment steps are unchanged.
