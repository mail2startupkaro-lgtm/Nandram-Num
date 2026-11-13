import { leadsCsv, listLeads } from '@/lib/funnel/leads';
import { withAdmin } from '@/lib/server/admin';
import { json } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Funnel leads for Admin → Offer & leads. ?format=csv downloads all (up to 5,000). */
export const GET = withAdmin(async (req) => {
  const csv = new URL(req.url).searchParams.get('format') === 'csv';
  const rows = await listLeads({ limit: csv ? 5000 : 300 });
  if (!csv) return json({ leads: rows });
  return new Response('﻿' + leadsCsv(rows), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`, 'cache-control': 'no-store' } });
});
