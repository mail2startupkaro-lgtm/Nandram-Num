import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/lib/db/client';
import { knowledgeEntries } from '@/lib/db/schema';
import { KNOWLEDGE_SEED } from '@/lib/narrative/knowledge/seed';
import { withAdmin } from '@/lib/server/admin';
import { json, readJson } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** All entries: seed defaults merged with the expert's edits (per language). */
export const GET = withAdmin(async (req) => {
  const lang = new URL(req.url).searchParams.get('lang') ?? 'en';
  const rows = await getDb().select().from(knowledgeEntries).where(eq(knowledgeEntries.language, lang));
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const seedKeys = new Set(KNOWLEDGE_SEED.map((s) => s.key));
  const entries = [
    ...KNOWLEDGE_SEED.map((s) => ({ key: s.key, title: byKey.get(s.key)?.title ?? s.title, body: byKey.get(s.key)?.body ?? s.body, defaultBody: s.body, edited: byKey.has(s.key), custom: false, tags: s.tags ?? [] })),
    ...rows.filter((r) => !seedKeys.has(r.key)).map((r) => ({ key: r.key, title: r.title, body: r.body, defaultBody: '', edited: true, custom: true, tags: [] })),
  ];
  return json({ language: lang, entries });
});

const Body = z.object({
  key: z.string().regex(/^[A-Z0-9_]{2,80}$/), language: z.enum(['en', 'hi', 'hinglish']).default('en'),
  title: z.string().min(1).max(120), body: z.string().min(1).max(4000),
});

export const PUT = withAdmin(async (req, admin) => {
  const b = Body.parse(await readJson(req));
  const row = { ...b, updatedBy: admin.email ?? admin.id };
  await getDb().insert(knowledgeEntries).values(row).onConflictDoUpdate({ target: [knowledgeEntries.key, knowledgeEntries.language], set: { ...row, updatedAt: new Date() } });
  return json({ ok: true });
});

/** Reverts an entry to the built-in default. */
export const DELETE = withAdmin(async (req) => {
  const u = new URL(req.url);
  await getDb().delete(knowledgeEntries).where(and(eq(knowledgeEntries.key, u.searchParams.get('key') ?? ''), eq(knowledgeEntries.language, u.searchParams.get('lang') ?? 'en')));
  return json({ ok: true });
});
