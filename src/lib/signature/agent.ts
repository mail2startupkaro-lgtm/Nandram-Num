/**
 * AI Signature Analysis Agent.
 *   1. Numerology facts are computed by the engine (signatureNumbers) – the model never invents numbers.
 *   2. Signature features are MEASURED from the image pixels in the browser (measure.ts) – baseline angle, slant,
 *      first-letter size, underline / strike-through, ending stroke, dots, gaps … each with a confidence.
 *   3. A vision-capable LLM (LLM_PROVIDER = anthropic | openai) studies up to three signature samples together with
 *      the measurements, the client's numbers, profession, goals and any expert observations, and returns strict JSON.
 *   4. The JSON is validated (zod). On failure the agent retries once, then falls back to the rule-based analyst,
 *      which also produces a complete report from the measurements.
 *   5. The final score blends the AI's judgement with the deterministic engine score so results are stable.
 * Priority of evidence: expert observation > high-confidence measurement > AI visual reading > low-confidence measurement.
 * Nothing is stored; images are only sent to the configured provider.
 */
import { scrubDeep } from '@/lib/narrative/filter';
import { PLAIN_LANGUAGE } from '@/lib/narrative/prompts';
import { featureHi, hindiParts } from './hindi';
import { humaniseDeep } from './humanise';
import { z } from 'zod';
import { configFromEnv, type LlmConfig } from '@/lib/narrative/providers/llm';
import { FEATURE_WEIGHT, FEATURES, featureLabel, type Impact } from './catalogue';
import type { MeasuredFeatures } from './measure';
import type { SignatureNumbers } from './numbers';

export type SigLanguage = 'en' | 'hi' | 'hinglish';
export type SigImage = { mediaType: 'image/png' | 'image/jpeg' | 'image/webp'; base64: string };
export type ViewKind = 'clean' | 'first' | 'end';
/** Extra close-up views made in the browser from a sample: cleaned (shadows removed), first-letter and ending zooms. */
export interface SigView { sample: number; kind: ViewKind; image: SigImage }
export interface SignatureInput {
  fullName: string; signatureName?: string; dobText: string; gender?: string; profession: string; experienceYears?: number;
  goals: string[]; concerns?: string; language: SigLanguage; hand?: 'right' | 'left';
  images?: SigImage[];
  /** @deprecated single image – use images */
  image?: SigImage;
  observations: Record<string, string>;
  measured?: MeasuredFeatures;
  consistency?: number | null;
  views?: SigView[];
  /** Photo-quality score (0–100) per sample, from the measurement engine. */
  quality?: number[];
}

const Imp = z.enum(['positive', 'neutral', 'watch']);
const Conf = z.enum(['high', 'medium', 'low']);
const Pri = z.enum(['high', 'medium', 'low']);
export const AnalysisSchema = z.object({
  overallScore: z.number().min(0).max(100),
  headline: z.string().min(3).max(200),
  summary: z.string().min(20).max(2000),
  observations: z.array(z.object({ feature: z.string().max(80), observed: z.string().max(300), meaning: z.string().max(600), impact: Imp, confidence: Conf.optional(), featureId: z.string().max(20).optional() })).min(1).max(24),
  personality: z.array(z.string().max(300)).min(1).max(8),
  career: z.object({ fit: z.string().max(800), advice: z.string().max(1200) }),
  finance: z.string().max(800).optional(),
  relationships: z.string().max(800).optional(),
  strengths: z.array(z.string().max(300)).max(8),
  watchouts: z.array(z.string().max(300)).max(8),
  corrections: z.array(z.object({ title: z.string().max(120), detail: z.string().max(600), priority: Pri.optional() })).min(1).max(10),
  idealSignature: z.object({
    steps: z.array(z.string().max(300)).min(1).max(10), startDay: z.string().max(200), inkColour: z.string().max(160), practice: z.string().max(500),
    do: z.array(z.string().max(200)).max(8).optional(), dont: z.array(z.string().max(200)).max(8).optional(),
  }),
  closing: z.string().max(800),
});
export type SignatureAnalysis = z.infer<typeof AnalysisSchema>;
export interface ScoreBreakdown { graphology: number | null; nameVibration: number; firstLetter: number; professionFit: number; consistency: number | null; engine: number; ai: number | null; overall: number }
export interface AgentResult { analysis: SignatureAnalysis; source: 'ai' | 'rules'; model?: string; note?: string; scores: ScoreBreakdown; features: EffectiveFeature[]; inspection?: InspectionSummary }
/**
 * by: expert = set by the numerologist · measured = pixel measurement only · ai = visual inspection only ·
 * fused = pixel measurement and the independent visual inspection were combined.
 */
export interface EffectiveFeature { id: string; feature: string; option: string; label: string; impact: Impact; meaning: string; fix?: string; by: 'expert' | 'measured' | 'ai' | 'fused'; confidence: number; value?: string; valueHi?: string; agreement?: 'agree' | 'near' | 'conflict' | 'single'; alt?: string; evidence?: string }

// ───────────────────────── visual inspection (independent second reader)
export const InspectionSchema = z.object({
  readsAs: z.string().max(160).optional(),
  photoIssues: z.array(z.string().max(200)).max(6).default([]),
  features: z.array(z.object({ id: z.string().max(20), option: z.string().max(20), evidence: z.string().max(300).default(''), confidence: Conf })).max(24),
  extras: z.array(z.object({ feature: z.string().max(80), observed: z.string().max(300) })).max(8).default([]),
});
export type Inspection = z.infer<typeof InspectionSchema>;
export interface FeatureConflict { id: string; feature: string; measured: string; vision: string; chosen: string; evidence?: string }
export interface InspectionSummary { readsAs?: string; photoIssues: string[]; extras: { feature: string; observed: string }[]; compared: number; agreed: number; conflicts: FeatureConflict[] }

/** How far each source can be trusted for each feature. Pixels are exact for geometry; a vision model is better at reading letters and size. */
const PIXEL_REL: Record<string, number> = { baseline: 0.9, underline: 0.9, dots: 0.8, slant: 0.8, curve: 0.8, ink: 0.85, ending: 0.7, first: 0.7, enclosure: 0.7, spacing: 0.6, progression: 0.6, loops: 0.55, zones: 0.5, fluency: 0.5, size: 0.4, legibility: 0.35, pressure: 0.3 };
const VISION_REL: Record<string, number> = { legibility: 0.9, size: 0.8, first: 0.8, enclosure: 0.8, dots: 0.75, underline: 0.75, loops: 0.75, fluency: 0.65, pressure: 0.6, ink: 0.6, baseline: 0.65, slant: 0.6, curve: 0.65 };
const VCONF = { high: 0.85, medium: 0.6, low: 0.35 } as const;
/** Neighbouring options (e.g. rising vs straight) – a mild disagreement, not a contradiction. */
const NEAR: Record<string, [string, string][]> = {
  baseline: [['rising', 'straight'], ['falling', 'straight'], ['wavy', 'straight']], slant: [['right', 'upright'], ['left', 'upright'], ['mixed', 'upright']],
  size: [['large', 'medium'], ['small', 'medium']], first: [['bold', 'proportionate'], ['small', 'proportionate']], ending: [['upward', 'flat'], ['downward', 'flat']],
  pressure: [['heavy', 'medium'], ['light', 'medium']], legibility: [['clear', 'partial'], ['illegible', 'partial']], underline: [['single', 'double']],
  curve: [['even', 'dip'], ['even', 'dropEnd'], ['arched', 'dropEnd']], zones: [['balanced', 'upper'], ['balanced', 'lower']], loops: [['rounded', 'balanced'], ['angular', 'balanced']],
  progression: [['even', 'shrinking'], ['even', 'growing']], fluency: [['fluent', 'steady'], ['broken', 'steady']], spacing: [['connected', 'gaps']],
};
const isNear = (id: string, a: string, b: string) => (NEAR[id] ?? []).some(([x, y]) => (x === a && y === b) || (x === b && y === a));

/** Similarity (0–1) of two names by their letters – longest common subsequence. */
export function letterSimilarity(a: string, b: string): number {
  const x = a.toLowerCase().replace(/[^a-z]/g, ''), y = b.toLowerCase().replace(/[^a-z]/g, '');
  if (!x || !y) return 0;
  const dp = new Array(y.length + 1).fill(0);
  for (let i = 1; i <= x.length; i++) { let prev = 0; for (let j = 1; j <= y.length; j++) { const t = dp[j]; dp[j] = x[i - 1] === y[j - 1] ? prev + 1 : Math.max(dp[j], dp[j - 1]); prev = t; } }
  return dp[y.length] / Math.max(x.length, y.length);
}

/**
 * Combines the three readers for every feature: the expert (always wins), the pixel measurement and the
 * independent visual inspection. Agreement raises certainty (noisy-OR); a contradiction lowers it and is listed
 * so the expert can check it.
 */
export function fuseFeatures(i: SignatureInput, ins: Inspection | null, minConfidence = 0.3): { features: EffectiveFeature[]; conflicts: FeatureConflict[]; compared: number; agreed: number } {
  const out: EffectiveFeature[] = []; const conflicts: FeatureConflict[] = [];
  let compared = 0, agreed = 0;
  const vis = new Map<string, { option: string; c: number; evidence: string }>();
  for (const f of ins?.features ?? []) if (featureLabel(f.id, f.option) && !vis.has(f.id)) vis.set(f.id, { option: f.option, c: VCONF[f.confidence], evidence: f.evidence });
  if (ins?.readsAs && !vis.has('legibility')) {
    const sim = letterSimilarity(ins.readsAs, i.signatureName || i.fullName);
    vis.set('legibility', { option: sim >= 0.75 ? 'clear' : sim >= 0.4 ? 'partial' : 'illegible', c: 0.6, evidence: `reads as “${ins.readsAs}”` });
  }
  const mk = (id: string, option: string, by: EffectiveFeature['by'], confidence: number, extra: Partial<EffectiveFeature> = {}): EffectiveFeature | null => {
    const l = featureLabel(id, option); if (!l) return null;
    return { id, feature: l.feature, option, label: l.label, impact: l.impact, meaning: l.meaning, fix: l.fix, by, confidence: Math.round(confidence * 100) / 100, ...extra };
  };
  for (const f of FEATURES) {
    const exp = i.observations[f.id];
    const m = i.measured?.[f.id];
    const v = vis.get(f.id);
    let e: EffectiveFeature | null = null;
    if (exp) e = mk(f.id, exp, 'expert', 1, { value: m?.option === exp ? m.value : undefined, valueHi: m?.option === exp ? m.valueHi : undefined });
    else if (m && v) {
      compared++;
      const wm = m.confidence * (PIXEL_REL[f.id] ?? 0.5), wv = v.c * (VISION_REL[f.id] ?? 0.7);
      const val = { value: m.value, valueHi: m.valueHi, evidence: v.evidence };
      if (m.option === v.option) { agreed++; e = mk(f.id, m.option, 'fused', Math.min(0.96, 1 - (1 - m.confidence) * (1 - v.c)), { ...val, agreement: 'agree' }); }
      else {
        const useM = wm >= wv, win = useM ? m.option : v.option, lose = useM ? v.option : m.option;
        const wc = useM ? m.confidence : v.c;
        const near = isNear(f.id, m.option, v.option);
        if (near) agreed += 0.5;
        const conf = near ? wc * 0.85 : wc * (0.5 + (0.5 * (Math.max(wm, wv) - Math.min(wm, wv))) / Math.max(wm, wv, 1e-6));
        e = mk(f.id, win, 'fused', conf, { ...(useM ? val : { evidence: v.evidence }), agreement: near ? 'near' : 'conflict', alt: featureLabel(f.id, lose)?.label });
        if (!near) conflicts.push({ id: f.id, feature: f.label, measured: featureLabel(f.id, m.option)?.label ?? m.option, vision: featureLabel(f.id, v.option)?.label ?? v.option, chosen: featureLabel(f.id, win)?.label ?? win, evidence: v.evidence });
      }
    } else if (m && m.confidence >= minConfidence) e = mk(f.id, m.option, 'measured', m.confidence, { value: m.value, valueHi: m.valueHi, agreement: 'single' });
    else if (v) e = mk(f.id, v.option, 'ai', v.c * (VISION_REL[f.id] ?? 0.7) + 0.1, { evidence: v.evidence, agreement: 'single' });
    if (e) out.push(e);
  }
  return { features: out, conflicts, compared, agreed: Math.round(agreed) };
}

const VIEW_NAME: Record<ViewKind, string> = { clean: 'cleaned copy (shadows and paper tint removed, contrast raised)', first: 'close-up of the first letter', end: 'close-up of the ending stroke' };
/** Text that tells the model what each attached image is. */
export function imageGuide(i: SignatureInput): string {
  const s = imagesOf(i).length; const lines: string[] = [];
  for (let k = 0; k < s; k++) lines.push(`Image ${k + 1}: signature sample ${k + 1}, original photo${i.quality?.[k] != null ? ` (photo quality ${i.quality[k]}/100)` : ''}`);
  (i.views ?? []).forEach((v, k) => lines.push(`Image ${s + k + 1}: sample ${v.sample + 1}, ${VIEW_NAME[v.kind]}`));
  return lines.join('\n');
}

export function inspectionPrompt() {
  const allowed = FEATURES.map((f) => `- ${f.id} (${f.label}): ${f.options.map((o) => `${o.id} = ${o.label}`).join(' | ')}`).join('\n');
  return `You are a careful signature examiner. Your only job is to LOOK at the attached images and REPORT what is visible. Do not interpret personality and do not give advice.

Examine each signature from every angle, in this order:
1. Whole signature: its direction against the paper edge or ruled lines (the photo itself may be tilted, so judge against the paper, not the image frame), its size on the page and how much space it takes.
2. Part by part, left to right: the starting stroke, the first letter (its height against the other letters), the middle letters, the last letters and the direction of the final stroke.
3. Lines: an underline below the letters, a stroke that cuts through the letters, a line above the name.
4. Marks: a full stop after the name, dots below it, a circle or loop around the whole signature.
5. Letter forms: slant of the down-strokes against the writing line, round loops or sharp angles, tall upper strokes and long lower strokes, spacing between name parts, parts written over each other.
6. Stroke quality: smooth or hesitant, pen lifts, thick or thin strokes, dark or faint ink, the ink colour.
7. Legibility: write in readsAs exactly what the signature can be read as (letters you are unsure of as ?).
If several samples are attached, compare them and report what is common to them. Use the close-up and cleaned views to check small details. If the photo has a problem (shadow, blur, ruled paper, cropped, tilted), list it in photoIssues.

For every feature you can see, choose exactly ONE option id from the allowed list. Leave out a feature you cannot judge. Use confidence "high" only when it is clearly visible in the images.
Allowed features and options:
${allowed}

Write evidence in short, plain English (what you see, with a location such as "last two letters"). Reply with ONE JSON object and nothing else:
{"readsAs":"R Sharma","photoIssues":["…"],"features":[{"id":"baseline","option":"rising","evidence":"…","confidence":"high"}],"extras":[{"feature":"Starting stroke","observed":"…"}]}`;
}

const LANG: Record<SigLanguage, string> = { en: 'simple Indian English', hi: 'simple Hindi in Devanagari script (keep numbers as digits)', hinglish: 'Hinglish (Hindi written in Roman script, mixed with common English words)' };
const imagesOf = (i: SignatureInput) => (i.images?.length ? i.images : i.image ? [i.image] : []);

/** Expert observations win; otherwise measurements with enough confidence. */
export function effectiveFeatures(i: SignatureInput, minConfidence = 0.3): EffectiveFeature[] {
  const out: EffectiveFeature[] = [];
  for (const f of FEATURES) {
    const exp = i.observations[f.id];
    const mes = i.measured?.[f.id];
    const pick = exp ? { option: exp, by: 'expert' as const, confidence: 1, value: undefined, valueHi: undefined } : mes && mes.confidence >= minConfidence ? { option: mes.option, by: 'measured' as const, confidence: mes.confidence, value: mes.value, valueHi: mes.valueHi } : null;
    if (!pick) continue;
    const l = featureLabel(f.id, pick.option);
    if (!l) continue;
    out.push({ id: f.id, feature: l.feature, option: pick.option, label: l.label, impact: l.impact, meaning: l.meaning, fix: l.fix, by: pick.by, confidence: pick.confidence, value: pick.value, valueHi: pick.valueHi });
  }
  return out;
}

export function graphologyScore(fs: EffectiveFeature[]): number | null {
  let w = 0, s = 0;
  for (const f of fs) { const k = (FEATURE_WEIGHT[f.id] ?? 0.6) * (0.4 + 0.6 * f.confidence); w += k; s += k * (f.impact === 'positive' ? 100 : f.impact === 'neutral' ? 70 : 28); }
  return w >= 1.5 ? Math.round(s / w) : null;
}

export function engineScores(i: SignatureInput, n: SignatureNumbers, fs: EffectiveFeature[], ai: number | null = null): ScoreBreakdown {
  const graphology = graphologyScore(fs);
  const firstLetter = n.firstLetter.toBhagyank === 'friend' ? 90 : n.firstLetter.toBhagyank === 'neutral' ? 65 : 35;
  let engine = graphology === null ? n.numerologyScore : Math.round(0.55 * graphology + 0.45 * n.numerologyScore);
  if (i.consistency != null) engine = Math.round(0.9 * engine + 0.1 * i.consistency);
  const overall = ai === null ? engine : Math.round(graphology === null ? 0.6 * ai + 0.4 * engine : 0.5 * ai + 0.5 * engine);
  return { graphology, nameVibration: n.signName.score, firstLetter, professionFit: n.profession.fitScore, consistency: i.consistency ?? null, engine, ai, overall };
}

export function systemPrompt(lang: SigLanguage) {
  return `You are the Signature Analysis Agent of myNumerologist.com, assisting Acharya Nandram, an Indian numerologist with 15+ years of practice.
You combine graphology (signature analysis) with Vedic/Chaldean numerology to give precise, practical, kind, non-fearful guidance.

Evidence rules (most reliable first):
1. EXPERT OBSERVATIONS from the numerologist – always follow them.
2. CROSS-CHECKED FEATURES (pixel measurement combined with an independent visual inspection) or MEASURED FEATURES computed from the image pixels, each with a certainty 0–1. Treat confidence ≥ 0.6 as fact unless the image clearly shows a photo problem (shadow, ruled paper, cropped). For 0.3–0.6 confirm against the image. Below 0.3 rely on your own reading.
3. Your own careful reading of the attached sample(s): baseline, slant, size, first letter, legibility, pressure, underline, strokes cutting the name, ending stroke, dots/full stops, spacing, enclosure, loops, flourishes, speed and rhythm. If several samples are attached, comment on consistency.
Describe only what is really visible. Never contradict a measurement of confidence ≥ 0.6 without saying why.

Numerology rules: use ONLY the numbers in the facts (they are computed by the engine). Use the ranked signing-name options to advise which name form to sign; never invent other numbers or spellings.

Write for this specific person: connect the signature to their profession, goals and concerns.
- observations: cover every feature listed in the facts (baseline, slant, size, first letter, legibility, pressure, underline, ending, dots, spacing, enclosure, shape of the line, zones, loops, size progression, flow, ink colour) and add other notable details (starting stroke, flourish). Set featureId to the matching id from: ${FEATURES.map((f) => f.id).join(', ')} (omit for extra features) and confidence high/medium/low.
- corrections: most important first, each with priority high/medium/low, concrete and doable (e.g. "make the first letter N about 1.5× taller than the other letters", "end with a light upward stroke", "keep the underline below the name"). Include the name-form change if the facts recommend one.
- idealSignature: step-by-step blueprint, do and dont lists, startDay using the suggested start dates, ink colour, practice routine (traditional: daily for 21 days). Present traditions as tradition, not guarantees.
- Never diagnose illness or mental-health conditions, never predict death, accidents, divorce or disasters, never promise money or results, never shame the person. Use "tends to", "may", "suggests".
- overallScore (0–100) rates how well the CURRENT signature supports the person's goals.
- Write all text values in ${LANG[lang]}.
- Never mention AI, models, software or that the text was generated. You write as Acharya Nandram, in the first person ("I noticed…", "I suggest…"), the way he would speak to a client across the table.
- Sound like a person, not a template: address the client by first name once or twice, mix short and longer sentences, refer to concrete details from THEIR signature and numbers, and avoid stock phrases ("journey", "unlock your potential", "testament to", "delve", "in today's world", "moreover", "furthermore"). Do not use em dashes or en dashes in sentences; use commas or full stops. No emojis.

${PLAIN_LANGUAGE}

Reply with ONE JSON object and nothing else, exactly in this shape:
{"overallScore":72,"headline":"…","summary":"4–6 sentences","observations":[{"featureId":"baseline","feature":"Baseline","observed":"what you see (with the measured value)","meaning":"what it indicates for this person","impact":"positive|neutral|watch","confidence":"high|medium|low"}],"personality":["…"],"career":{"fit":"…","advice":"…"},"finance":"…","relationships":"…","strengths":["…"],"watchouts":["…"],"corrections":[{"title":"…","detail":"…","priority":"high|medium|low"}],"idealSignature":{"steps":["…"],"do":["…"],"dont":["…"],"startDay":"…","inkColour":"…","practice":"…"},"closing":"one short, personal closing line that mentions their first name or their start date"}`;
}

const BY_TEXT: Record<EffectiveFeature['by'], string> = { expert: 'set by the expert', measured: 'pixel measurement', ai: 'visual inspection only', fused: 'pixel measurement + visual inspection' };
const AGREE_TEXT: Record<NonNullable<EffectiveFeature['agreement']>, string> = { agree: 'both agree', near: 'close readings', conflict: 'readings differed', single: 'one source' };

export function factsText(i: SignatureInput, n: SignatureNumbers, cross?: { features: EffectiveFeature[]; inspection?: InspectionSummary }) {
  const obs = Object.entries(i.observations).map(([f, o]) => featureLabel(f, o)).filter(Boolean).map((x) => `- ${x!.feature}: ${x!.label}`);
  const mes = cross ? cross.features.map((f) => `- ${f.feature}: ${f.label}${f.value ? ` — ${f.value}` : ''}${f.evidence ? ` — seen: ${f.evidence}` : ''} [${BY_TEXT[f.by]}${f.agreement ? `, ${AGREE_TEXT[f.agreement]}${f.alt ? ` (other reading: ${f.alt})` : ''}` : ''}; certainty ${f.confidence}]`)
    : Object.entries(i.measured ?? {}).map(([id, m]) => { const l = featureLabel(id, m.option); return l ? `- ${l.feature}: ${l.label} — ${m.value} (confidence ${m.confidence})` : null; }).filter(Boolean);
  const ins = cross?.inspection;
  const imgs = imagesOf(i);
  const opt = (o: SignatureNumbers['nameOptions'][number]) => `${o.text} = ${o.compound}/${o.single} (${o.category}; ${o.toBhagyank} to Bhagyank, ${o.toMoolank} to Moolank; score ${o.score}${o.current ? '; CURRENT' : ''})`;
  return `CLIENT
Full name: ${i.fullName}
Name as signed: ${i.signatureName || '(same as full name)'}
Date of birth: ${i.dobText}${i.gender ? `\nGender: ${i.gender}` : ''}${i.hand ? `\nWriting hand: ${i.hand}` : ''}
Profession: ${i.profession}${i.experienceYears != null ? ` (${i.experienceYears} years)` : ''}
Goals: ${i.goals.length ? i.goals.join(', ') : 'not specified'}
Concerns / notes: ${i.concerns?.trim() || 'none'}

NUMEROLOGY FACTS (computed – use as given)
Moolank (root): ${n.moolank} (${n.moolankPlanet.name}); Bhagyank (destiny): ${n.bhagyankMaster ? `${n.bhagyankMaster}/${n.bhagyank}` : n.bhagyank}; ruling planet of Bhagyank: ${n.planet.name} (day ${n.planet.weekday}, colours ${n.planet.colours.join(', ')})
Full-name number (Chaldean): ${n.fullName.compound}/${n.fullName.single} – ${n.fullName.category}, "${n.fullName.meaning}" – ${n.nameToBhagyank} to Bhagyank, ${n.nameToMoolank} to Moolank
Signed-name number (Chaldean): ${n.signName.compound}/${n.signName.single} – ${n.signName.category}, "${n.signName.meaning}" – ${n.signToBhagyank} to Bhagyank, ${n.signToMoolank} to Moolank; name score ${n.signName.score}/100
First letter: ${n.firstLetter.letter} = ${n.firstLetter.value} (${n.firstLetter.planet}) – ${n.firstLetter.toBhagyank} to Bhagyank
Friendly numbers for Bhagyank: ${n.friendly.join(', ')}; numbers to avoid: ${n.avoid.join(', ') || 'none'}
Profession: ${n.profession.note} Profession fit score: ${n.profession.fitScore}/100
Signing-name options, best first after the current one:
${n.nameOptions.map((o) => `- ${opt(o)}`).join('\n')}
${n.bestOption ? `RECOMMENDED name form to sign: ${n.bestOption.text} (${n.bestOption.compound}/${n.bestOption.single})` : 'The current name form is already among the best – no name change needed.'}
Suggested start dates for the new signature: ${n.startDates.map((d) => `${d.iso} (${d.weekday})`).join(', ') || n.planet.weekday}
Planet signature tip: ${n.planet.signatureTip}
Numerology score: ${n.numerologyScore}/100

${cross ? `CROSS-CHECKED FEATURES (final: pixel measurement and an independent visual inspection, combined; expert settings win${i.consistency != null ? `; consistency across samples ${i.consistency}/100` : ''})` : `MEASURED FEATURES (pixel analysis${i.consistency != null ? `; consistency across samples ${i.consistency}/100` : ''})`}
${mes.length ? mes.join('\n') : '(no measurements – read the image)'}${ins ? `
Visual inspection: signature reads as “${ins.readsAs || 'not readable'}”; ${ins.agreed} of ${ins.compared} compared features agree with the measurement.${ins.extras.length ? `\nOther details seen: ${ins.extras.map((x) => `${x.feature}: ${x.observed}`).join('; ')}` : ''}${ins.photoIssues.length ? `\nPhoto problems: ${ins.photoIssues.join('; ')}` : ''}` : ''}${i.quality?.length ? `\nPhoto quality per sample: ${i.quality.join(', ')} (out of 100)` : ''}

EXPERT OBSERVATIONS
${obs.length ? obs.join('\n') : '(none)'}

${imgs.length ? `${imgs.length} signature sample${imgs.length > 1 ? 's are' : ' is'} attached.${cross ? ' Treat the CROSS-CHECKED FEATURES as final; where the readings differed, word that point carefully (\"appears\", \"seems\").' : ''}` : 'NO IMAGE PROVIDED – base the analysis on the observations and numbers, and say that an image would improve accuracy.'}`;
}

function extractJson(text: string): unknown {
  const s = text.indexOf('{'), e = text.lastIndexOf('}');
  if (s < 0 || e <= s) throw new Error('NO_JSON');
  return JSON.parse(text.slice(s, e + 1));
}

async function callVision(cfg: LlmConfig, model: string, system: string, text: string, images: SigImage[], fetchImpl: typeof fetch): Promise<string> {
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), Math.max(cfg.timeoutMs, 90000));
  try {
    if (cfg.provider === 'gemini') {
      const parts = [
        ...images.map((im) => ({
          inlineData: { mimeType: im.mediaType, data: im.base64 },
        })),
        { text },
      ];
      const url = `${cfg.baseUrl || 'https://generativelanguage.googleapis.com'}/v1beta/models/${model}:generateContent?key=${cfg.apiKey}`;
      const res = await fetchImpl(url, {
        method: 'POST',
        signal: ctrl.signal,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          systemInstruction: { parts: [{ text: system }] },
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4500,
            responseMimeType: 'application/json',
          },
        }),
      });
      if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
      const j = await res.json();
      return (j.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? '').join('\n');
    }
    if (cfg.provider === 'anthropic') {
      const content = [...images.map((im) => ({ type: 'image', source: { type: 'base64', media_type: im.mediaType, data: im.base64 } })), { type: 'text', text }];
      const res = await fetchImpl(`${cfg.baseUrl ?? 'https://api.anthropic.com'}/v1/messages`, { method: 'POST', signal: ctrl.signal,
        headers: { 'content-type': 'application/json', 'x-api-key': cfg.apiKey!, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model, max_tokens: 4500, temperature: 0.2, system, messages: [{ role: 'user', content }] }) });
      if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
      const j = await res.json();
      return (j.content ?? []).filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('\n');
    }
    const content = [{ type: 'text', text }, ...images.map((im) => ({ type: 'image_url', image_url: { url: `data:${im.mediaType};base64,${im.base64}`, detail: 'high' } }))];
    const res = await fetchImpl(`${cfg.baseUrl ?? 'https://api.openai.com'}/v1/chat/completions`, { method: 'POST', signal: ctrl.signal,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({ model, max_tokens: 4500, temperature: 0.2, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system }, { role: 'user', content }] }) });
    if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
    const j = await res.json();
    return String(j.choices?.[0]?.message?.content ?? '');
  } finally { clearTimeout(timer); }
}

const firstNameOf = (full: string) => { const w = full.trim().split(/\s+/)[0] ?? ''; return w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : full; };
/** "R K SHARMA" → "R. K. Sharma" (initials get a dot; empty parts from double spaces are skipped). */
const titleWords = (s: string) => s.split(/\s+/).filter(Boolean).map((x) => (x.length === 1 ? `${x}.` : x.charAt(0) + x.slice(1).toLowerCase())).join(' ');

const PERSONALITY: Record<string, Record<string, string>> = {
  baseline: { rising: 'Optimistic and ambitious, tends to look ahead and work towards growth.', straight: 'Steady and practical, keeps emotions under control at work.', falling: 'May be carrying fatigue or pressure at present; needs encouragement and rest.', wavy: 'Moods and energy can vary from day to day; benefits from routine.' },
  slant: { right: 'Warm and expressive, connects easily with people.', upright: 'Balanced and independent, the head usually rules the heart.', left: 'Reserved and private, may hold back feelings.', mixed: 'Versatile, though reactions can be hard for others to predict.' },
  first: { bold: 'Healthy self-esteem and initiative.', proportionate: 'A balanced, realistic self-image.', small: 'Tends to under-value own achievements.' },
  legibility: { clear: 'Open and straightforward in communication.', partial: 'Shares selectively and values privacy.', illegible: 'Busy and private, others may misread intentions.' },
  underline: { single: 'Self-confident with a stable base.', double: 'Seeks recognition and security.', through: 'Can be self-critical and block own progress.' },
  ending: { upward: 'Finishes with hope and ambition.', downward: 'May end tasks tired or doubtful.' },
  enclosure: { circled: 'Guarded, keeps people and offers at a distance.' },
  curve: { arched: 'Starts things with real enthusiasm; keeping that energy to the finish is the main lesson.', dropEnd: 'Tends to tire in the last stage of a task; plan the finish in advance.' },
  zones: { upper: 'Idealistic, with big plans.', lower: 'Practical and grounded.' },
  loops: { rounded: 'Emotional and caring, people matter a great deal.', angular: 'Direct and quick to decide.' },
  progression: { shrinking: 'Enthusiastic at the start, cautious at the end; focus on completing.' },
  fluency: { fluent: 'Thinks quickly and moves ahead with confidence.', broken: 'Thinks a lot before deciding.' },
};

const FIX_TITLE: Record<string, string> = {
  'baseline:falling': 'Make the baseline rise', 'baseline:wavy': 'Steady the baseline', 'slant:left': 'Give the letters a slight forward slant', 'slant:mixed': 'Keep one consistent slant',
  size: 'Write a little larger', first: 'Enlarge the first letter', legibility: 'Keep the name readable', 'underline:through': 'Remove the stroke cutting through the name',
  ending: 'Finish with an upward stroke', dots: 'Drop the full stop', spacing: 'Space the name parts evenly', enclosure: 'Open the enclosure',
  'curve:arched': 'Keep the line rising to the end', 'curve:dropEnd': 'Stop the ending from dropping', progression: 'Keep the last letters full size', fluency: 'Write the name in one flow', ink: 'Sign in blue ink',
};

/** Offline analyst used when no AI provider is configured or the AI reply is unusable. */
export function ruleBasedAnalysis(i: SignatureInput, n: SignatureNumbers, fs: EffectiveFeature[] = effectiveFeatures(i), score?: number): SignatureAnalysis {
  const count = (k: Impact) => fs.filter((c) => c.impact === k).length;
  const total = score ?? engineScores(i, n, fs).overall;
  const rel = (r: string) => (r === 'friend' ? 'supports' : r === 'neutral' ? 'is neutral to' : 'does not naturally support');
  const conf = (c: number): 'high' | 'medium' | 'low' => (c >= 0.7 ? 'high' : c >= 0.45 ? 'medium' : 'low');
  const watch = fs.filter((c) => c.impact === 'watch' && c.fix && (c.by === 'expert' || c.confidence >= 0.45)).sort((a, b) => (FEATURE_WEIGHT[b.id] ?? 0) - (FEATURE_WEIGHT[a.id] ?? 0));
  if (i.language === 'hi') return ruleBasedAnalysisHi(i, n, fs, total, watch, count);
  const fixes: SignatureAnalysis['corrections'] = watch.map((c, k) => ({ title: FIX_TITLE[`${c.id}:${c.option}`] ?? FIX_TITLE[c.id] ?? `Correct the ${c.feature.toLowerCase()}`, detail: c.fix!, priority: k < 2 && (FEATURE_WEIGHT[c.id] ?? 0) >= 1 ? 'high' : 'medium' }));
  if (n.bestOption) fixes.unshift({ title: `Sign as “${n.bestOption.text}”`, detail: `The name you sign now adds up to number ${n.signName.single}. Writing “${n.bestOption.text}” instead gives number ${n.bestOption.single}, which matches your Bhagyank ${n.bhagyank} (destiny number) much better.`, priority: 'high' });
  else if (n.signToBhagyank === 'enemy') fixes.unshift({ title: 'Adjust the signed name', detail: `Your signature-name number ${n.signName.single} is not friendly to your Bhagyank ${n.bhagyank}. Sign a form of your name whose number is one of ${n.friendly.join(', ')}. I can suggest exact spellings if you message me.`, priority: 'high' });
  if (n.firstLetter.toBhagyank !== 'enemy' && !fs.some((f) => f.id === 'first' && f.option === 'bold')) fixes.push({ title: `Strengthen the first letter “${n.firstLetter.letter}”`, detail: `The letter ${n.firstLetter.letter} carries the number ${n.firstLetter.value} (${n.firstLetter.planet}), which is ${n.firstLetter.toBhagyank === 'friend' ? 'friendly' : 'neutral'} to your Bhagyank. Write it clearly and about 1.5 times taller than the other letters.`, priority: 'medium' });
  if (!fixes.length) fixes.push({ title: 'Keep the strengths', detail: 'Keep the signature rising, readable and free of strokes that cut through the name.', priority: 'low' });
  const pers = [`Bhagyank ${n.bhagyank} (${n.planet.name}) sets the main direction of life; Moolank ${n.moolank} (${n.moolankPlanet.name}) shapes everyday nature.`,
    ...fs.map((f) => PERSONALITY[f.id]?.[f.option]).filter((x): x is string => !!x)].slice(0, 7);
  const dates = n.startDates.map((d) => new Date(`${d.iso}T12:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }));
  const fname = firstNameOf(i.fullName);
  const top = watch[0];
  return {
    overallScore: total,
    headline: total >= 75 ? `${fname}, your signature is working for you` : total >= 55 ? `${fname}, your signature is sound but can do more for you` : `${fname}, your signature needs a few corrections`,
    summary: `Your Bhagyank, taken from your full date of birth, is ${n.bhagyank} and is ruled by ${n.planet.name}. Your Moolank, the day you were born, is ${n.moolank}. The name you write in your signature, “${n.signName.text}”, adds up to ${n.signName.single}, and this number ${rel(n.signToBhagyank)} your Bhagyank. ${fs.length ? `I looked at ${fs.length} features of your signature. ${count('positive')} of them help you, ${count('neutral')} are fine as they are and ${count('watch')} ${count('watch') === 1 ? 'needs' : 'need'} a small change.${top ? ` The most important one is the ${top.feature.toLowerCase()}.` : ''}` : 'I could not read the features from the image, so this reading is based on your numbers only. Please send a clear photo of your signature on plain white paper for a full reading.'}${i.consistency != null && fs.length ? ` Your samples are ${i.consistency >= 75 ? 'quite consistent' : i.consistency >= 50 ? 'fairly consistent' : 'not very consistent'} with each other (${i.consistency}/100).` : ''}`,
    observations: fs.length ? fs.map((c) => ({ featureId: c.id, feature: c.feature, observed: c.value ? `${c.label} (${c.value})` : c.evidence ? `${c.label} (${c.evidence})` : c.label, meaning: c.meaning, impact: c.impact, confidence: conf(c.confidence) })) : [{ feature: 'Signature features', observed: 'Not provided', meaning: 'Upload a signature or mark observations to analyse slant, baseline, size and strokes.', impact: 'neutral' }],
    personality: pers,
    career: { fit: `${n.profession.note} Your fit score for this line of work is ${n.profession.fitScore} out of 100.`, advice: `${n.planet.name}, your ruling planet, traditionally favours ${n.planet.careers.slice(0, 5).join(', ').toLowerCase()}. ${n.planet.signatureTip}` },
    strengths: fs.filter((c) => c.impact === 'positive').sort((a, b) => (FEATURE_WEIGHT[b.id] ?? 0) - (FEATURE_WEIGHT[a.id] ?? 0)).slice(0, 6).map((c) => `${c.feature}: ${c.meaning}`),
    watchouts: fs.filter((c) => c.impact === 'watch').sort((a, b) => (FEATURE_WEIGHT[b.id] ?? 0) - (FEATURE_WEIGHT[a.id] ?? 0)).slice(0, 6).map((c) => `${c.feature}: ${c.meaning}`),
    corrections: fixes.slice(0, 8),
    idealSignature: {
      steps: [`Sign ${n.bestOption ? `“${n.bestOption.text}”` : `“${titleWords(n.signName.text)}”`} with a clear, slightly larger first letter ${n.firstLetter.letter}.`, 'Let the signature rise gently from left to right, about 10–15°.', 'Keep the name readable and never let a stroke cut through it.', 'Finish with a light upward stroke and leave out the full stop.', 'If you like, add one clean underline below the name, not touching the letters.'],
      do: ['Rising baseline', 'Clear, larger first letter', 'Slight right slant', 'Upward finishing stroke', 'Same signature on every document'],
      dont: ['Full stop after the name', 'Line cutting through the letters', 'Circle around the signature', 'Falling or downward ending', 'Overwriting or retouching'],
      startDay: `${n.planet.weekday}, the day of ${n.planet.name}${dates.length ? `. Good dates: ${dates.join(', ')}` : ''}`,
      inkColour: `Blue or black for official documents; ${n.planet.colours.slice(0, 2).join(' / ')} are your traditionally lucky colours for a personal pen.`,
      practice: 'Traditionally the new signature is practised daily (for example 108 times a day for 21 days) until it becomes natural, then used on all new documents.',
    },
    closing: dates.length ? `${fname}, begin on ${dates[0]} and give it 21 days. Small changes, done every day, are what make a signature work for you.` : `${fname}, give the new signature 21 days of daily practice. Small changes, done every day, are what make it work for you.`,
  };
}

/** Hindi version of the built-in analyst (simple, everyday Hindi). */
function ruleBasedAnalysisHi(i: SignatureInput, n: SignatureNumbers, fsEn: EffectiveFeature[], total: number, watchEn: EffectiveFeature[], count: (k: Impact) => number): SignatureAnalysis {
  const fs = fsEn.map((f) => featureHi(f));
  const H = hindiParts(i.fullName, n, total, { positive: count('positive'), neutral: count('neutral'), watch: count('watch'), all: fs.length }, fs);
  const conf = (c: number): 'high' | 'medium' | 'low' => (c >= 0.7 ? 'high' : c >= 0.45 ? 'medium' : 'low');
  const fixes: SignatureAnalysis['corrections'] = watchEn.map((c, k) => ({ title: H.fixTitle(c.id, c.option), detail: featureHi(c).fix ?? '', priority: k < 2 && (FEATURE_WEIGHT[c.id] ?? 0) >= 1 ? 'high' : 'medium' }));
  if (n.bestOption) fixes.unshift({ ...H.signAs(n.bestOption.text, `${n.signName.compound}/${n.signName.single}`, `${n.bestOption.compound}/${n.bestOption.single}`), priority: 'high' });
  else if (n.signToBhagyank === 'enemy') fixes.unshift({ title: 'हस्ताक्षर-नाम बदलें', detail: H.adjustName, priority: 'high' });
  if (n.firstLetter.toBhagyank !== 'enemy' && !fs.some((f) => f.id === 'first' && f.option === 'bold')) fixes.push({ title: `पहला अक्षर "${n.firstLetter.letter}" मज़बूत करें`, detail: H.firstLetter, priority: 'medium' });
  if (!fixes.length) fixes.push({ ...H.keep, priority: 'low' });
  const dates = n.startDates.map((d) => new Date(`${d.iso}T12:00:00Z`).toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' }));
  const byWeight = (a: EffectiveFeature, b: EffectiveFeature) => (FEATURE_WEIGHT[b.id] ?? 0) - (FEATURE_WEIGHT[a.id] ?? 0);
  return {
    overallScore: total,
    headline: H.headline,
    summary: H.summary,
    observations: fs.length ? fs.map((c) => ({ featureId: c.id, feature: c.feature, observed: c.value ? `${c.label} (${c.value})` : c.label, meaning: c.meaning, impact: c.impact, confidence: conf(c.confidence) })) : [{ ...H.noFeatures, impact: 'neutral' }],
    personality: H.personality,
    career: { fit: H.careerFit, advice: H.careerAdvice },
    strengths: fs.filter((c) => c.impact === 'positive').sort(byWeight).slice(0, 6).map((c) => `${c.feature}: ${c.meaning}`),
    watchouts: fs.filter((c) => c.impact === 'watch').sort(byWeight).slice(0, 6).map((c) => `${c.feature}: ${c.meaning}`),
    corrections: fixes.slice(0, 8),
    idealSignature: { steps: H.steps, do: H.do, dont: H.dont, startDay: H.startDay(dates), inkColour: H.ink, practice: H.practice },
    closing: H.closing,
  };
}

async function inspect(cfg: LlmConfig, model: string, i: SignatureInput, fetchImpl: typeof fetch): Promise<Inspection | null> {
  const images = [...imagesOf(i), ...(i.views ?? []).map((v) => v.image)];
  if (!images.length) return null;
  let text = `${imageGuide(i)}\n\nThe person signs as: ${i.signatureName || i.fullName}${i.hand ? ` (writes with the ${i.hand} hand)` : ''}.`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await callVision(cfg, model, inspectionPrompt(), text, images, fetchImpl);
      const p = InspectionSchema.safeParse(extractJson(raw));
      if (p.success) return p.data;
      text += `\n\nYour previous reply was invalid (${p.error.issues.slice(0, 3).map((x) => `${x.path.join('.')}: ${x.message}`).join('; ')}). Reply again with ONLY the JSON object.`;
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (/HTTP 4\d\d/.test(msg) && !/429/.test(msg)) return null;
    }
  }
  return null;
}

export async function runSignatureAgent(i: SignatureInput, n: SignatureNumbers, opts: { env?: Record<string, string | undefined>; fetchImpl?: typeof fetch } = {}): Promise<AgentResult> {
  const env = opts.env ?? process.env;
  const cfg = configFromEnv(env);
  const model = env.SIGNATURE_LLM_MODEL || cfg.model;
  let fs = effectiveFeatures(i);
  const base0 = engineScores(i, n, fs);
  if (cfg.provider === 'template' || !cfg.apiKey || !model) {
    return { analysis: ruleBasedAnalysis(i, n, fs, base0.overall), source: 'rules', scores: base0, features: fs, note: 'AI provider not configured – the report is built from the image measurements and numerology. Set LLM_PROVIDER, an API key and a vision-capable model to add the AI reading.' };
  }
  const fetchImpl = opts.fetchImpl ?? fetch;
  // Pass 1 – an independent visual inspection of every sample and close-up view, fused with the pixel measurements.
  let summary: InspectionSummary | undefined;
  if (imagesOf(i).length && env.SIGNATURE_INSPECT !== 'off') {
    const ins = await inspect(cfg, model, i, fetchImpl);
    if (ins) {
      const fused = fuseFeatures(i, ins);
      fs = fused.features;
      summary = { readsAs: ins.readsAs, photoIssues: ins.photoIssues, extras: ins.extras, compared: fused.compared, agreed: fused.agreed, conflicts: fused.conflicts };
    }
  }
  const base = engineScores(i, n, fs);
  // Pass 2 – the written analysis, from the cross-checked features and the numbers.
  const system = systemPrompt(i.language);
  const facts = () => factsText(i, n, summary ? { features: fs, inspection: summary } : undefined);
  let text = facts();
  let lastErr = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await callVision(cfg, model, system, text, imagesOf(i), fetchImpl);
      const parsed = AnalysisSchema.safeParse(extractJson(raw));
      if (parsed.success) {
        const scores = engineScores(i, n, fs, Math.round(parsed.data.overallScore));
        return { analysis: { ...humaniseDeep(scrubDeep(parsed.data)), overallScore: scores.overall }, source: 'ai', model, scores, features: fs, inspection: summary };
      }
      lastErr = parsed.error.issues.slice(0, 5).map((x) => `${x.path.join('.')}: ${x.message}`).join('; ');
      text = `${facts()}\n\nYour previous reply was invalid (${lastErr}). Reply again with ONLY the JSON object in the required shape.`;
    } catch (e) {
      lastErr = e instanceof Error ? e.message : 'error';
      if (/HTTP 4\d\d/.test(lastErr) && !/429/.test(lastErr)) break;
    }
  }
  console.error('signature agent fallback:', lastErr.slice(0, 160));
  return { analysis: ruleBasedAnalysis(i, n, fs, base.overall), source: 'rules', model, scores: base, features: fs, inspection: summary, note: summary ? 'The written AI reply could not be used this time, so the report text is built from the cross-checked features and numerology.' : 'The AI reply could not be used this time, so the report is built from the image measurements and numerology. Try again in a moment.' };
}

export { FEATURES };
