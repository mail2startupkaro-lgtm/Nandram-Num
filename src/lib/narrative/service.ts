/**
 * Narrative orchestrator (Section 6.1):
 *   engine JSON → section plan → (KB entries + client context + style guide) → LLM
 *   → post-processing filter → number/forbidden-word validation (regenerate on failure)
 *   → template fallback → cross-section de-duplication → cached by input hash.
 */
import { createHash } from 'node:crypto';
import type { NumerologyResult } from '@/lib/numerology';
import { defaultKnowledgeBase, type KnowledgeBase, type KnowledgeSeed } from './knowledge';
import { KNOWLEDGE_SEED } from './knowledge/seed';
import { buildPlan, clientContext, type ClientContext, type NarrativeLanguage, type SectionId, type SectionPlan } from './plan';
import { forbiddenHits, postProcess, splitSentences } from './filter';
import { checkNumbers, collectNumbers } from './validate';
import { PROMPT_VERSION, retryNote, sectionPrompt, systemPrompt, type Persona } from './prompts';
import type { LlmProvider } from './providers/llm';
import { writeSectionTemplate } from './providers/template';

export const NARRATIVE_SCHEMA_VERSION = 1;

export interface NarrativeSection {
  id: SectionId;
  title: string;
  text: string;
  source: 'llm' | 'template' | 'expert';
  attempts: number;
  warnings: string[];
}

export interface Narrative {
  schemaVersion: number;
  promptVersion: string;
  inputHash: string;
  language: NarrativeLanguage;
  writer: string; // 'template' or 'anthropic:<model>' – internal only, never printed in the PDF
  status: 'awaiting_review' | 'final';
  languageFallback: boolean;
  sections: NarrativeSection[];
}

export interface NarrativeCache {
  get(key: string): Promise<Narrative | undefined>;
  set(key: string, value: Narrative): Promise<void>;
}

export class MemoryCache implements NarrativeCache {
  private m = new Map<string, Narrative>();
  constructor(private max = 200) {}
  async get(k: string) {
    const v = this.m.get(k);
    if (v) { this.m.delete(k); this.m.set(k, v); }
    return v ? structuredClone(v) : undefined;
  }
  async set(k: string, v: Narrative) {
    this.m.set(k, structuredClone(v));
    if (this.m.size > this.max) this.m.delete(this.m.keys().next().value as string);
  }
}

export interface NarrativeOptions {
  language?: NarrativeLanguage;
  persona?: Persona;
  kb?: KnowledgeBase;
  kbFingerprint?: string;
  provider?: LlmProvider | null;
  cache?: NarrativeCache;
  maxAttempts?: number;
  batchSize?: number;
  expertReview?: boolean;
  sections?: SectionId[];
  /** Admin prompt overrides (style additions, per-section briefs). */
  promptSettings?: { extraStyleRules?: string; sectionBriefs?: Record<string, string> };
}

const DEFAULT_PERSONA: Persona = { expertName: process.env.EXPERT_NAME || '[Expert Name]', brandName: process.env.BRAND_NAME || '[Brand Name]' };

const stable = (v: unknown): string => JSON.stringify(v, (_, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => a.localeCompare(b))) : x));
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
export const SEED_FINGERPRINT = sha256(stable(KNOWLEDGE_SEED)).slice(0, 16);

export function narrativeHash(result: NumerologyResult, o: { language: string; writer: string; persona: Persona; kbFingerprint: string; sections?: string[] }): string {
  const { results, client, asOf, engineVersion } = result;
  return sha256(stable({ results, client, asOf, engineVersion, promptVersion: PROMPT_VERSION, ...o }));
}

function globalAllowed(r: NumerologyResult, ctx: ClientContext): Set<number> {
  const d = r.results.dob;
  return collectNumbers([d.moolank.value, d.bhagyank.value, d.kua.value, r.results.name?.chaldean.nameNumber.single, d.personalCycles.current.personalYear, ctx.age, ctx.currentYear, 100]);
}

function validate(text: string, allowed: Set<number>) {
  const nums = checkNumbers(text, allowed);
  const forbidden = forbiddenHits(text);
  return { ok: nums.ok && forbidden.length === 0, unknown: nums.unknown, forbidden };
}

async function writeWithLlm(
  provider: LlmProvider, section: SectionPlan, ctx: ClientContext, kb: KnowledgeSeed[], system: string,
  openings: string[], allowed: Set<number>, maxAttempts: number, briefOverride?: string,
): Promise<{ text: string; attempts: number; warnings: string[] } | null> {
  const messages: { role: 'user' | 'assistant'; content: string }[] = [{ role: 'user', content: sectionPrompt(section, ctx, kb, openings, briefOverride) }];
  const warnings: string[] = [];
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let raw: string;
    try {
      raw = await provider.complete({ system, messages, maxTokens: Math.ceil(section.targetWords[1] * 2.6) + 200 });
    } catch (e) {
      warnings.push(`attempt ${attempt}: provider error (${e instanceof Error ? e.message : 'unknown'})`);
      continue;
    }
    const text = postProcess(raw);
    const v = validate(text, allowed);
    if (v.ok && text.length > 40) return { text, attempts: attempt, warnings };
    warnings.push(`attempt ${attempt}: ${v.unknown.length ? `unknown numbers ${v.unknown.join(',')}` : ''}${v.forbidden.length ? ` forbidden ${v.forbidden.join(',')}` : ''}${text.length <= 40 ? ' too short' : ''}`.trim());
    messages.push({ role: 'assistant', content: raw }, { role: 'user', content: retryNote(v.unknown, v.forbidden) });
  }
  return { text: '', attempts: maxAttempts, warnings };
}

export async function generateNarrative(result: NumerologyResult, opts: NarrativeOptions = {}): Promise<Narrative> {
  const ctx = clientContext(result, opts.language);
  const persona = opts.persona ?? DEFAULT_PERSONA;
  const kbase = opts.kb ?? defaultKnowledgeBase;
  const provider = opts.provider ?? null;
  const writer = provider ? `${provider.id}:${provider.model}` : 'template';
  const kbFingerprint = opts.kbFingerprint ?? SEED_FINGERPRINT;
  const ps = opts.promptSettings ?? {};
  const promptFingerprint = (ps.extraStyleRules || Object.keys(ps.sectionBriefs ?? {}).length) ? createHash('sha256').update(stable(ps)).digest('hex').slice(0, 12) : '';
  const inputHash = narrativeHash(result, { language: ctx.language, writer, persona, kbFingerprint: kbFingerprint + promptFingerprint, sections: opts.sections });

  const cached = await opts.cache?.get(inputHash);
  if (cached) return { ...cached, status: opts.expertReview ? 'awaiting_review' : cached.status };

  let plan = buildPlan(result, ctx);
  if (opts.sections?.length) plan = plan.filter((s) => opts.sections!.includes(s.id));
  const gAllowed = globalAllowed(result, ctx);
  const system = systemPrompt(persona, ctx.language, ps.extraStyleRules);
  const batchSize = Math.max(1, opts.batchSize ?? 4);
  const maxAttempts = opts.maxAttempts ?? 3;

  const drafts: (Omit<NarrativeSection, 'title'> & { plan: SectionPlan })[] = [];
  let languageFallback = false;
  const openings: string[] = [];

  for (let i = 0; i < plan.length; i += batchSize) {
    const batch = plan.slice(i, i + batchSize);
    const done = await Promise.all(batch.map(async (section) => {
      const kb = await kbase.getMany(section.kbKeys, ctx.language);
      const allowed = collectNumbers(section.facts, new Set(gAllowed));
      if (provider) {
        const r = await writeWithLlm(provider, section, ctx, kb, system, [...openings], allowed, maxAttempts, ps.sectionBriefs?.[section.id]);
        if (r && r.text) return { id: section.id, text: r.text, source: 'llm' as const, attempts: r.attempts, warnings: r.warnings, plan: section };
        const t = writeSectionTemplate(section, ctx, kb);
        languageFallback ||= t.languageFallback;
        return { id: section.id, text: postProcess(t.text), source: 'template' as const, attempts: r?.attempts ?? maxAttempts, warnings: [...(r?.warnings ?? []), 'fell back to template writer'], plan: section };
      }
      const t = writeSectionTemplate(section, ctx, kb);
      languageFallback ||= t.languageFallback;
      const text = postProcess(t.text);
      const v = validate(text, allowed);
      return { id: section.id, text, source: 'template' as const, attempts: 1, warnings: v.ok ? [] : [`template validation: ${v.unknown.join(',')} ${v.forbidden.join(',')}`.trim()], plan: section };
    }));
    for (const d of done) {
      drafts.push(d);
      const first = splitSentences(d.text.split('\n')[0] ?? '')[0];
      if (first) openings.push(first.split(' ').slice(0, 8).join(' '));
    }
  }

  // Cross-section de-duplication runs in report order.
  const seen = new Set<string>();
  const sections: NarrativeSection[] = drafts.map((d) => ({
    id: d.id,
    title: ctx.language === 'hi' ? d.plan.title.hi : d.plan.title.en,
    text: postProcess(d.text, { seenSentences: seen }),
    source: d.source,
    attempts: d.attempts,
    warnings: d.warnings,
  }));

  const narrative: Narrative = {
    schemaVersion: NARRATIVE_SCHEMA_VERSION, promptVersion: PROMPT_VERSION, inputHash, language: ctx.language, writer,
    status: opts.expertReview ? 'awaiting_review' : 'final', languageFallback, sections,
  };
  await opts.cache?.set(inputHash, { ...narrative, status: 'final' });
  return narrative;
}

/** Apply expert edits (Expert Review mode). Edited text is filtered and validated against the same facts. */
export function applyExpertEdits(n: Narrative, edits: Partial<Record<SectionId, string>>, approve = false): Narrative {
  return {
    ...n,
    status: approve ? 'final' : n.status,
    sections: n.sections.map((s) => (edits[s.id] !== undefined && edits[s.id] !== s.text ? { ...s, text: postProcess(edits[s.id]!), source: 'expert' as const } : s)),
  };
}
