/** Celebrity Numerology: numbers (hand-checked), Gemini writer with a mocked API, SEO checks, and storage (Postgres, optional). */
import { afterAll, describe, expect, it } from 'vitest';
import { celebNumbers, celebSlug, CelebInputError } from '@/lib/celebrity/numbers';
import { generateCelebPost, numberIssues, translateCelebPost } from '@/lib/celebrity/agent';
import { ContentSchema, hasPlaceholder, PostSchema, seoChecks, templateContent, wordCount, type CelebContent } from '@/lib/celebrity/post';

const asOf = { day: 22, month: 11, year: 2026 };

describe('celebrity numbers', () => {
  it('Virat Kohli, 5 Nov 1988 – hand-checked', () => {
    const n = celebNumbers('Virat  Kohli ', '1988-11-05', asOf);
    expect(n.name).toBe('Virat Kohli');
    expect(n.weekday.en).toBe('Saturday');
    expect(n.moolank.value).toBe(5); // day 5
    expect(n.bhagyank).toMatchObject({ value: 6, compound: 33, master: 33 }); // 0+5+1+1+1+9+8+8 = 33
    expect(n.chaldean).toMatchObject({ compound: 32, single: 5 }); // VIRAT 6+1+2+1+4 = 14, KOHLI 2+7+5+3+1 = 18
    expect(n.loShu.missing).toEqual([2, 3, 4, 7]);
    expect(n.loShu.repeated).toEqual([{ number: 1, count: 3 }, { number: 8, count: 2 }]);
    expect(n.age).toBe(38);
  });
  it('rejects bad input with the field name', () => {
    expect(() => celebNumbers('A', '1988-11-05', asOf)).toThrow(CelebInputError);
    expect(() => celebNumbers('राहुल', '1988-11-05', asOf)).toThrow(/English letters/);
    expect(() => celebNumbers('Test Name', '2030-01-01', asOf)).toThrow(/future/);
  });
  it('makes clean slugs', () => {
    expect(celebSlug('Shāh Rukh Khan')).toBe('shah-rukh-khan-numerology');
    expect(celebSlug('A.R. Rahman')).toBe('a-r-rahman-numerology');
  });
});

describe('offline writer', () => {
  it('builds a valid EN + HI draft with a background placeholder', () => {
    const n = celebNumbers('Virat Kohli', '1988-11-05', asOf);
    for (const l of ['en', 'hi'] as const) {
      const c = templateContent(n, l);
      expect(ContentSchema.safeParse(c).success).toBe(true);
      expect(hasPlaceholder(c)).toBe(true);
      expect(numberIssues(c, n)).toEqual([]);
    }
  });
});

// ───────────────────────── Gemini writer with a mocked API
const n = celebNumbers('Virat Kohli', '1988-11-05');
const para = (s: string) => `${s} `.repeat(30).trim();
const content = (lang: 'en' | 'hi' = 'en', mulank = 5): CelebContent => ({
  seoTitle: lang === 'en' ? 'Virat Kohli Numerology: Mulank 5, Bhagyank 6 Explained' : 'विराट कोहली अंक ज्योतिष: मूलांक 5',
  metaDescription: 'Virat Kohli numerology: born 5 November 1988, Mulank 5 and Bhagyank 6 (master 33). Name number 32/5, Lo Shu grid and personal year explained simply.',
  h1: 'Virat Kohli Numerology: Mulank 5, Bhagyank 6 and Name Number 32',
  excerpt: 'What Virat Kohli’s numbers say about his drive and leadership.',
  focusKeyword: 'Virat Kohli numerology',
  keywords: ['Virat Kohli numerology', 'Virat Kohli mulank', 'mulank 5 celebrities'],
  intro: [`Virat Kohli numerology starts with Mulank ${mulank}. ${para('Short intro words.')}`],
  sections: ['background', 'numbers-at-a-glance', 'moolank', 'bhagyank', 'name-number', 'lo-shu', 'personal-year', 'lessons'].map((id) => ({ id, h2: `Virat Kohli numerology – ${id}`, paras: [para('Plain words about numbers and career.'), para('More plain words.')], bullets: ['Tip one'] })),
  faqs: [1, 2, 3, 4, 5].map((i) => ({ q: `Question ${i}?`, a: 'Answer in about forty words. '.repeat(6).trim() })),
  conclusion: 'Check your own numbers with the free calculator.',
});
const reply = (obj: unknown, extra: Record<string, unknown> = {}) => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '```json\n' + JSON.stringify(obj) + '\n```' }] }, groundingMetadata: { groundingChunks: [{ web: { uri: 'https://example.org/a', title: 'example.org' } }, { web: { uri: 'https://example.org/b', title: 'example.org' } }] }, ...extra }] }), { status: 200 });

describe('Gemini writer', () => {
  const env = { GEMINI_API_KEY: 'test-key', CELEBRITY_LLM_MODEL: 'gemini-test' };

  it('sends numbers + grounding and returns a validated post with sources', async () => {
    const calls: { url: string; body: { tools?: unknown; contents: { parts: { text: string }[] }[] }; key: string | null }[] = [];
    const fetchImpl = (async (url: string, init: RequestInit) => {
      calls.push({ url, body: JSON.parse(String(init.body)), key: new Headers(init.headers).get('x-goog-api-key') });
      return reply({ profile: { identified: true, profession: 'Indian cricketer', knownFor: 'Former India captain', nationality: 'Indian' }, content: content() });
    }) as unknown as typeof fetch;
    const r = await generateCelebPost('Virat Kohli', '1988-11-05', { env, fetchImpl });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain('/models/gemini-test:generateContent');
    expect(calls[0].url).not.toContain('key=');
    expect(calls[0].key).toBe('test-key');
    expect(calls[0].body.tools).toEqual([{ google_search: {} }]);
    expect(calls[0].body.contents[0].parts[0].text).toContain('Bhagyank (destiny/life path number, full date): 6');
    expect(r.post.writer).toBe('ai');
    expect(r.post.slug).toBe('virat-kohli-numerology');
    expect(r.post.profile.profession).toBe('Indian cricketer');
    expect(r.post.sources).toHaveLength(1); // de-duplicated by title
    expect(r.warnings).toEqual([]);
    expect(PostSchema.safeParse(r.post).success).toBe(true);
    expect(seoChecks(r.post.en, r.post.slug).filter((c) => !c.ok).map((c) => c.label)).toEqual([]);
    expect(wordCount(r.post.en)).toBeGreaterThan(900);
  });

  it('retries without Google Search when the model refuses the tool, and flags wrong numbers', async () => {
    const bodies: { tools?: unknown }[] = [];
    const fetchImpl = (async (_u: string, init: RequestInit) => {
      const b = JSON.parse(String(init.body)); bodies.push(b);
      if (b.tools) return new Response('{"error":{"message":"tool not supported"}}', { status: 400 });
      return reply({ profile: { identified: true, profession: 'Cricketer' }, content: content('en', 7) });
    }) as unknown as typeof fetch;
    const r = await generateCelebPost('Virat Kohli', '1988-11-05', { env, fetchImpl });
    expect(bodies.map((b) => !!b.tools)).toEqual([true, false]);
    expect(r.warnings.join(' ')).toMatch(/Mulank 7 \(should be 5\)/);
  });

  it('asks again when the reply is not valid, then gives a clear error', async () => {
    let i = 0;
    const fetchImpl = (async () => { i++; return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Sorry, here is some prose.' }] } }] })); }) as unknown as typeof fetch;
    await expect(generateCelebPost('Virat Kohli', '1988-11-05', { env, fetchImpl })).rejects.toMatchObject({ code: 'AI_FAILED' });
    expect(i).toBe(3);
  });

  it('a rejected key is reported, not retried forever', async () => {
    let i = 0;
    const fetchImpl = (async () => { i++; return new Response('{"error":"API key not valid"}', { status: 403 }); }) as unknown as typeof fetch;
    await expect(generateCelebPost('Virat Kohli', '1988-11-05', { env: { ...env, CELEBRITY_GROUNDING: 'off' }, fetchImpl })).rejects.toMatchObject({ code: 'AI_REJECTED' });
    expect(i).toBe(1);
  });

  it('without a key the offline writer prepares EN + HI drafts', async () => {
    const r = await generateCelebPost('Virat Kohli', '1988-11-05', { env: {} });
    expect(r.post.writer).toBe('template');
    expect(r.post.hi).toBeDefined();
    expect(r.warnings[0]).toMatch(/GEMINI_API_KEY/);
  });

  it('Hindi version keeps structure and is checked', async () => {
    const base = (await generateCelebPost('Virat Kohli', '1988-11-05', { env: {} })).post;
    const sent: string[] = [];
    const fetchImpl = (async (_u: string, init: RequestInit) => { const b = JSON.parse(String(init.body)); sent.push(b.contents[0].parts[0].text); expect(b.tools).toBeUndefined(); return reply({ content: content('hi') }); }) as unknown as typeof fetch;
    const r = await translateCelebPost(base, { env, fetchImpl });
    expect(sent[0]).toContain('HINDI version');
    expect(r.hi.seoTitle).toContain('विराट');
    expect(r.warnings).toEqual([]);
  });
});

// ───────────────────────── storage (needs TEST_DATABASE_URL)
const URL = process.env.TEST_DATABASE_URL;
describe.skipIf(!URL)('celebrity posts storage (database)', async () => {
  const { drizzle } = await import('drizzle-orm/node-postgres');
  const { Pool } = await import('pg');
  const schema = await import('@/lib/db/schema');
  const store = await import('@/lib/celebrity/store');
  const pool = new Pool({ connectionString: URL });
  const db = drizzle(pool, { schema }) as never;
  afterAll(async () => { await pool.query('DROP TABLE IF EXISTS celebrity_posts'); await pool.end(); });

  it('creates the table, saves, publishes, refuses a slug clash and deletes', async () => {
    await pool.query('DROP TABLE IF EXISTS celebrity_posts');
    const post = (await generateCelebPost('Virat Kohli', '1988-11-05', { env: {} })).post;
    const a = await store.saveCelebPost(post, 'draft', null, db);
    expect(a.status).toBe('draft');
    expect(a.publishedAt).toBeNull();
    expect(await store.listCelebPosts({ publishedOnly: true }, db)).toHaveLength(0);
    const b = await store.saveCelebPost({ ...post, en: { ...post.en, h1: 'Edited' } }, 'published', a.id, db);
    expect(b.id).toBe(a.id);
    expect(b.publishedAt).not.toBeNull();
    const pub = await store.listCelebPosts({ publishedOnly: true }, db);
    expect(pub.map((p) => [p.slug, p.title, p.moolank, p.bhagyank])).toEqual([['virat-kohli-numerology', 'Edited', 5, 6]]);
    await expect(store.saveCelebPost(post, 'draft', null, db)).rejects.toBeInstanceOf(store.SlugTakenError);
    expect((await store.getCelebPost('virat-kohli-numerology', { publishedOnly: true }, db))?.post.en.h1).toBe('Edited');
    const first = b.publishedAt;
    await store.setCelebStatus(a.id, 'draft', db);
    expect(await store.getCelebPost('virat-kohli-numerology', { publishedOnly: true }, db)).toBeNull();
    const again = await store.setCelebStatus(a.id, 'published', db);
    expect(again?.publishedAt).toBe(first); // first publish date is kept
    expect(await store.deleteCelebPost(a.id, db)).toBe('virat-kohli-numerology');
    expect(await store.listCelebPosts({}, db)).toHaveLength(0);
  });
});
