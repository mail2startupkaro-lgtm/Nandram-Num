import { NumerologyInputError } from './reduce';

export interface DateParts {
  day: number;
  month: number;
  year: number;
}

export function isValidDate({ day, month, year }: DateParts): boolean {
  if (![day, month, year].every(Number.isInteger)) return false;
  if (year < 1800 || year > 2200) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

/**
 * Accepts ISO "YYYY-MM-DD" (also YYYY/MM/DD, YYYY.MM.DD), Indian "DD-MM-YYYY" / "DD/MM/YYYY" / "DD.MM.YYYY", or parts.
 * Never uses local time zones, so results are identical on every server.
 */
export function parseDate(input: string | DateParts): DateParts {
  let p: DateParts;
  if (typeof input === 'string') {
    const s = input.trim();
    const iso = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(s);
    const ind = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/.exec(s);
    if (iso) p = { year: +iso[1], month: +iso[2], day: +iso[3] };
    else if (ind) p = { day: +ind[1], month: +ind[2], year: +ind[3] };
    else throw new NumerologyInputError('DATE_FORMAT', `Unrecognised date format: "${input}"`);
  } else {
    p = { day: input.day, month: input.month, year: input.year };
  }
  if (!isValidDate(p)) throw new NumerologyInputError('DATE_INVALID', `Invalid calendar date: ${JSON.stringify(p)}`);
  return p;
}

export const pad2 = (n: number) => String(n).padStart(2, '0');

export const toIso = (p: DateParts) => `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;

/** "DDMMYYYY" – the digit string used by Indian numerology. */
export const toDigitString = (p: DateParts) => `${pad2(p.day)}${pad2(p.month)}${p.year}`;

export function ageOn(dob: DateParts, asOf: DateParts): number {
  let age = asOf.year - dob.year;
  if (asOf.month < dob.month || (asOf.month === dob.month && asOf.day < dob.day)) age--;
  return age;
}

export function compareDates(a: DateParts, b: DateParts): number {
  return toIso(a).localeCompare(toIso(b));
}

/** Today's date in India (IST), used only as a default at the edge of the engine. */
export function todayIST(now: Date = new Date()): DateParts {
  const ist = new Date(now.getTime() + 330 * 60_000);
  return { year: ist.getUTCFullYear(), month: ist.getUTCMonth() + 1, day: ist.getUTCDate() };
}
