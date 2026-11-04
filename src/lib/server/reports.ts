/** Server-side helpers that combine engine, narrative and storage. */
import type { NumerologyResult } from '@/lib/numerology';
import { StoredInputSchema, type StoredInput } from '@/lib/numerology/schemas';
import { configFromEnv, providerFromConfig } from '@/lib/narrative/providers/llm';
import { generateNarrative, MemoryCache, type Narrative } from '@/lib/narrative/service';
import { loadKnowledgeBase } from '@/lib/narrative/knowledge/db';
import { getSetting } from '@/lib/admin/settings';
import { personaFor } from '@/lib/branding';
import { recalculate } from '@/lib/portable';

/** Accepts a result produced by the client UI, but only after re-deriving it from the stored input (tamper-proof). */
export function verifiedResult(input: StoredInput, claimed: NumerologyResult): NumerologyResult {
  const mods = (claimed.modules ?? ['complete']) as never[];
  const module = (mods as string[]).includes('complete') || mods.length !== 1 ? 'complete' : (mods[0] as string);
  return recalculate(StoredInputSchema.parse(input), { module: module as never, version: 1, status: 'draft', theme: '', language: 'en', result: claimed as never, narrative: null }).result;
}

/** Server-side narrative with the admin's knowledge-base edits and prompt settings applied. */
export async function writeNarrative(result: NumerologyResult, language?: 'en' | 'hi' | 'hinglish', opts: { llm?: boolean; ownerId?: string | null } = {}): Promise<Narrative> {
  const lang = language ?? result.client.language ?? 'en';
  const [{ kb, fingerprint }, promptSettings, persona] = await Promise.all([loadKnowledgeBase(lang), getSetting('prompts'), personaFor(opts.ownerId ?? null)]);
  return generateNarrative(result, { persona, language: lang, provider: opts.llm === false ? null : providerFromConfig(configFromEnv()), kb, kbFingerprint: fingerprint, promptSettings, cache: narrativeCache });
}

const narrativeCache = new MemoryCache(500);
