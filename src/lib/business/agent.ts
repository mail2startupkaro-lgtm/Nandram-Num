/**
 * Business Compatibility AI Agent: turns the analytical engine's data into a written consultation.
 * The model may only recommend items from the engine's ranked list and must use the given numbers.
 * Falls back to a deterministic writer when no LLM is configured or the reply is invalid.
 * Model: BUSINESS_LLM_MODEL (optional) or LLM_MODEL.
 */
import { z } from 'zod';
import { configFromEnv, providerFromConfig } from '@/lib/narrative/providers/llm';
import { planetOf } from '@/lib/numerology/data/planets';
import type { BizAnalytics } from './engine';

export type BizLanguage = 'en' | 'hi' | 'hinglish';
export interface BizContext { fullName: string; dobText: string; birthPlace: string; currentCity?: string; businessName?: string; mode: string; capitalLabel: string; risk: string; interests: string[]; education?: string; currentWork?: string; goals?: string; language: BizLanguage }

export const ReportSchema = z.object({
  headline: z.string().min(3).max(200),
  summary: z.string().min(20).max(2000),
  businessPersonality: z.array(z.string().max(300)).min(2).max(8),
  topPicks: z.array(z.object({ id: z.string(), why: z.string().max(700), howToStart: z.string().max(700), watch: z.string().max(400) })).min(1).max(5),
  avoidNote: z.string().max(800),
  partnership: z.string().max(800),
  nameAdvice: z.string().max(800),
  placeAdvice: z.string().max(800),
  timingAdvice: z.string().max(800),
  remedies: z.array(z.string().max(300)).min(1).max(8),
  actionPlan: z.array(z.string().max(300)).min(2).max(8),
  closing: z.string().max(500),
});
export type BizReport = z.infer<typeof ReportSchema>;
export interface BizAgentResult { report: BizReport; source: 'ai' | 'rules'; model?: string; note?: string }

const LANG: Record<BizLanguage, string> = { en: 'simple Indian English', hi: 'simple Hindi in Devanagari script (numbers as digits)', hinglish: 'Hinglish (Hindi in Roman script mixed with common English words)' };

export function systemPrompt(lang: BizLanguage) {
  return `You are the Business Numerology Analyst Agent of myNumerologist.com, assisting Acharya Nandram (Indian numerologist, 15+ years).
You receive analytical data computed by a numerology engine (Moolank, Bhagyank, name number, Lo Shu grid, number strengths, ranked business/profession scores, personal-year timing, place and business-name numbers, Kua directions) plus the client's practical situation.
Write a business / profession compatibility consultation.

Rules:
- Use ONLY the numbers and scores given. Never calculate new numbers or invent scores.
- topPicks: choose 3–5 items ONLY from the TOP RANKED list, by their exact id. You may re-order using the practical context (capital, risk, interests, education, current work), and explain why.
- Be practical: how to start small, which business model, what to watch out for. Mention the client's education and current work when relevant.
- Place: in numerology the birth place is not a core factor; use the place-number harmony given as a supporting signal only, and say so gently. Use Kua success direction for shop/office entrance or seating.
- Remedies must be traditional and safe (lucky day to start, colours, name spelling correction, daan, mantra). Never prescribe gemstones without "after expert check".
- Never guarantee profit, never give investment, tax or legal advice, never predict loss, bankruptcy, illness or death. Use "tends to", "suits", "may".
- Write all text values in ${LANG[lang]}.

Reply with ONE JSON object and nothing else:
{"headline":"…","summary":"4–6 sentences","businessPersonality":["…"],"topPicks":[{"id":"exact id","why":"…","howToStart":"…","watch":"…"}],"avoidNote":"…","partnership":"which partner numbers suit and why","nameAdvice":"…","placeAdvice":"…","timingAdvice":"…","remedies":["…"],"actionPlan":["step 1…"],"closing":"…"}`;
}

export function dataText(c: BizContext, a: BizAnalytics) {
  const P = a.person;
  const line = (r: BizAnalytics['top'][number]) => `- ${r.id} | ${r.label} | ${r.kind} | score ${r.score} (numerology ${r.numerologyFit}) | numbers ${r.numbers.join('/')} | capital ${['', 'low', 'medium', 'high'][r.capital]}${r.factors.length ? ` | ${r.factors.join('; ')}` : ''}`;
  return `CLIENT
Name: ${c.fullName} (name used: ${P.nameUsed})
Date of birth: ${c.dobText}; birth place: ${c.birthPlace}${c.currentCity ? `; business location: ${c.currentCity}` : ''}
Looking for: ${c.mode}; capital: ${c.capitalLabel}; risk appetite: ${c.risk}
Interests: ${c.interests.join(', ') || 'not specified'}; education: ${c.education || 'not specified'}; current work: ${c.currentWork || 'not specified'}
Goals / notes: ${c.goals || 'none'}

CORE NUMBERS
Moolank ${P.moolank} (${planetOf(P.moolank).name}); Bhagyank ${P.bhagyankMaster ? `${P.bhagyankMaster}/${P.bhagyank}` : P.bhagyank} (${P.planet.name}); Moolank–Bhagyank relation: ${P.moolankBhagyank}
Name number (Chaldean) ${P.nameCompound}/${P.nameNumber} – ${P.nameToBhagyank} to Bhagyank; Kua ${P.kua}
Friendly numbers: ${P.friendly.join(', ')}; avoid: ${P.avoid.join(', ') || 'none'}; lucky day ${P.planet.weekday}; colours ${P.planet.colours.join(', ')}

LO SHU GRID
Missing: ${a.grid.missing.join(', ') || 'none'}; repeated: ${a.grid.repeated.map((r) => `${r.number}×${r.count}`).join(', ') || 'none'}; yogs: ${a.grid.yogs.join(', ') || 'none'}; strength arrows: ${a.grid.strengths.join(', ') || 'none'}; weakness arrows: ${a.grid.weaknesses.join(', ') || 'none'}
Life-area scores: ${Object.entries(a.lifeAreas).map(([k, v]) => `${k} ${v}`).join(', ')}
Number strengths (1–9): ${a.numberStrength.map((x) => `${x.n}:${x.score}`).join(', ')}

TOP RANKED (choose topPicks from these ids)
${a.top.map(line).join('\n')}

LEAST SUITED
${a.avoid.map(line).join('\n')}

SECTOR SCORES: ${a.sectorScores.map((s) => `${s.sector} ${s.score}`).join(', ')}

TIMING (personal years)
Now: personal year ${a.currentYear.personalYear} – ${a.currentYear.theme}
${a.timing.map((t) => `${t.year}: PY ${t.personalYear}, launch score ${t.score}`).join('; ')}

PLACES
Birth place number: ${a.places.birth ? `${a.places.birth.compound}/${a.places.birth.single} – ${a.places.birth.toBhagyank} to Bhagyank (harmony ${a.places.birth.score})` : 'n/a'}
${a.places.current ? `Business location number: ${a.places.current.compound}/${a.places.current.single} – ${a.places.current.toBhagyank} to Bhagyank (harmony ${a.places.current.score})` : ''}
Kua directions: success ${a.directions.success}, growth ${a.directions.growth}, avoid ${a.directions.avoid}

BUSINESS NAME
${a.businessName ? `"${a.businessName.text}" = ${a.businessName.compound}/${a.businessName.single} (${a.businessName.category}), ${a.businessName.toBhagyank} to Bhagyank, score ${a.businessName.score}` : 'Not given.'}
Good name totals: ${a.nameTargets.map((t) => `${t.single} (${t.compounds.join(', ')})`).join('; ')}`;
}

export function ruleReport(c: BizContext, a: BizAnalytics): BizReport {
  const P = a.person; const picks = a.top.slice(0, 4);
  const best = a.timing.filter((t) => t.score >= 80).map((t) => t.year);
  return {
    headline: `Best suited: ${picks.slice(0, 2).map((p) => p.label).join(' or ')}`,
    summary: `${c.fullName} has Bhagyank ${P.bhagyank} ruled by ${P.planet.name} and Moolank ${P.moolank}. The strongest numbers in the chart are ${[...a.numberStrength].sort((x, y) => y.score - x.score).slice(0, 3).map((x) => x.n).join(', ')}, which point towards ${a.sectorScores.slice(0, 2).map((s) => s.sector).join(' and ')}. The top match scores ${picks[0].score}/100. The current personal year is ${a.currentYear.personalYear}: ${a.currentYear.theme.toLowerCase()}.`,
    businessPersonality: [`${P.planet.name} (Bhagyank ${P.bhagyank}) traditionally favours: ${P.planet.careers.join(', ')}.`, `Moolank and Bhagyank are ${({ friend: 'friendly', neutral: 'neutral', enemy: 'in conflict' } as const)[P.moolankBhagyank]} to each other${P.moolankBhagyank === 'enemy' ? ' – inner drive and destiny pull differently, so choose work that uses both' : ''}.`, a.grid.missing.length ? `Missing numbers ${a.grid.missing.join(', ')} show skills to build or delegate.` : 'No missing numbers – a well-rounded grid.', ...(a.grid.yogs.length ? [`Yogs present: ${a.grid.yogs.join(', ')}.`] : [])],
    topPicks: picks.map((p) => ({ id: p.id, why: `Score ${p.score}/100. Supported by numbers ${p.numbers.join(', ')}${p.factors.length ? `; ${p.factors.join('; ')}` : ''}.`, howToStart: p.kind === 'business' ? (p.capital === 3 ? 'Start with a smaller pilot or as a partner/franchisee before full investment.' : 'Start lean, test demand locally and grow step by step.') : 'Build qualifications and experience in this field; consider consulting or a side practice later.', watch: p.factors.find((f) => /missing|unfriendly|capital|risk/i.test(f)) ?? 'Keep finances disciplined and review progress every quarter.' })),
    avoidNote: `Least suited right now: ${a.avoid.slice(0, 3).map((x) => x.label).join(', ')}. Their main numbers do not support Bhagyank ${P.bhagyank} as well.`,
    partnership: `Partners whose Bhagyank or Moolank is ${P.friendly.filter((x) => x !== P.bhagyank).join(', ')} tend to be supportive. Be careful with ${P.avoid.join(', ') || 'no specific numbers'}.`,
    nameAdvice: a.businessName ? `"${a.businessName.text}" totals ${a.businessName.compound}/${a.businessName.single} (${a.businessName.category}) and is ${a.businessName.toBhagyank} to the Bhagyank. ${a.businessName.score >= 70 ? 'It supports the owner.' : `Consider a spelling that totals ${a.nameTargets.map((t) => t.compounds[0]).filter(Boolean).join(', ')}.`}` : `Choose a business name totalling ${a.nameTargets.map((t) => t.compounds.join('/')).join(', ')} (Chaldean).`,
    placeAdvice: `${a.places.birth ? `Birth place number ${a.places.birth.single} is ${a.places.birth.toBhagyank} to the Bhagyank (supporting signal only). ` : ''}${a.places.current ? `Business location number ${a.places.current.single} is ${a.places.current.toBhagyank}. ` : ''}Face ${a.directions.success} while working or keep the main entrance there if possible; avoid ${a.directions.avoid}.`,
    timingAdvice: `Best years to launch or expand: ${best.join(', ') || a.timing[0].year}. ${a.currentYear.theme}.`,
    remedies: [`Start important work on ${P.planet.weekday}.`, `Use ${P.planet.colours.slice(0, 2).join(' and ')} in branding or the work area.`, ...(a.grid.missing.length ? [`Strengthen missing number ${a.grid.missing[0]} with its planet's remedies (ask for the full remedy report).`] : [])],
    actionPlan: ['Shortlist the top 2 options and study the local market.', 'Prepare a simple budget within your capital.', 'Check the business name number before registration.', `Launch in a favourable personal year (${best[0] ?? a.timing[0].year}) on ${P.planet.weekday}.`],
    closing: 'Numbers show the natural direction; disciplined effort makes it real.',
  };
}

export async function runBusinessAgent(c: BizContext, a: BizAnalytics, opts: { env?: Record<string, string | undefined>; fetchImpl?: typeof fetch } = {}): Promise<BizAgentResult> {
  const env = opts.env ?? process.env;
  const cfg = configFromEnv(env);
  const model = env.BUSINESS_LLM_MODEL || cfg.model;
  if (cfg.provider === 'template' || !cfg.apiKey || !model) return { report: ruleReport(c, a), source: 'rules', note: 'AI provider not configured – the built-in analyst wrote this report.' };
  const provider = providerFromConfig({ ...cfg, model }, opts.fetchImpl)!;
  const allowed = new Set(a.top.map((t) => t.id));
  let msg = dataText(c, a); let last = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await provider.complete({ system: systemPrompt(c.language), messages: [{ role: 'user', content: msg }], maxTokens: 3500 });
      const s = raw.indexOf('{'), e = raw.lastIndexOf('}');
      const parsed = ReportSchema.safeParse(JSON.parse(raw.slice(s, e + 1)));
      if (parsed.success) {
        const picks = parsed.data.topPicks.filter((p) => allowed.has(p.id));
        if (picks.length) return { report: { ...parsed.data, topPicks: picks }, source: 'ai', model };
        last = 'topPicks ids not in TOP RANKED list';
      } else last = parsed.error.issues.slice(0, 5).map((x) => `${x.path.join('.')}: ${x.message}`).join('; ');
      msg = `${dataText(c, a)}\n\nYour previous reply was invalid (${last}). Reply again with ONLY the JSON object; topPicks ids must come from TOP RANKED.`;
    } catch (err) { last = err instanceof Error ? err.message : 'error'; if (/HTTP 4\d\d/.test(last) && !/429/.test(last)) break; }
  }
  console.error('business agent fallback:', last.slice(0, 160));
  return { report: ruleReport(c, a), source: 'rules', model, note: 'The AI reply could not be used this time, so the built-in analyst wrote this report.' };
}
