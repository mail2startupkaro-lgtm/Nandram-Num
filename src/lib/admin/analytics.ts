/** Admin dashboard numbers. All aggregate – no personal data. */
import { sql } from 'drizzle-orm';
import { getDb, type Db } from '@/lib/db/client';

export async function overview(db: Db = getDb()) {
  const one = async <T,>(q: ReturnType<typeof sql>) => (await db.execute(q)).rows as T[];
  const [totals] = await one<{ users: number; experts: number; profiles: number; reports: number; reports30: number; revenue: number; paid: number; activePro: number }>(sql`
    select (select count(*)::int from users) users,
           (select count(*)::int from users where role = 'expert') experts,
           (select count(*)::int from client_profiles) profiles,
           (select count(*)::int from reports) reports,
           (select count(*)::int from reports where created_at > now() - interval '30 days') reports30,
           (select coalesce(sum(amount_paise),0)::bigint from payments where status = 'paid') revenue,
           (select count(*)::int from payments where status = 'paid') paid,
           (select count(*)::int from subscriptions where current_period_end > now()) "activePro"`);
  const byModule = await one<{ module: string; n: number }>(sql`select module::text, count(*)::int n from reports group by 1 order by 2 desc`);
  const revenueByMonth = await one<{ month: string; paise: number; n: number }>(sql`
    select to_char(date_trunc('month', paid_at at time zone 'Asia/Kolkata'), 'YYYY-MM') as month, sum(amount_paise)::bigint paise, count(*)::int n
    from payments where status = 'paid' and paid_at > now() - interval '12 months' group by 1 order by 1`);
  const reportsByDay = await one<{ day: string; n: number }>(sql`
    select to_char(date_trunc('day', created_at at time zone 'Asia/Kolkata'), 'YYYY-MM-DD') as day, count(*)::int n
    from reports where created_at > now() - interval '30 days' group by 1 order by 1`);
  const byPlan = await one<{ plan: string; n: number; paise: number }>(sql`select plan_code plan, count(*)::int n, sum(amount_paise)::bigint paise from payments where status = 'paid' group by 1 order by 3 desc`);
  return {
    totals: { ...totals, revenue: Number(totals.revenue) },
    byModule, byPlan: byPlan.map((x) => ({ ...x, paise: Number(x.paise) })),
    revenueByMonth: revenueByMonth.map((x) => ({ ...x, paise: Number(x.paise) })), reportsByDay,
  };
}
