import { describe, expect, it } from 'vitest';
import { addWorkingMinutes, nextWorkingMoment, queueState, REPORT_TURNAROUND_MIN, workingMinutesBetween } from '@/lib/report-queue';

const ist = (s: string) => new Date(`${s}+05:30`);
const fmt = (d: Date) => new Date(d.getTime() + 330 * 60_000).toISOString().slice(0, 16).replace('T', ' ');

describe('report queue working-hours clock (08:00–22:00 IST)', () => {
  it('day-time order is ready 1 h 55 min later', () => {
    expect(fmt(addWorkingMinutes(ist('2026-11-12T10:00:00'), REPORT_TURNAROUND_MIN))).toBe('2026-11-12 11:55');
  });
  it('late-evening order pauses overnight and continues at 08:00', () => {
    expect(fmt(addWorkingMinutes(ist('2026-11-12T21:30:00'), 115))).toBe('2026-11-13 09:25'); // 30 min tonight + 85 min tomorrow
    expect(fmt(addWorkingMinutes(ist('2026-11-12T23:10:00'), 115))).toBe('2026-11-13 09:55');
    expect(fmt(addWorkingMinutes(ist('2026-11-13T02:00:00'), 115))).toBe('2026-11-13 09:55');
    expect(fmt(nextWorkingMoment(ist('2026-11-12T22:00:00')))).toBe('2026-11-13 08:00');
  });
  it('counts only working minutes', () => {
    expect(workingMinutesBetween(ist('2026-11-12T21:30:00'), ist('2026-11-13T08:30:00'))).toBe(60);
    expect(workingMinutesBetween(ist('2026-11-12T10:00:00'), ist('2026-11-12T09:00:00'))).toBe(0);
    for (let i = 0; i < 2000; i++) { // random round-trips
      const start = new Date(Date.UTC(2026, 0, 1) + Math.floor(((i * 7919) % 100000) * 6_000));
      const m = (i * 37) % 900;
      expect(Math.round(workingMinutesBetween(start, addWorkingMinutes(start, m)))).toBe(m);
    }
  });
  it('stages move at 25 and 55 working minutes and the report is ready at the deliver time', () => {
    const requestedAt = ist('2026-11-12T10:00:00'); const deliverAt = addWorkingMinutes(requestedAt, 115);
    const s = (t: string) => queueState({ requestedAt, deliverAt, releasedAt: null, onHold: false }, ist(t));
    expect(s('2026-11-12T10:10:00')).toMatchObject({ state: 'queued', stage: 1, paused: false });
    expect(s('2026-11-12T10:30:00')).toMatchObject({ stage: 2 });
    expect(s('2026-11-12T11:00:00')).toMatchObject({ stage: 3 });
    expect(s('2026-11-12T11:55:00')).toMatchObject({ state: 'ready', stage: 4 });
    expect(queueState({ requestedAt, deliverAt, releasedAt: null, onHold: true }, ist('2026-11-12T13:00:00'))).toMatchObject({ state: 'queued', stage: 3, onHold: true });
    expect(queueState({ requestedAt, deliverAt, releasedAt: ist('2026-11-12T10:05:00'), onHold: false }, ist('2026-11-12T10:06:00'))).toMatchObject({ state: 'ready' });
    expect(queueState({ requestedAt: null, deliverAt: null, releasedAt: null, onHold: false })).toEqual({ state: 'not_requested' });
  });
  it('shows "paused" at night', () => {
    const requestedAt = ist('2026-11-12T21:30:00'); const deliverAt = addWorkingMinutes(requestedAt, 115);
    expect(queueState({ requestedAt, deliverAt, releasedAt: null, onHold: false }, ist('2026-11-12T23:00:00'))).toMatchObject({ state: 'queued', stage: 2, paused: true });
  });
});
