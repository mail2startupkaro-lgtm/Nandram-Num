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
import { z } from 'zod';
import { configFromEnv, type LlmConfig } from '@/lib/narrative/providers/llm';
import { FEATURE_WEIGHT, FEATURES, featureLabel, type Impact } from './catalogue';
import type { MeasuredFeatures } from './measure';
import type { SignatureNumbers } from './numbers';

export type SigLanguage = 'en' | 'hi' | 'hinglish';
export type SigImage = { mediaType: 'image/png' | 'image/jpeg' | 'image/webp'; base64: string };
export interface SignatureInput {
  fullName: string; signatureName?: string; dobText: string; gender?: string; profession: string; experienceYears?: number;
  goals: string[]; concerns?: string; language: SigLanguage; hand?: 'right' | 'left';
  images?: SigImage[];
  /** @deprecated single image – use images */
  image?: SigImage;
  observations: Record<string, string>;
  measured?: MeasuredFeatures;
  consistency?: number | null;
}

const Imp = z.enum(['positive', 'neutral', 'watch']);
const Conf = z.enum(['high', 'medium', 'low']);
const Pri = z.enum(['high', 'medium', 'low']);
export const AnalysisSchema = z.object({
  overallScore: z.number().min(0).max(100),
  headline: z.string().min(3).max(200),
  summary: z.string().min(20).max(2000),
  observations: z.array(z.object({ feature: z.string().max(80), observed: z.string().max(300), meaning: z.string().max(600), impact: Imp, confidence: Conf.optional(), featureId: z.string().max(20).optional() })).min(1).max(16),
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
export interface AgentResult { analysis: SignatureAnalysis; source: 'ai' | 'rules'; model?: string; note?: string; scores: ScoreBreakdown; features: EffectiveFeature[] }
export interface EffectiveFeature { id: string; feature: string; option: string; label: string; impact: Impact; meaning: string; fix?: string; by: 'expert' | 'measured'; confidence: number; value?: string }

const LANG: Record<SigLanguage, string> = { en: 'simple Indian English', hi: 'simple Hindi in Devanagari script (keep numbers as digits)', hinglish: 'Hinglish (Hindi written in Roman script, mixed with common English words)' };
const imagesOf = (i: SignatureInput) => (i.images?.length ? i.images : i.image ? [i.image] : []);

/** Expert observations win; otherwise measurements with enough confidence. */
export function effectiveFeatures(i: SignatureInput, minConfidence = 0.3): EffectiveFeature[] {
  const out: EffectiveFeature[] = [];
  for (const f of FEATURES) {
    const exp = i.observations[f.id];
    const mes = i.measured?.[f.id];
    const pick = exp ? { option: exp, by: 'expert' as const, confidence: 1, value: undefined } : mes && mes.confidence >= minConfidence ? { option: mes.option, by: 'measured' as const, confidence: mes.confidence, value: mes.value } : null;
    if (!pick) continue;
    const l = featureLabel(f.id, pick.option);
    if (!l) continue;
    out.push({ id: f.id, feature: l.feature, option: pick.option, label: l.label, impact: l.impact, meaning: l.meaning, fix: l.fix, by: pick.by, confidence: pick.confidence, value: pick.value });
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
2. MEASURED FEATURES computed from the image pixels, each with a confidence 0–1. Treat confidence ≥ 0.6 as fact unless the image clearly shows a photo problem (shadow, ruled paper, cropped). For 0.3–0.6 confirm against the image. Below 0.3 rely on your own reading.
3. Your own careful reading of the attached sample(s): baseline, slant, size, first letter, legibility, pressure, underline, strokes cutting the name, ending stroke, dots/full stops, spacing, enclosure, loops, flourishes, speed and rhythm. If several samples are attached, comment on consistency.
Describe only what is really visible. Never contradict a measurement of confidence ≥ 0.6 without saying why.

Numerology rules: use ONLY the numbers in the facts (they are computed by the engine). Use the ranked signing-name options to advise which name form to sign; never invent other numbers or spellings.

Write for this specific person: connect the signature to their profession, goals and concerns.
- observations: cover every feature (baseline, slant, size, first letter, legibility, pressure, underline, ending, dots, spacing, enclosure; add loops/flourish/speed if notable). Set featureId to the matching id from: ${FEATURES.map((f) => f.id).join(', ')} (omit for extra features) and confidence high/medium/low.
- corrections: most important first, each with priority high/medium/low, concrete and doable (e.g. "make the first letter N about 1.5× taller than the other letters", "end with a light upward stroke", "keep the underline below the name"). Include the name-form change if the facts recommend one.
- idealSignature: step-by-step blueprint, do and dont lists, startDay using the suggested start dates, ink colour, practice routine (traditional: daily for 21 days). Present traditions as tradition, not guarantees.
- Never diagnose illness or mental-health conditions, never predict death, accidents, divorce or disasters, never promise money or results, never shame the person. Use "tends to", "may", "suggests".
- overallScore (0–100) rates how well the CURRENT signature supports the person's goals.
- Write all text values in ${LANG[lang]}.
- Never mention AI, models, software or that the text was generated – you write as Acharya Nandram's analyst.

${PLAIN_LANGUAGE}

Reply with ONE JSON object and nothing else, exactly in this shape:
{"overallScore":72,"headline":"…","summary":"4–6 sentences","observations":[{"featureId":"baseline","feature":"Baseline","observed":"what you see (with the measured value)","meaning":"what it indicates for this person","impact":"positive|neutral|watch","confidence":"high|medium|low"}],"personality":["…"],"career":{"fit":"…","advice":"…"},"finance":"…","relationships":"…","strengths":["…"],"watchouts":["…"],"corrections":[{"title":"…","detail":"…","priority":"high|medium|low"}],"idealSignature":{"steps":["…"],"do":["…"],"dont":["…"],"startDay":"…","inkColour":"…","practice":"…"},"closing":"one encouraging line"}`;
}

export function factsText(i: SignatureInput, n: SignatureNumbers) {
  const obs = Object.entries(i.observations).map(([f, o]) => featureLabel(f, o)).filter(Boolean).map((x) => `- ${x!.feature}: ${x!.label}`);
  const mes = Object.entries(i.measured ?? {}).map(([id, m]) => { const l = featureLabel(id, m.option); return l ? `- ${l.feature}: ${l.label} — ${m.value} (confidence ${m.confidence})` : null; }).filter(Boolean);
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

MEASURED FEATURES (pixel analysis${i.consistency != null ? `; consistency across samples ${i.consistency}/100` : ''})
${mes.length ? mes.join('\n') : '(no measurements – read the image)'}

EXPERT OBSERVATIONS
${obs.length ? obs.join('\n') : '(none)'}

${imgs.length ? `${imgs.length} signature sample${imgs.length > 1 ? 's are' : ' is'} attached.` : 'NO IMAGE PROVIDED – base the analysis on the observations and numbers, and say that an image would improve accuracy.'}`;
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

const PERSONALITY: Record<string, Record<string, string>> = {
  baseline: { rising: 'Optimistic and ambitious – tends to look ahead and work towards growth.', straight: 'Steady and practical – keeps emotions under control at work.', falling: 'May be carrying fatigue or pressure at present; needs encouragement and rest.', wavy: 'Moods and energy can vary from day to day; benefits from routine.' },
  slant: { right: 'Warm and expressive – connects easily with people.', upright: 'Balanced and independent – the head usually rules the heart.', left: 'Reserved and private – may hold back feelings.', mixed: 'Versatile, though reactions can be hard for others to predict.' },
  first: { bold: 'Healthy self-esteem and initiative.', proportionate: 'A balanced, realistic self-image.', small: 'Tends to under-value own achievements.' },
  legibility: { clear: 'Open and straightforward in communication.', partial: 'Shares selectively and values privacy.', illegible: 'Busy and private – others may misread intentions.' },
  underline: { single: 'Self-confident with a stable base.', double: 'Seeks recognition and security.', through: 'Can be self-critical and block own progress.' },
  ending: { upward: 'Finishes with hope and ambition.', downward: 'May end tasks tired or doubtful.' },
  enclosure: { circled: 'Guarded – keeps people and offers at a distance.' },
};

const FIX_TITLE: Record<string, string> = {
  'baseline:falling': 'Make the baseline rise', 'baseline:wavy': 'Steady the baseline', 'slant:left': 'Give the letters a slight forward slant', 'slant:mixed': 'Keep one consistent slant',
  size: 'Write a little larger', first: 'Enlarge the first letter', legibility: 'Keep the name readable', 'underline:through': 'Remove the stroke cutting through the name',
  ending: 'Finish with an upward stroke', dots: 'Drop the full stop', spacing: 'Space the name parts evenly', enclosure: 'Open the enclosure',
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
  else if (n.signToBhagyank === 'enemy') fixes.unshift({ title: 'Adjust the signed name', detail: `Your signature-name number ${n.signName.single} is not friendly to your Bhagyank ${n.bhagyank}. Sign a form of your name whose number is one of ${n.friendly.join(', ')} – Acharya Nandram can suggest exact spellings.`, priority: 'high' });
  if (n.firstLetter.toBhagyank !== 'enemy' && !fs.some((f) => f.id === 'first' && f.option === 'bold')) fixes.push({ title: `Strengthen the first letter “${n.firstLetter.letter}”`, detail: `${n.firstLetter.letter} carries ${n.firstLetter.value} (${n.firstLetter.planet}), ${n.firstLetter.toBhagyank} to your Bhagyank – write it clearly and about 1.5× taller than the other letters.`, priority: 'medium' });
  if (!fixes.length) fixes.push({ title: 'Keep the strengths', detail: 'Keep the signature rising, readable and free of strokes that cut through the name.', priority: 'low' });
  const pers = [`Bhagyank ${n.bhagyank} (${n.planet.name}) sets the main direction of life; Moolank ${n.moolank} (${n.moolankPlanet.name}) shapes everyday nature.`,
    ...fs.map((f) => PERSONALITY[f.id]?.[f.option]).filter((x): x is string => !!x)].slice(0, 7);
  const dates = n.startDates.map((d) => new Date(`${d.iso}T12:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }));
  return {
    overallScore: total,
    headline: total >= 75 ? 'A supportive signature with small refinements' : total >= 55 ? 'A workable signature that can be strengthened' : 'A signature that needs correction to support your goals',
    summary: `${i.fullName}'s Bhagyank (destiny number, from the full date of birth) is ${n.bhagyank}, ruled by ${n.planet.name}. The Moolank (birth-day number) is ${n.moolank}. The name in the signature, “${n.signName.text}”, adds up to number ${n.signName.single}, which ${rel(n.signToBhagyank)} the Bhagyank. ${fs.length ? `We looked at ${fs.length} things in the signature: ${count('positive')} are good, ${count('neutral')} are fine and ${count('watch')} need a small change.` : 'No signature features could be read, so this assessment is based on numerology only; add a clear signature image for a complete reading.'}${i.consistency != null ? ` Consistency across samples is ${i.consistency}/100.` : ''}`,
    observations: fs.length ? fs.map((c) => ({ featureId: c.id, feature: c.feature, observed: c.value ? `${c.label} (${c.value})` : c.label, meaning: c.meaning, impact: c.impact, confidence: conf(c.confidence) })) : [{ feature: 'Signature features', observed: 'Not provided', meaning: 'Upload a signature or mark observations to analyse slant, baseline, size and strokes.', impact: 'neutral' }],
    personality: pers,
    career: { fit: `${n.profession.note} Fit score: ${n.profession.fitScore}/100.`, advice: `Careers traditionally favoured by ${n.planet.name}: ${n.planet.careers.join(', ')}. ${n.planet.signatureTip}` },
    strengths: fs.filter((c) => c.impact === 'positive').sort((a, b) => (FEATURE_WEIGHT[b.id] ?? 0) - (FEATURE_WEIGHT[a.id] ?? 0)).slice(0, 6).map((c) => `${c.feature}: ${c.meaning}`),
    watchouts: fs.filter((c) => c.impact === 'watch').sort((a, b) => (FEATURE_WEIGHT[b.id] ?? 0) - (FEATURE_WEIGHT[a.id] ?? 0)).slice(0, 6).map((c) => `${c.feature}: ${c.meaning}`),
    corrections: fixes.slice(0, 8),
    idealSignature: {
      steps: [`Sign ${n.bestOption ? `“${n.bestOption.text}”` : `“${n.signName.text.split(' ').map((x) => x[0] + x.slice(1).toLowerCase()).join(' ')}”`} with a clear, slightly larger first letter ${n.firstLetter.letter}.`, 'Keep the baseline rising gently (about 10–15°) from left to right.', 'Keep the name readable; never let a stroke cut through it.', 'Finish with a light upward stroke – no full stop.', 'If you like, add one clean underline below the name, not touching the letters.'],
      do: ['Rising baseline', 'Clear, larger first letter', 'Slight right slant', 'Upward finishing stroke', 'Same signature on every document'],
      dont: ['Full stop after the name', 'Line cutting through the letters', 'Circle around the signature', 'Falling or downward ending', 'Overwriting or retouching'],
      startDay: `${n.planet.weekday} (day of ${n.planet.name})${dates.length ? ` – suggested dates: ${dates.join(', ')}` : ''}`,
      inkColour: `Blue or black for official documents; ${n.planet.colours.slice(0, 2).join(' / ')} are your traditionally lucky colours for a personal pen.`,
      practice: 'Traditionally the new signature is practised daily (for example 108 times a day for 21 days) until it becomes natural, then used on all new documents.',
    },
    closing: 'A signature is a daily affirmation – small, consistent corrections help it support your goals.',
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

export async function runSignatureAgent(i: SignatureInput, n: SignatureNumbers, opts: { env?: Record<string, string | undefined>; fetchImpl?: typeof fetch } = {}): Promise<AgentResult> {
  const env = opts.env ?? process.env;
  const cfg = configFromEnv(env);
  const model = env.SIGNATURE_LLM_MODEL || cfg.model;
  const fs = effectiveFeatures(i);
  const base = engineScores(i, n, fs);
  if (cfg.provider === 'template' || !cfg.apiKey || !model) {
    return { analysis: ruleBasedAnalysis(i, n, fs, base.overall), source: 'rules', scores: base, features: fs, note: 'AI provider not configured – the report is built from the image measurements and numerology. Set LLM_PROVIDER, an API key and a vision-capable model to add the AI reading.' };
  }
  const system = systemPrompt(i.language);
  let text = factsText(i, n);
  let lastErr = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await callVision(cfg, model, system, text, imagesOf(i), opts.fetchImpl ?? fetch);
      const parsed = AnalysisSchema.safeParse(extractJson(raw));
      if (parsed.success) {
        const scores = engineScores(i, n, fs, Math.round(parsed.data.overallScore));
        return { analysis: { ...scrubDeep(parsed.data), overallScore: scores.overall }, source: 'ai', model, scores, features: fs };
      }
      lastErr = parsed.error.issues.slice(0, 5).map((x) => `${x.path.join('.')}: ${x.message}`).join('; ');
      text = `${factsText(i, n)}\n\nYour previous reply was invalid (${lastErr}). Reply again with ONLY the JSON object in the required shape.`;
    } catch (e) {
      lastErr = e instanceof Error ? e.message : 'error';
      if (/HTTP 4\d\d/.test(lastErr) && !/429/.test(lastErr)) break;
    }
  }
  console.error('signature agent fallback:', lastErr.slice(0, 160));
  return { analysis: ruleBasedAnalysis(i, n, fs, base.overall), source: 'rules', model, scores: base, features: fs, note: 'The AI reply could not be used this time, so the report is built from the image measurements and numerology. Try again in a moment.' };
}

export { FEATURES };
