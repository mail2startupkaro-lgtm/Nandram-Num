/** Knowledge base with the expert's edits (knowledge_entries table) layered over the seed. Server-only. */
import { getDb, type Db } from '@/lib/db/client';
import { knowledgeEntries } from '@/lib/db/schema';
import { sha256Hex } from '@/lib/security/crypto';
import { StaticKnowledgeBase } from './index';
import { KNOWLEDGE_SEED, type KnowledgeSeed } from './seed';

export async function loadKnowledgeBase(language = 'en', db: Db = getDb()): Promise<{ kb: StaticKnowledgeBase; fingerprint: string; overrides: number }> {
  const rows = await db.select().from(knowledgeEntries);
  // English overrides apply everywhere; language-specific overrides win for that language.
  const pick = [...rows.filter((r) => r.language === 'en'), ...rows.filter((r) => r.language === language && language !== 'en')];
  const overrides: KnowledgeSeed[] = pick.map((r) => ({ key: r.key, title: r.title, body: r.body }));
  const fingerprint = sha256Hex(JSON.stringify([KNOWLEDGE_SEED.length, pick.map((r) => [r.key, r.language, r.updatedAt.toISOString()])])).slice(0, 16);
  return { kb: new StaticKnowledgeBase(KNOWLEDGE_SEED, overrides), fingerprint, overrides: overrides.length };
}
