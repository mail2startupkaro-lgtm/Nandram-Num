/**
 * Report delivery queue for general clients (single-report and credit-pack buyers).
 *
 * After the client submits a paid report, it becomes available after REPORT_TURNAROUND_MIN working minutes.
 * Working hours are 08:00–22:00 IST; the clock pauses overnight and resumes at 08:00.
 * Status wording is neutral ("received", "being prepared", "ready") – it never claims that a named person
 * reviewed or wrote the report. Admin can release a report early or put it on hold.
 * Pro consultants and admins are not queued (they get their PDFs immediately).
 */
import { and, desc, eq, isNotNull } from 'drizzle-orm';
import { getDb, type Db } from '@/lib/db/client';
import { clientProfiles, reports, users } from '@/lib/db/schema';
import type { Account } from '@/lib/billing/entitlements';

export const WORK_START_H = 8;   // 08:00 IST
export const WORK_END_H = 22;    // 22:00 IST
export const REPORT_TURNAROUND_MIN = 115;
/** Minutes of working time at which each stage starts. */
export const STAGE_STARTS = [0, 25, 55, REPORT_TURNAROUND_MIN] as const;

const IST_MS = 330 * 60_000;
const DAY = 86_400_000;
/** Minutes since IST midnight, and the UTC instant of that IST midnight. */
const istParts = (t: number) => { const local = t + IST_MS; const midnightLocal = Math.floor(local / DAY) * DAY; return { min: (local - midnightLocal) / 60_000, midnightUtc: midnightLocal - IST_MS }; };
const startMin = WORK_START_H * 60, endMin = WORK_END_H * 60;

/** Next moment (≥ t) that is inside working hours. */
export function nextWorkingMoment(t: Date): Date {
  const { min, midnightUtc } = istParts(t.getTime());
  if (min < startMin) return new Date(midnightUtc + startMin * 60_000);
  if (min >= endMin) return new Date(midnightUtc + DAY + startMin * 60_000);
  return t;
}

/** t + `minutes` of working time. */
export function addWorkingMinutes(t: Date, minutes: number): Date {
  let cur = nextWorkingMoment(t).getTime(); let left = minutes * 60_000;
  for (let guard = 0; guard < 400 && left > 0; guard++) {
    const { min, midnightUtc } = istParts(cur);
    const endOfDay = midnightUtc + endMin * 60_000;
    const room = endOfDay - cur;
    if (left <= room) return new Date(cur + left);
    left -= room; cur = midnightUtc + DAY + startMin * 60_000; void min;
  }
  return new Date(cur);
}

/** Working minutes elapsed between a and b (0 if b ≤ a). */
export function workingMinutesBetween(a: Date, b: Date): number {
  let cur = nextWorkingMoment(a).getTime(); const end = b.getTime(); let total = 0;
  for (let guard = 0; guard < 400 && cur < end; guard++) {
    const { midnightUtc } = istParts(cur);
    const endOfDay = midnightUtc + endMin * 60_000;
    total += Math.min(end, endOfDay) - cur;
    cur = midnightUtc + DAY + startMin * 60_000;
  }
  return total / 60_000;
}

export const isWorkingTime = (t: Date) => nextWorkingMoment(t).getTime() === t.getTime();

export interface QueueFields { requestedAt: Date | null; deliverAt: Date | null; releasedAt: Date | null; onHold: boolean; unlockedAt?: Date | null }
export type QueueState =
  | { state: 'not_requested' }
  | { state: 'queued'; stage: 1 | 2 | 3; requestedAt: string; deliverAt: string; paused: boolean; resumesAt: string | null; onHold: boolean }
  | { state: 'ready'; stage: 4; requestedAt: string; readyAt: string };

export function queueState(r: QueueFields, now = new Date()): QueueState {
  if (!r.requestedAt || !r.deliverAt) return { state: 'not_requested' };
  if (r.releasedAt || (!r.onHold && now.getTime() >= r.deliverAt.getTime())) {
    const readyAt = r.releasedAt && r.releasedAt < r.deliverAt ? r.releasedAt : r.deliverAt;
    return { state: 'ready', stage: 4, requestedAt: r.requestedAt.toISOString(), readyAt: readyAt.toISOString() };
  }
  const done = workingMinutesBetween(r.requestedAt, now);
  const stage = (done >= STAGE_STARTS[2] ? 3 : done >= STAGE_STARTS[1] ? 2 : 1) as 1 | 2 | 3;
  const paused = !isWorkingTime(now);
  return { state: 'queued', stage, requestedAt: r.requestedAt.toISOString(), deliverAt: r.deliverAt.toISOString(), paused, resumesAt: paused ? nextWorkingMoment(now).toISOString() : null, onHold: r.onHold };
}

/** General clients go through the queue; Pro consultants and admins do not. */
export const usesQueue = (a: Pick<Account, 'features' | 'isAdmin'>) => !a.isAdmin && !a.features.fullReports;

/** Marks a report as submitted. Idempotent: a second call keeps the first times. */
export async function markRequested(reportId: string, now = new Date(), db: Db = getDb()) {
  const [r] = await db.select({ requestedAt: reports.requestedAt }).from(reports).where(eq(reports.id, reportId)).limit(1);
  if (r?.requestedAt) return;
  await db.update(reports).set({ requestedAt: now, deliverAt: addWorkingMinutes(now, REPORT_TURNAROUND_MIN) }).where(eq(reports.id, reportId));
}

/* ---------- admin ---------- */
export async function listQueue(db: Db = getDb()) {
  const rows = await db.select({ id: reports.id, version: reports.version, module: reports.module, language: reports.language, requestedAt: reports.requestedAt, deliverAt: reports.deliverAt, releasedAt: reports.releasedAt, onHold: reports.onHold,
    profile: clientProfiles.displayName, profileId: clientProfiles.id, owner: users.name, email: users.email, phone: users.phone })
    .from(reports).innerJoin(clientProfiles, eq(clientProfiles.id, reports.profileId)).innerJoin(users, eq(users.id, clientProfiles.ownerId))
    .where(isNotNull(reports.requestedAt)).orderBy(desc(reports.requestedAt)).limit(300);
  const now = new Date();
  return rows.map((r) => ({ ...r, queue: queueState(r, now) }));
}

export async function adminQueueAction(reportId: string, action: 'release' | 'hold' | 'resume', db: Db = getDb()) {
  const set = action === 'release' ? { releasedAt: new Date(), onHold: false } : action === 'hold' ? { onHold: true } : { onHold: false };
  const [r] = await db.update(reports).set(set).where(and(eq(reports.id, reportId), isNotNull(reports.requestedAt))).returning({ id: reports.id });
  return !!r;
}
