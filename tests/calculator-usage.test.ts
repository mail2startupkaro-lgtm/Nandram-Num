/**
 * Free calculator users, day wise (Admin → Visitor analytics → Free calculators).
 * Needs a Postgres: TEST_DATABASE_URL=postgres://user@localhost:5433/numerology_test
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';
import type { Db } from '@/lib/db/client';
import { ensureAnalyticsTables, visitorReport } from '@/lib/analytics/visits';

const URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!URL)('free calculator users per day', () => {
  let pool: Pool; let db: Db;
  beforeAll(async () => {
    pool = new Pool({ connectionString: URL });
    db = drizzle(pool, { schema }) as unknown as Db;
    await ensureAnalyticsTables(db);
    await db.execute(sql`truncate site_events, site_visits`);
    const ev = (v: string, tool: string, at: string) => db.execute(sql`insert into site_events (visitor_id, session_id, name, label, created_at) values (${v}, ${v + 's'}, 'calculator_use', ${tool}, ${at}::timestamptz)`);
    const pv = (v: string, path: string, at: string) => db.execute(sql`insert into site_visits (visitor_id, session_id, path, created_at) values (${v}, ${v + 's'}, ${path}, ${at}::timestamptz)`);
    // 1 Nov (IST): A uses two calculators, B uses one → 2 users, 3 calculations
    await ev('A', 'moolank', '2026-11-01T10:00:00+05:30'); await ev('A', 'loshu', '2026-11-01T10:05:00+05:30'); await ev('B', 'moolank', '2026-11-01T23:50:00+05:30');
    // 23:50 IST on 1 Nov is 18:20 UTC – must stay on 1 Nov; 00:10 IST on 3 Nov is 2 Nov in UTC – must land on 3 Nov
    await ev('C', 'angel', '2026-11-03T00:10:00+05:30');
    await db.execute(sql`insert into site_events (visitor_id, session_id, name, created_at) values ('D', 'Ds', 'whatsapp_click', '2026-11-01T12:00:00+05:30')`); // not a calculator
    await pv('A', '/calculators/moolank-calculator', '2026-11-01T09:59:00+05:30'); await pv('E', '/calculators/kua-number-calculator', '2026-11-01T11:00:00+05:30');
    await pv('F', '/angel-numbers/calculator', '2026-11-02T11:00:00+05:30'); await pv('G', '/blog/x', '2026-11-02T11:00:00+05:30');
  });
  afterAll(async () => { await pool?.end(); });

  it('lists every day with users, calculations and calculator-page visitors, using IST days', async () => {
    const r = await visitorReport({ from: '2026-11-01', to: '2026-11-03' }, db);
    expect(r.calculators.daily).toEqual([
      { day: '2026-11-01', users: 2, uses: 3, pageVisitors: 2 },
      { day: '2026-11-02', users: 0, uses: 0, pageVisitors: 1 },
      { day: '2026-11-03', users: 1, uses: 1, pageVisitors: 0 },
    ]);
    expect(r.calculators.totals).toEqual({ users: 3, uses: 4, pageVisitors: 3 });
    expect(r.calculators.byTool[0]).toEqual({ tool: 'moolank', users: 2, uses: 2 });
  });

  it('works for a single day and for long ranges (one row per day)', async () => {
    expect((await visitorReport({ from: '2026-11-02', to: '2026-11-02' }, db)).calculators.daily).toEqual([{ day: '2026-11-02', users: 0, uses: 0, pageVisitors: 1 }]);
    const long = await visitorReport({ from: '2026-01-01', to: '2026-12-31' }, db);
    expect(long.calculators.daily).toHaveLength(365);
    expect(long.calculators.totals.users).toBe(3);
  });
});
