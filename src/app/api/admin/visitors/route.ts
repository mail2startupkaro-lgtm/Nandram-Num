import { z } from 'zod';
import { purgeOlderThan, recentSessions, sessionJourney, visitorReport, visitsCsv, type VisitorFilter } from '@/lib/analytics/visits';
import { withAdmin } from '@/lib/server/admin';
import { json, readJson } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Filter = z.object({
  from: day, to: day,
  country: z.string().regex(/^([A-Z]{2}|\?\?)$/).optional().nullable(),
  channel: z.string().max(20).optional().nullable(),
  device: z.enum(['mobile', 'tablet', 'desktop']).optional().nullable(),
  path: z.string().max(300).optional().nullable(),
});

/**
 * Admin → Visitor analytics.
 *   ?view=report (default) | sessions | journey&session=… | csv   + from, to (IST dates), country, channel, device, path
 */
export const GET = withAdmin(async (req) => {
  const sp = new URL(req.url).searchParams;
  const view = sp.get('view') ?? 'report';
  if (view === 'journey') {
    const s = z.string().regex(/^[A-Za-z0-9_-]{8,40}$/).parse(sp.get('session'));
    return json(await sessionJourney(s));
  }
  const f = Filter.parse({ from: sp.get('from'), to: sp.get('to'), country: sp.get('country') || null, channel: sp.get('channel') || null, device: sp.get('device') || null, path: sp.get('path') || null }) as VisitorFilter;
  if (f.from > f.to) [f.from, f.to] = [f.to, f.from];
  if (view === 'sessions') return json({ sessions: await recentSessions({ ...f, limit: Number(sp.get('limit') ?? 100) }) });
  if (view === 'csv') {
    return new Response('﻿' + (await visitsCsv(f)), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="visitors-${f.from}-to-${f.to}.csv"`, 'cache-control': 'no-store' } });
  }
  return json(await visitorReport(f));
});

/** { purgeMonths: n } deletes visit data older than n months. */
export const POST = withAdmin(async (req) => {
  const { purgeMonths } = z.object({ purgeMonths: z.number().int().min(1).max(60) }).parse(await readJson(req, 1000));
  return json(await purgeOlderThan(purgeMonths));
});
