/**
 * Report Studio accuracy checks. Everything here is advisory: it helps the expert catch input mistakes
 * (day/month swaps, spelling, missing details) and cross-checks the engine's core numbers independently.
 */
import type { ClientInput, NumerologyResult, ReportModule } from '@/lib/numerology';
import type { Narrative } from '@/lib/narrative/service';

export type CheckLevel = 'ok' | 'info' | 'warn' | 'error';
export interface Check { level: CheckLevel; label: string; detail: string }

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const digitSum = (n: number | string) => String(n).replace(/\D/g, '').split('').reduce((a, d) => a + Number(d), 0);
/** Reduce to a single digit (1–9). */
export function reduceSingle(n: number): number {
  let x = n;
  while (x > 9) x = digitSum(x);
  return x;
}

export function accuracyChecks(input: ClientInput, result: NumerologyResult, narrative: Narrative | null, modules: ReportModule[]): Check[] {
  const out: Check[] = [];
  const d = result.results.dob;
  const { day, month, year } = d.dob;
  const all = modules.includes('complete');

  // ---- Date of birth ----
  const dt = new Date(Date.UTC(year, month - 1, day));
  out.push({ level: 'info', label: 'Date of birth read as', detail: `${day} ${MONTHS[month - 1]} ${year} (${WEEKDAYS[dt.getUTCDay()]}) – age ${d.age}. Confirm this with the client.` });
  if (day <= 12 && month <= 12 && day !== month) {
    out.push({ level: 'warn', label: 'Day/month could be swapped', detail: `Both ${day} and ${month} could be a month. If the client meant ${month} ${MONTHS[day - 1]}, every number in the report changes. Enter dates as DD-MM-YYYY.` });
  }
  if (d.age < 0 || year > Number(result.asOf.slice(0, 4))) out.push({ level: 'error', label: 'Birth date is in the future', detail: 'Check the year.' });
  else if (d.age > 110) out.push({ level: 'warn', label: 'Unusual age', detail: `Age ${d.age} – check the year.` });

  // ---- Independent cross-check of core numbers ----
  const moolank = reduceSingle(day);
  const bhagyank = reduceSingle(digitSum(`${day}${month}${year}`));
  out.push(moolank === d.moolank.value
    ? { level: 'ok', label: 'Moolank verified', detail: `${day} → ${moolank} (independent check matches the engine).` }
    : { level: 'error', label: 'Moolank mismatch', detail: `Independent check gives ${moolank}, engine gives ${d.moolank.value}. Do not send this report – contact support.` });
  out.push(bhagyank === d.bhagyank.value
    ? { level: 'ok', label: 'Bhagyank verified', detail: `${day}-${month}-${year} → ${digitSum(`${day}${month}${year}`)} → ${bhagyank} (matches the engine).` }
    : { level: 'error', label: 'Bhagyank mismatch', detail: `Independent check gives ${bhagyank}, engine gives ${d.bhagyank.value}. Do not send this report – contact support.` });
  const loShuDigits = String(day).padStart(2, '0') + String(month).padStart(2, '0') + String(year);
  out.push({ level: 'info', label: 'Lo Shu grid', detail: `Birth-date digits ${loShuDigits.replace(/0/g, '').split('').join(', ')} (zeros ignored). Missing numbers: ${d.loShu.missing.join(', ') || 'none'}; repeated: ${d.loShu.repeated.join(', ') || 'none'}.` });
  if (d.moolank.master || d.bhagyank.master) out.push({ level: 'info', label: 'Master number present', detail: `Compound ${d.moolank.master ?? ''} ${d.bhagyank.master ?? ''} – mention it in your consultation.`.trim() });

  // ---- Gender / Kua ----
  if (input.gender === 'other' && !input.kuaBasis) out.push({ level: 'warn', label: 'Kua basis not set', detail: 'Gender is "other" – choose the Kua formula (male/female) the client prefers, otherwise directions may not suit them.' });
  else out.push({ level: 'ok', label: 'Kua', detail: `Kua ${d.kua.value} (${d.kua.basis} formula, ${d.kua.group} group).` });

  // ---- Name ----
  const nm = result.results.name;
  if (all || modules.includes('name')) {
    if (!nm) out.push({ level: 'warn', label: 'Name analysis missing', detail: 'Add the full name.' });
    else {
      const raw = input.commonName || input.fullName;
      if (/[^A-Za-z\s.'-]/.test(raw)) out.push({ level: 'warn', label: 'Name has digits or symbols', detail: `"${raw}" – only letters A–Z count. Check the spelling the client actually uses.` });
      if (!input.commonName) out.push({ level: 'info', label: 'Using full name', detail: 'No "commonly used name" given – the name number is from the full name. If the client signs differently, add it.' });
      out.push({ level: 'info', label: 'Name numbers', detail: `Chaldean ${nm.chaldean.nameNumber.compound}/${nm.chaldean.nameNumber.single} · Pythagorean ${nm.pythagorean.nameNumber.compound}/${nm.pythagorean.nameNumber.single} · score ${nm.compatibilityScore}${nm.needsCorrection ? ' – correction suggested' : ''}.` });
    }
  }

  // ---- Mobile ----
  if (all || modules.includes('mobile')) {
    const mb = result.results.mobile;
    if (!input.mobile) out.push({ level: modules.includes('mobile') ? 'warn' : 'info', label: 'No mobile number', detail: 'The Mobile chapter will be skipped.' });
    else if (mb) out.push({ level: 'ok', label: 'Mobile', detail: `${mb.masked}: total ${mb.total.compound}/${mb.total.single}, score ${mb.score} (${mb.verdict}).` });
  }

  // ---- Couple ----
  if (all || modules.includes('couple')) {
    if (!input.partner) out.push({ level: modules.includes('couple') ? 'warn' : 'info', label: 'No partner details', detail: 'The Couple chapter will be skipped.' });
    else if (result.results.couple) out.push({ level: 'ok', label: 'Couple', detail: `Overall compatibility ${result.results.couple.overall}.` });
  }

  // ---- Timing ----
  const pc = d.personalCycles.current;
  out.push({ level: 'info', label: 'Forecast date', detail: `Personal Year ${pc.personalYear}, Month ${pc.personalMonth} as of ${result.asOf}. Change "Forecast as of" to date the forecast differently.` });
  if (input.timeOfBirth || input.placeOfBirth) out.push({ level: 'info', label: 'Time/place of birth', detail: 'Printed on the cover only – numerology calculations do not use them.' });

  // ---- Narrative ----
  if (narrative) {
    for (const s of narrative.sections) {
      if (s.warnings.length) out.push({ level: 'warn', label: `Text check: ${s.title}`, detail: s.warnings.join('; ') });
    }
    if (narrative.languageFallback) out.push({ level: 'warn', label: 'Language fallback', detail: 'Some knowledge-base entries are missing in this language, so English text was used. Add them in Admin → Knowledge base.' });
    const fallbacks = narrative.sections.filter((s) => s.source === 'template').length;
    if (narrative.writer !== 'template' && fallbacks) out.push({ level: 'info', label: 'AI writer fallback', detail: `${fallbacks} section(s) used the offline writer.` });
    if (!out.some((c) => c.label.startsWith('Text check'))) out.push({ level: 'ok', label: 'Text checks passed', detail: 'Every number in the text matches the calculations.' });
  }
  return out;
}
