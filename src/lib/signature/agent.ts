/**
 * AI Signature Analysis Agent.
 *   1. Numerology facts are computed by the engine (signatureNumbers) – the model never invents numbers.
 *   2. A vision-capable LLM (LLM_PROVIDER = anthropic | openai) studies the signature image together with
 *      the client's name, DOB numbers, profession, goals and any expert observations, and returns strict JSON.
 *   3. The JSON is validated (zod). On failure the agent retries once with the validation errors,
 *      then falls back to the rule-based analyst built from the feature catalogue.
 * Model: SIGNATURE_LLM_MODEL (optional) or LLM_MODEL. Nothing is stored; the image is only sent to the configured provider.
 */
import { z } from 'zod';
import { configFromEnv, type LlmConfig } from '@/lib/narrative/providers/llm';
import { FEATURES, featureLabel, type Impact } from './catalogue';
import type { SignatureNumbers } from './numbers';

export type SigLanguage = 'en' | 'hi' | 'hinglish';
export interface SignatureInput {
  fullName: string; signatureName?: string; dobText: string; gender?: string; profession: string; experienceYears?: number;
  goals: string[]; concerns?: string; language: SigLanguage; hand?: 'right' | 'left';
  image?: { mediaType: 'image/png' | 'image/jpeg' | 'image/webp'; base64: string };
  observations: Record<string, string>;
}

const Imp = z.enum(['positive', 'neutral', 'watch']);
export const AnalysisSchema = z.object({
  overallScore: z.number().min(0).max(100),
  headline: z.string().min(3).max(200),
  summary: z.string().min(20).max(2000),
  observations: z.array(z.object({ feature: z.string().max(80), observed: z.string().max(300), meaning: z.string().max(600), impact: Imp })).min(1).max(14),
  personality: z.array(z.string().max(300)).min(1).max(8),
  career: z.object({ fit: z.string().max(800), advice: z.string().max(1200) }),
  strengths: z.array(z.string().max(300)).max(8),
  watchouts: z.array(z.string().max(300)).max(8),
  corrections: z.array(z.object({ title: z.string().max(120), detail: z.string().max(600) })).min(1).max(10),
  idealSignature: z.object({ steps: z.array(z.string().max(300)).min(1).max(10), startDay: z.string().max(120), inkColour: z.string().max(120), practice: z.string().max(500) }),
  closing: z.string().max(800),
});
export type SignatureAnalysis = z.infer<typeof AnalysisSchema>;
export interface AgentResult { analysis: SignatureAnalysis; source: 'ai' | 'rules'; model?: string; note?: string }

const LANG: Record<SigLanguage, string> = { en: 'simple Indian English', hi: 'simple Hindi in Devanagari script (keep numbers as digits)', hinglish: 'Hinglish (Hindi written in Roman script, mixed with common English words)' };

export function systemPrompt(lang: SigLanguage) {
  return `You are the Signature Analysis Agent of myNumerologist.com, assisting Acharya Nandram, an Indian numerologist with 15+ years of practice.
You combine graphology (signature analysis) with Vedic/Chaldean numerology to give practical, kind, non-fearful guidance.

How to work:
- Study the signature image carefully: baseline direction, slant, size, first letter, legibility, pen pressure (stroke thickness), underline, ending stroke, dots/full stops, strokes cutting through the name, spacing, and overall flow/speed. Describe only what you can actually see. If there is no image or it is unclear, say so and rely on the expert observations and numbers.
- Expert observations supplied by the numerologist override your own reading if they conflict.
- Use ONLY the numerology numbers given in the facts. Never calculate or invent other numbers.
- Connect the signature with the person's profession, goals and concerns. Be specific to them.
- Corrections must be concrete and doable (e.g. "make the first letter of NANDRAM about 1.5× taller", "end with a gentle upward stroke", "keep the underline below the name"). Include traditional Indian practice where useful (start the new signature on the ruling planet's day, practise it daily for 21 days) and present it as tradition, not a guarantee.
- Never diagnose illness or mental-health conditions, never predict death, accidents, divorce or disasters, never promise money or results, and never shame the person. Use "tends to", "may", "suggests".
- overallScore (0–100) rates how well the CURRENT signature supports the person's goals.
- Write all text values in ${LANG[lang]}.

Reply with ONE JSON object and nothing else, exactly in this shape:
{"overallScore":72,"headline":"…","summary":"3–5 sentences","observations":[{"feature":"Baseline","observed":"what you see","meaning":"what it indicates for this person","impact":"positive|neutral|watch"}],"personality":["…"],"career":{"fit":"how the signature and numbers suit the profession","advice":"…"},"strengths":["…"],"watchouts":["…"],"corrections":[{"title":"…","detail":"…"}],"idealSignature":{"steps":["…"],"startDay":"…","inkColour":"…","practice":"…"},"closing":"one encouraging line"}`;
}

export function factsText(i: SignatureInput, n: SignatureNumbers) {
  const obs = Object.entries(i.observations).map(([f, o]) => featureLabel(f, o)).filter(Boolean).map((x) => `- ${x!.feature}: ${x!.label}`);
  return `CLIENT
Full name: ${i.fullName}
Name as signed: ${i.signatureName || '(same as full name)'}
Date of birth: ${i.dobText}${i.gender ? `\nGender: ${i.gender}` : ''}${i.hand ? `\nWriting hand: ${i.hand}` : ''}
Profession: ${i.profession}${i.experienceYears != null ? ` (${i.experienceYears} years)` : ''}
Goals: ${i.goals.length ? i.goals.join(', ') : 'not specified'}
Concerns / notes: ${i.concerns?.trim() || 'none'}

NUMEROLOGY FACTS (computed – use as given)
Moolank (root): ${n.moolank}; Bhagyank (destiny): ${n.bhagyankMaster ? `${n.bhagyankMaster}/${n.bhagyank}` : n.bhagyank}; ruling planet of Bhagyank: ${n.planet.name} (day ${n.planet.weekday}, colours ${n.planet.colours.join(', ')})
Full-name number (Chaldean): ${n.fullName.compound} → ${n.fullName.single} — ${n.nameToBhagyank} to Bhagyank, ${n.nameToMoolank} to Moolank
Signature-name number (Chaldean): ${n.signName.compound} → ${n.signName.single} — ${n.signToBhagyank} to Bhagyank
First letter: ${n.firstLetter.letter} = ${n.firstLetter.value}
Friendly numbers for Bhagyank: ${n.friendly.join(', ')}; numbers to avoid: ${n.avoid.join(', ') || 'none'}
Profession: ${n.profession.note} Profession fit score: ${n.profession.fitScore}/100
Planet signature tip: ${n.planet.signatureTip}
Numerology score: ${n.numerologyScore}/100

EXPERT OBSERVATIONS
${obs.length ? obs.join('\n') : '(none – read the image)'}

${i.image ? 'The signature image is attached.' : 'NO IMAGE PROVIDED – base the analysis on the observations and numbers, and say that an image would improve accuracy.'}`;
}

function extractJson(text: string): unknown {
  const s = text.indexOf('{'), e = text.lastIndexOf('}');
  if (s < 0 || e <= s) throw new Error('NO_JSON');
  return JSON.parse(text.slice(s, e + 1));
}

async function callVision(cfg: LlmConfig, model: string, system: string, text: string, image: SignatureInput['image'], fetchImpl: typeof fetch): Promise<string> {
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), Math.max(cfg.timeoutMs, 60000));
  try {
    if (cfg.provider === 'anthropic') {
      const content = [...(image ? [{ type: 'image', source: { type: 'base64', media_type: image.mediaType, data: image.base64 } }] : []), { type: 'text', text }];
      const res = await fetchImpl(`${cfg.baseUrl ?? 'https://api.anthropic.com'}/v1/messages`, { method: 'POST', signal: ctrl.signal,
        headers: { 'content-type': 'application/json', 'x-api-key': cfg.apiKey!, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model, max_tokens: 3000, temperature: 0.4, system, messages: [{ role: 'user', content }] }) });
      if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
      const j = await res.json();
      return (j.content ?? []).filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('\n');
    }
    const content = [{ type: 'text', text }, ...(image ? [{ type: 'image_url', image_url: { url: `data:${image.mediaType};base64,${image.base64}` } }] : [])];
    const res = await fetchImpl(`${cfg.baseUrl ?? 'https://api.openai.com'}/v1/chat/completions`, { method: 'POST', signal: ctrl.signal,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({ model, max_tokens: 3000, temperature: 0.4, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system }, { role: 'user', content }] }) });
    if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
    const j = await res.json();
    return String(j.choices?.[0]?.message?.content ?? '');
  } finally { clearTimeout(timer); }
}

/** Offline analyst used when no AI provider is configured or the AI reply is unusable. */
export function ruleBasedAnalysis(i: SignatureInput, n: SignatureNumbers): SignatureAnalysis {
  const chosen = Object.entries(i.observations).map(([f, o]) => featureLabel(f, o)).filter((x): x is NonNullable<ReturnType<typeof featureLabel>> => !!x);
  const count = (k: Impact) => chosen.filter((c) => c.impact === k).length;
  const sigScore = chosen.length ? Math.max(25, Math.min(95, 62 + 6 * count('positive') - 8 * count('watch'))) : 60;
  const score = Math.round(0.6 * sigScore + 0.4 * n.numerologyScore);
  const rel = (r: string) => (r === 'friend' ? 'supports' : r === 'neutral' ? 'is neutral to' : 'does not naturally support');
  const fixes = chosen.filter((c) => c.fix).map((c) => ({ title: `Correct the ${c.feature.toLowerCase()}`, detail: c.fix! }));
  if (n.signToBhagyank === 'enemy') fixes.unshift({ title: 'Adjust the signed name', detail: `Your signature-name number ${n.signName.single} is not friendly to your Bhagyank ${n.bhagyank}. Sign a form of your name (initials + surname, or full first name) whose number is one of ${n.friendly.join(', ')} – Acharya Nandram can suggest exact spellings.` });
  if (!fixes.length) fixes.push({ title: 'Keep the strengths', detail: 'Keep the signature rising, readable and free of strokes that cut through the name.' });
  return {
    overallScore: score,
    headline: score >= 75 ? 'A supportive signature with small refinements' : score >= 55 ? 'A workable signature that can be strengthened' : 'A signature that needs correction to support your goals',
    summary: `${i.fullName}'s Bhagyank is ${n.bhagyank} (${n.planet.name}) and Moolank ${n.moolank}. The signed name "${n.signName.text}" vibrates to ${n.signName.single}, which ${rel(n.signToBhagyank)} the Bhagyank. ${chosen.length ? `From the observed features, ${count('positive')} support growth and ${count('watch')} need attention.` : 'No signature features were marked and no AI reading was available, so this assessment is based on numerology only; add the signature image or mark the observed features for a complete reading.'}`,
    observations: chosen.length ? chosen.map((c) => ({ feature: c.feature, observed: c.label, meaning: c.meaning, impact: c.impact })) : [{ feature: 'Signature features', observed: 'Not provided', meaning: 'Upload a signature or mark observations to analyse slant, baseline, size and strokes.', impact: 'neutral' }],
    personality: [`Bhagyank ${n.bhagyank} ruled by ${n.planet.name} gives the core direction of life.`, `Moolank ${n.moolank} shapes day-to-day nature and first impressions.`, ...chosen.filter((c) => c.impact !== 'neutral').slice(0, 3).map((c) => c.meaning)],
    career: { fit: `${n.profession.note} Fit score: ${n.profession.fitScore}/100.`, advice: `Careers traditionally favoured by ${n.planet.name}: ${n.planet.careers.join(', ')}. ${n.planet.signatureTip}` },
    strengths: chosen.filter((c) => c.impact === 'positive').map((c) => `${c.feature}: ${c.meaning}`),
    watchouts: chosen.filter((c) => c.impact === 'watch').map((c) => `${c.feature}: ${c.meaning}`),
    corrections: fixes.slice(0, 8),
    idealSignature: {
      steps: ['Start with a clear, slightly larger first letter.', 'Keep the baseline rising gently from left to right.', 'Keep the name readable; avoid strokes that cut through it.', 'Finish with a light upward stroke; no full stop.', 'Use a single clean underline below the name if you like.'],
      startDay: `${n.planet.weekday} (day of ${n.planet.name}, your Bhagyank planet)`,
      inkColour: `Blue or black for official documents; ${n.planet.colours.slice(0, 2).join(' / ')} are your traditionally lucky colours for a personal pen.`,
      practice: 'Traditionally the new signature is practised daily (for example 108 times a day for 21 days) until it becomes natural, then used on all new documents.',
    },
    closing: 'A signature is a daily affirmation – small, consistent corrections help it support your goals.',
  };
}

export async function runSignatureAgent(i: SignatureInput, n: SignatureNumbers, opts: { env?: Record<string, string | undefined>; fetchImpl?: typeof fetch } = {}): Promise<AgentResult> {
  const env = opts.env ?? process.env;
  const cfg = configFromEnv(env);
  const model = env.SIGNATURE_LLM_MODEL || cfg.model;
  if (cfg.provider === 'template' || !cfg.apiKey || !model) {
    return { analysis: ruleBasedAnalysis(i, n), source: 'rules', note: 'AI provider not configured – rule-based analysis shown. Set LLM_PROVIDER, an API key and a vision-capable model to enable the AI agent.' };
  }
  const system = systemPrompt(i.language);
  let text = factsText(i, n);
  let lastErr = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await callVision(cfg, model, system, text, i.image, opts.fetchImpl ?? fetch);
      const parsed = AnalysisSchema.safeParse(extractJson(raw));
      if (parsed.success) return { analysis: { ...parsed.data, overallScore: Math.round(parsed.data.overallScore) }, source: 'ai', model };
      lastErr = parsed.error.issues.slice(0, 5).map((x) => `${x.path.join('.')}: ${x.message}`).join('; ');
      text = `${factsText(i, n)}\n\nYour previous reply was invalid (${lastErr}). Reply again with ONLY the JSON object in the required shape.`;
    } catch (e) {
      lastErr = e instanceof Error ? e.message : 'error';
      if (/HTTP 4\d\d/.test(lastErr) && !/429/.test(lastErr)) break;
    }
  }
  console.error('signature agent fallback:', lastErr.slice(0, 160));
  return { analysis: ruleBasedAnalysis(i, n), source: 'rules', model, note: 'The AI reply could not be used this time, so the rule-based analysis is shown. Try again in a moment.' };
}

export { FEATURES };
