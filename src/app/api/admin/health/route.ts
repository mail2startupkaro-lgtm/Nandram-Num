import { z } from 'zod';
import { withAdmin } from '@/lib/server/admin';
import { json, readJson } from '@/lib/server/http';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';
import { deleteResolvedSiteErrors, ERROR_SOURCES, errorSummary, listSiteErrors, recordSiteError, resolveSiteErrors } from '@/lib/server/site-errors';
import { aiEngineStatus, configChecks, databaseChecks, overall, problemChecks, runtimeInfo, testAiEngine } from '@/lib/server/site-health';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const csvCell = (v: unknown) => { const s = v == null ? '' : v instanceof Date ? v.toISOString() : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

/**
 * GET /api/admin/health                → summary, problems, requirements, server info (Admin → Website Health)
 * GET /api/admin/health?view=errors&…  → error list (source, level, status=open|resolved|all, q, hours)
 * GET /api/admin/health?view=badge     → open error count only (admin menu badge)
 * GET /api/admin/health?view=csv       → error list as CSV
 */
export const GET = withAdmin(async (req) => {
  const q = new URL(req.url).searchParams;
  const view = q.get('view');
  if (view === 'badge') { const s = await errorSummary(); return json({ open: s.openErrors }); }
  if (view === 'errors' || view === 'csv') {
    const rows = await listSiteErrors({ source: q.get('source') ?? 'all', level: q.get('level') ?? 'all', status: (q.get('status') as 'open' | 'resolved' | 'all') ?? 'open', q: q.get('q')?.slice(0, 100) || undefined, sinceHours: Number(q.get('hours')) || undefined, limit: view === 'csv' ? 1000 : 300 });
    if (view === 'csv') {
      const head = ['last_seen', 'first_seen', 'level', 'source', 'count', 'status', 'route', 'method', 'message', 'resolved_at'];
      const body = rows.map((r) => [r.lastSeen, r.firstSeen, r.level, r.source, r.count, r.status, r.route, r.method, r.message, r.resolvedAt].map(csvCell).join(','));
      return new Response([head.join(','), ...body].join('\n'), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="website-errors-${new Date().toISOString().slice(0, 10)}.csv"`, 'cache-control': 'no-store' } });
    }
    return json({ errors: rows, sources: ERROR_SOURCES });
  }
  const [summary, problems, db, ai] = await Promise.all([
    errorSummary().catch(() => null),
    problemChecks().catch((e) => [{ id: 'problems', label: 'Problem checks', status: 'fail' as const, count: 0, detail: e instanceof Error ? e.message : 'failed' }]),
    databaseChecks(),
    aiEngineStatus().catch(() => null),
  ]);
  const requirements = [...db, ...configChecks()];
  return json({ summary, problems, requirements, ai, runtime: runtimeInfo(),
    status: { requirements: overall(requirements), problems: overall(problems), errors: (summary?.openErrors ?? 0) > 0 ? 'warn' : 'ok' } });
});

const Action = z.object({
  action: z.enum(['resolve', 'reopen', 'resolve-all', 'delete-resolved', 'test-ai', 'test-pdf', 'test-email', 'test-sms', 'run-delivery', 'test-error']),
  ids: z.array(z.string().max(64)).max(500).optional(),
});

/** Actions: resolve / reopen errors, clean up, and live tests of the PDF engine, email, SMS and the delivery automation. */
export const POST = withAdmin(async (req, user) => {
  const b = Action.parse(await readJson(req));
  if (b.action === 'resolve' || b.action === 'reopen') { await resolveSiteErrors(b.ids ?? [], b.action === 'resolve'); return json({ ok: true }); }
  if (b.action === 'resolve-all') { await resolveSiteErrors('all'); return json({ ok: true }); }
  if (b.action === 'delete-resolved') return json({ ok: true, deleted: await deleteResolvedSiteErrors() });

  const rl = rateLimit(`healthtest:${user.id}`, 10, 10 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const t0 = Date.now();
  try {
    if (b.action === 'test-ai') {
      const r = await testAiEngine();
      if (!r.ok) {
        await recordSiteError({ source: 'api', level: 'error', route: '/api/admin/health', method: 'POST', message: r.detail });
      }
      return json(r, r.ok ? 200 : 502);
    }
    if (b.action === 'test-pdf') {
      const { renderHtmlDocumentPdf } = await import('@/lib/pdf/render');
      const out = await renderHtmlDocumentPdf('<!doctype html><html lang="hi"><head><meta charset="utf-8"><style>@page{size:A4;margin:20mm}body{font-family:Georgia,"Noto Serif Devanagari",serif}</style></head><body><h1>PDF engine test</h1><p>अंक ज्योतिष रिपोर्ट – परीक्षण</p></body></html>', { title: 'PDF test', subject: 'Health check', language: 'hi' });
      return json({ ok: true, detail: `PDF created: ${out.pageCount} page, ${Math.round(out.pdf.length / 1024)} KB in ${Date.now() - t0} ms` });
    }
    if (b.action === 'test-email') {
      if (!user.email) return json({ ok: false, detail: 'Your admin account has no email address.' }, 400);
      const { sendEmailWithAttachments } = await import('@/lib/email/report-email');
      const r = await sendEmailWithAttachments({ to: user.email, subject: 'Test email – myNumerologist.com website health', html: '<p>This is a test email from Admin → Website Health. Email sending works.</p>', text: 'This is a test email from Admin → Website Health. Email sending works.' });
      return json({ ok: r.ok, detail: r.ok ? (r.dev ? `Simulated only (no email provider set) – would go to ${r.sentTo}` : `Sent to ${r.sentTo}`) : `Failed: ${r.error}` }, r.ok ? 200 : 502);
    }
    if (b.action === 'test-sms') {
      if (!user.phone) return json({ ok: false, detail: 'Your admin account has no mobile number.' }, 400);
      const { sendFast2Sms } = await import('@/lib/sms/fast2sms');
      const r = await sendFast2Sms({ numbers: user.phone, message: 'Test SMS from myNumerologist.com Website Health. SMS sending works.' });
      return json({ ok: r.ok, detail: r.ok ? (process.env.FAST2SMS_API_KEY ? 'SMS sent to your mobile' : 'Simulated only (no FAST2SMS_API_KEY)') : `Failed: ${r.message}` }, r.ok ? 200 : 502);
    }
    if (b.action === 'run-delivery') {
      const { runDueDeliveries } = await import('@/lib/server/service-delivery-run');
      const out = await runDueDeliveries({ budgetMs: 100_000 });
      return json({ ok: true, detail: `Checked ${out.length} order(s): ${out.filter((x) => x.result === 'delivered').length} delivered, ${out.filter((x) => x.result === 'failed').length} failed` });
    }
    // test-error: proves the error tracking itself works end to end
    await recordSiteError({ source: 'server', level: 'warning', route: '/api/admin/health', method: 'POST', message: 'Test error from Admin → Website Health (safe to resolve)' });
    return json({ ok: true, detail: 'A test warning was recorded – it appears in Live errors.' });
  } catch (e) {
    await recordSiteError({ source: b.action === 'test-pdf' ? 'pdf' : b.action === 'run-delivery' ? 'delivery' : 'notify', route: '/api/admin/health', method: 'POST', message: `${b.action} failed: ${e instanceof Error ? e.message : String(e)}`, stack: e instanceof Error ? e.stack : null });
    return json({ ok: false, detail: `${b.action} failed: ${e instanceof Error ? e.message.slice(0, 300) : 'error'}` }, 500);
  }
});
