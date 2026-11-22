/**
 * Celebrity Numerology writer (Gemini). The numbers come from our engine; Gemini writes the background
 * (checked with Google Search grounding when the model supports it) and the interpretation as an SEO blog post.
 *
 * Env: GEMINI_API_KEY (or GOOGLE_API_KEY) · CELEBRITY_LLM_MODEL (blank = LLM_MODEL when LLM_PROVIDER is gemini, else gemini-3-flash-preview)
 *      CELEBRITY_GROUNDING=off to switch off Google Search grounding · LLM_BASE_URL optional gateway.
 */
import { ContentSchema, ProfileSchema, templateContent, type CelebContent, type CelebPost, type CelebProfile, type CelebSource, type Lang } from './post';
import { celebNumbers, celebSlug, numbersText, type CelebNumbers } from './numbers';

type Env = Record<string, string | undefined>;
export interface CelebAgentOpts { env?: Env; fetchImpl?: typeof fetch }

const CANDIDATE_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3-flash-preview',
];

export function geminiConfig(env: Env = process.env) {
  const apiKey = env.GEMINI_API_KEY || env.GOOGLE_API_KEY || '';
  const configured = env.CELEBRITY_LLM_MODEL?.trim() || ((env.LLM_PROVIDER ?? 'gemini') === 'gemini' && env.LLM_MODEL?.trim()) || '';
  const model = (configured && configured !== 'gemini-3-flash-preview') ? configured : 'gemini-3.5-flash';
  return { apiKey, model, grounding: !/^(off|0|false|no)$/i.test(env.CELEBRITY_GROUNDING ?? ''), baseUrl: env.LLM_BASE_URL?.trim() || 'https://generativelanguage.googleapis.com', timeoutMs: Number(env.CELEBRITY_TIMEOUT_MS ?? 100_000) };
}

const RULES = `You write for the blog of myNumerologist.com (Acharya Nandram, Indian numerologist, 15+ years). Audience: Indian readers, simple language.
Rules:
- Use ONLY the numbers given in NUMBERS. Never calculate or change a number yourself.
- Background facts (profession, career milestones, awards, famous works, family) must be real and well known. If you are not sure of a fact, leave it out. Never invent quotes, dates, figures or events.
- If you cannot identify a well-known person with this exact name AND date of birth, set "identified": false and write the background only as "born on <date>" with no invented facts.
- Respectful and positive. No predictions of death, illness, accidents, divorce, scandal or legal trouble. No gossip, no private life details beyond what is public and well known. No political opinions.
- Connect numbers to real, public career moments (e.g. "Bhagyank 1 – leadership – fits his role as captain").
- Never mention AI, models or that the text was generated. Write as the myNumerologist.com editorial team.
- Numerology is traditional guidance; do not present it as scientific proof.`;

const SEO = (name: string) => `SEO (Google, Indian search):
- focusKeyword: "${name} numerology" (Hindi version: "${name} अंक ज्योतिष").
- seoTitle 45–60 characters, starts with the celebrity name, includes the focus keyword.
- metaDescription 140–158 characters, includes the focus keyword and Mulank/Bhagyank numbers, invites the click.
- Use the focus keyword in the first sentence of intro and in at least two h2 headings; use related terms naturally (mulank, bhagyank, date of birth, name number, lucky number, lo shu grid). No keyword stuffing.
- 1300–1700 words in total. Short paragraphs (2–4 sentences). FAQ answers 40–80 words, written so they can appear as Google answers.`;

const SHAPE = `Reply with ONE JSON object and nothing else (no markdown fences):
{
 "profile": { "identified": true, "profession": "short, e.g. Indian cricketer", "knownFor": "one line of what they are best known for", "nationality": "Indian" },
 "content": {
  "seoTitle": "", "metaDescription": "", "h1": "", "excerpt": "1–2 sentence summary for the blog card",
  "focusKeyword": "", "keywords": ["8–12 search phrases"],
  "intro": ["2 paragraphs"],
  "sections": [
   { "id": "background", "h2": "Who is <name>? Early life and career", "paras": ["3–5 paragraphs of real, public background"], "bullets": ["key achievements, optional"] },
   { "id": "numbers-at-a-glance", "h2": "", "paras": ["1–2 paragraphs summarising the core numbers"] },
   { "id": "moolank", "h2": "<name>'s Mulank <n> ...", "paras": ["personality traits of this Mulank and how they show in public life"] },
   { "id": "bhagyank", "h2": "", "paras": ["destiny number, life purpose, link to career journey"] },
   { "id": "name-number", "h2": "", "paras": ["Chaldean name number, compound meaning, fame and public image, name compatibility score"] },
   { "id": "lo-shu", "h2": "", "paras": ["present, repeated and missing numbers, arrows, what they mean"], "bullets": [] },
   { "id": "personal-year", "h2": "", "paras": ["the current personal year: themes and opportunities, positive tone"] },
   { "id": "lessons", "h2": "What people with Mulank <n> can learn from <name>", "paras": [""], "bullets": ["4–6 practical tips"] }
  ],
  "faqs": [ { "q": "", "a": "" } ],
  "conclusion": "1 paragraph, invite readers to check their own numbers with the free calculator or a personal reading by Acharya Nandram"
 }
}
Give 5 FAQs (Mulank, Bhagyank, name number, lucky number/colour, current year). Section ids must stay exactly as above.`;

function prompt(n: CelebNumbers, lang: Lang, english?: CelebContent) {
  if (lang === 'hi' && english) {
    return `Write the HINDI version of this celebrity numerology blog post for ${n.name}.
- Simple, natural Hindi in Devanagari (not Hinglish). Keep the celebrity name, film/team/company names as commonly written in Hindi media.
- Use मूलांक, भाग्यांक, नामांक, लो शू ग्रिड, व्यक्तिगत वर्ष.
- Same structure, same section ids, same facts and numbers – do NOT add new facts.
- SEO for Hindi search: focusKeyword "${n.name} अंक ज्योतिष"; seoTitle ≤ 60 characters; metaDescription ≤ 155 characters; keywords in Hindi (you may add 2–3 Hinglish phrases like "${n.name} mulank").

NUMBERS:
${numbersText(n)}

ENGLISH POST (JSON):
${JSON.stringify(english)}

Reply with ONE JSON object: { "content": { ...same keys as the English post... } } and nothing else.`;
  }
  return `Write a celebrity numerology blog post.

CELEBRITY: ${n.name}
DATE OF BIRTH: ${n.dob}

NUMBERS (calculated by our engine – use exactly these):
${numbersText(n)}

${SEO(n.name)}

${SHAPE}`;
}

interface GeminiReply { text: string; sources: CelebSource[] }

async function callGemini(cfg: ReturnType<typeof geminiConfig>, system: string, user: string, grounding: boolean, fetchImpl: typeof fetch): Promise<GeminiReply> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), cfg.timeoutMs);
  try {
    const res = await fetchImpl(`${cfg.baseUrl}/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent`, {
      method: 'POST', signal: ctrl.signal,
      headers: { 'content-type': 'application/json', 'x-goog-api-key': cfg.apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        ...(grounding ? { tools: [{ google_search: {} }] } : {}),
        generationConfig: { temperature: 0.55, maxOutputTokens: 12000 },
      }),
    });
    if (!res.ok) { const t = await res.text().catch(() => ''); throw Object.assign(new Error(`Gemini HTTP ${res.status}`), { status: res.status, detail: t.slice(0, 300) }); }
    const json = await res.json();
    const cand = json.candidates?.[0];
    const text = (cand?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? '').join('').trim();
    const chunks: { web?: { uri?: string; title?: string } }[] = cand?.groundingMetadata?.groundingChunks ?? [];
    const seen = new Set<string>();
    const sources = chunks.map((c) => ({ title: String(c.web?.title ?? '').slice(0, 300), uri: String(c.web?.uri ?? '').slice(0, 2000) }))
      .filter((s) => s.uri && !seen.has(s.title || s.uri) && seen.add(s.title || s.uri)).slice(0, 20);
    if (!text) throw new Error(cand?.finishReason ? `Gemini returned no text (${cand.finishReason})` : 'Gemini returned no text');
    return { text, sources };
  } finally { clearTimeout(timer); }
}

const extractJson = (raw: string) => {
  const t = raw.replace(/^```(?:json)?/i, '').replace(/```$/, '');
  const s = t.indexOf('{'), e = t.lastIndexOf('}');
  if (s < 0 || e <= s) throw new Error('no JSON in reply');
  return JSON.parse(t.slice(s, e + 1));
};

/** Removes mentions of AI and stray markdown from the generated text. */
function tidy(c: CelebContent): CelebContent {
  const f = (s: string) => s.replace(/\*\*|__|^#+\s*/g, '').replace(/\b(as an AI|AI[- ]generated|language model)\b[^.]*\.?/gi, '').replace(/\s{2,}/g, ' ').trim();
  return {
    ...c, intro: c.intro.map(f).filter(Boolean),
    sections: c.sections.map((s) => ({ ...s, h2: f(s.h2), paras: s.paras.map(f).filter(Boolean), bullets: s.bullets?.map(f).filter(Boolean) })),
    faqs: c.faqs.map((x) => ({ q: f(x.q), a: f(x.a) })), conclusion: c.conclusion ? f(c.conclusion) : undefined,
  };
}

/** Every number written as "Mulank N / Bhagyank N / मूलांक N / भाग्यांक N" must match the engine. Returns the problems found. */
export function numberIssues(c: CelebContent, n: CelebNumbers): string[] {
  const text = [c.seoTitle, c.metaDescription, c.h1, ...c.intro, ...c.sections.flatMap((s) => [s.h2, ...s.paras, ...(s.bullets ?? [])]), ...c.faqs.flatMap((f) => [f.q, f.a])].join(' \n ');
  const out = new Set<string>();
  const check = (re: RegExp, want: number[], label: string) => { for (const m of text.matchAll(re)) if (!want.includes(Number(m[1]))) out.add(`${label} ${m[1]} (should be ${want[0]})`); };
  check(/\b(?:Mulank|Moolank|Root number|Psychic number)\s*(?:is\s*|of\s*|:\s*)?(\d{1,2})\b/gi, [n.moolank.value], 'Mulank');
  check(/\b(?:Bhagyank|Destiny number|Life path(?: number)?)\s*(?:is\s*|of\s*|:\s*)?(\d{1,2})\b/gi, [n.bhagyank.value, n.bhagyank.compound, ...(n.bhagyank.master ? [n.bhagyank.master] : [])], 'Bhagyank');
  check(/मूलांक\s*(?:है\s*)?(\d{1,2})/g, [n.moolank.value], 'मूलांक');
  check(/भाग्यांक\s*(?:है\s*)?(\d{1,2})/g, [n.bhagyank.value, n.bhagyank.compound, ...(n.bhagyank.master ? [n.bhagyank.master] : [])], 'भाग्यांक');
  return [...out];
}

export interface CelebGenResult { post: CelebPost; warnings: string[] }

async function writeWithGemini(n: CelebNumbers, lang: Lang, english: CelebContent | undefined, opts: CelebAgentOpts): Promise<{ content: CelebContent; profile?: CelebProfile; sources: CelebSource[]; model: string }> {
  const cfg = geminiConfig(opts.env);
  const fetchImpl = opts.fetchImpl ?? fetch;
  const models = [cfg.model, ...CANDIDATE_MODELS.filter((m) => m !== cfg.model)];
  let modelIdx = 0;
  let grounding = cfg.grounding && lang === 'en';
  let user = prompt(n, lang, english);
  let last = '';
  for (let attempt = 0; attempt < 3; attempt++) {
    const currentCfg = { ...cfg, model: models[modelIdx] };
    try {
      const r = await callGemini(currentCfg, RULES, user, grounding, fetchImpl);
      const raw = extractJson(r.text);
      const content = ContentSchema.safeParse(raw.content ?? raw);
      if (!content.success) {
        last = content.error.issues.slice(0, 3).map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
        user = `${prompt(n, lang, english)}\n\nYour previous reply was invalid (${last}). Reply again with ONLY the JSON object.`;
        continue;
      }
      const profile = raw.profile ? ProfileSchema.safeParse(raw.profile) : null;
      return { content: tidy(content.data), profile: profile?.success ? profile.data : undefined, sources: r.sources, model: currentCfg.model };
    } catch (e) {
      const status = (e as { status?: number }).status;
      last = e instanceof Error ? e.message : 'error';
      // If Google Search grounding caused quota exhaustion (HTTP 429) or 4xx rejection, disable grounding immediately and retry!
      if (grounding && ((status && status >= 400 && status < 500) || /429|quota/i.test(last))) {
        grounding = false;
        continue;
      }
      // If rate limited (429) or high demand / server overload (503 / 500), try fallback model and wait with backoff
      if (status === 429 || status === 503 || status === 500) {
        if (modelIdx + 1 < models.length) {
          modelIdx++;
        }
        await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
        continue;
      }
      if (status && status >= 400 && status < 500 && status !== 429) {
        throw Object.assign(new Error(`${last}${(e as { detail?: string }).detail ? ` – ${(e as { detail?: string }).detail}` : ''}`), { code: 'AI_REJECTED' });
      }
      if (e instanceof SyntaxError || /no JSON/.test(last)) {
        user = `${prompt(n, lang, english)}\n\nYour previous reply was not valid JSON. Reply again with ONLY the JSON object.`;
        continue;
      }
    }
  }
  throw Object.assign(new Error(`The AI writer did not return a usable post (${last}).`), { code: 'AI_FAILED' });
}

/** Generates the English post (and the profile/background). Falls back to the offline writer without a key. */
export async function generateCelebPost(name: string, dob: string, opts: CelebAgentOpts = {}): Promise<CelebGenResult> {
  const n = celebNumbers(name, dob);
  const cfg = geminiConfig(opts.env);
  const base = { slug: celebSlug(n.name), name: n.name, dob: n.dob, numbers: n, generatedAt: new Date().toISOString() };
  if (!cfg.apiKey) {
    return {
      post: { ...base, profile: { identified: false, profession: '', knownFor: '', nationality: '' }, en: templateContent(n, 'en'), hi: templateContent(n, 'hi'), sources: [], writer: 'template' },
      warnings: ['GEMINI_API_KEY is not set, so the offline writer prepared this draft. Add the celebrity background in the "Who is" section before publishing.'],
    };
  }
  let r: { content: CelebContent; profile?: CelebProfile; sources: CelebSource[]; model: string };
  try {
    r = await writeWithGemini(n, 'en', undefined, opts);
  } catch (err) {
    if (opts.fetchImpl) throw err;
    return {
      post: { ...base, profile: { identified: false, profession: '', knownFor: '', nationality: '' }, en: templateContent(n, 'en'), hi: templateContent(n, 'hi'), sources: [], writer: 'template' },
      warnings: [`AI generation could not complete (${err instanceof Error ? err.message : 'rate limit'}). A complete structured offline draft with exact numerology calculations has been prepared for you. You can review and edit it below.`]
    };
  }
  const warnings: string[] = [];
  const profile = r.profile ?? { identified: true, profession: '', knownFor: '', nationality: '' };
  if (!profile.identified) warnings.push(`Gemini could not confirm a well-known person named "${n.name}" born on ${n.dob}. Check the name and date, and add the background yourself.`);
  if (!r.sources.length) warnings.push('No web sources were returned for the background – check the facts before publishing.');
  const bad = numberIssues(r.content, n);
  if (bad.length) warnings.push(`Numbers in the text that differ from the calculation: ${bad.join(', ')}. Correct them before publishing.`);
  return { post: { ...base, profile, en: r.content, sources: r.sources, writer: 'ai', model: r.model }, warnings };
}

/** Hindi version of an (edited) English post. */
export async function translateCelebPost(post: CelebPost, opts: CelebAgentOpts = {}): Promise<{ hi: CelebContent; warnings: string[] }> {
  const n = celebNumbers(post.name, post.dob);
  if (!geminiConfig(opts.env).apiKey) return { hi: templateContent(n, 'hi'), warnings: ['GEMINI_API_KEY is not set – the offline Hindi draft was used.'] };
  let r: { content: CelebContent; profile?: CelebProfile; sources: CelebSource[]; model: string };
  try {
    r = await writeWithGemini(n, 'hi', post.en, opts);
  } catch (err) {
    if (opts.fetchImpl) throw err;
    return {
      hi: templateContent(n, 'hi'),
      warnings: [`AI Hindi translation could not complete (${err instanceof Error ? err.message : 'rate limit'}). An offline Hindi structured draft has been loaded instead.`]
    };
  }
  const bad = numberIssues(r.content, n);
  return { hi: r.content, warnings: bad.length ? [`Hindi numbers that differ from the calculation: ${bad.join(', ')}.`] : [] };
}
