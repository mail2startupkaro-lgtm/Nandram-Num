import { WORK_END_H, WORK_START_H } from '@/lib/report-queue-hours';

export const isIST = (tz: string) => tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta';

/** 08:00 / 22:00 IST today, formatted in the visitor's time zone (e.g. "9:30 pm"). */
export function istHourIn(tz: string, hourIST: number, lang: 'en' | 'hi' = 'en'): string {
  const now = new Date();
  const istMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - 330 * 60_000;
  const t = new Date(istMidnight + hourIST * 3_600_000);
  return t.toLocaleTimeString(lang === 'hi' ? 'hi-IN' : 'en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).toLowerCase();
}

/** "8 am and 10 pm IST" – with the visitor's local equivalent when they are outside India. */
export function workingHoursLabel(tz: string, hi: boolean): string {
  if (isIST(tz)) return hi ? `सुबह ${WORK_START_H} से रात ${WORK_END_H - 12} बजे (IST)` : `${WORK_START_H} am and ${WORK_END_H - 12} pm IST`;
  const a = istHourIn(tz, WORK_START_H, hi ? 'hi' : 'en'), b = istHourIn(tz, WORK_END_H, hi ? 'hi' : 'en');
  return hi ? `सुबह ${WORK_START_H} से रात ${WORK_END_H - 12} बजे IST (आपके समय में ${a} – ${b})` : `${WORK_START_H} am and ${WORK_END_H - 12} pm IST (${a} – ${b} your time)`;
}
