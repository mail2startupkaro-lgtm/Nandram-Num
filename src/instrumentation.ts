/**
 * Runs once when the Next.js server starts. On a server that stays running (your own computer – START-NUMEROLOGY.bat,
 * `npm start` – or any non-serverless host) a timer delivers due purchased-service reports automatically
 * (see src/instrumentation-node.ts). On Vercel the cron endpoint /api/cron/deliver-reports does the same job.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation-node');
  }
}

/** Every uncaught server error (pages, API routes, server actions) → Admin → Website Health. */
export async function onRequestError(
  err: unknown,
  request: { path: string; method: string; headers: Record<string, string | string[] | undefined> },
  context: { routerKind: string; routePath: string; routeType: string; renderSource?: string },
) {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { recordSiteError } = await import('@/lib/server/site-errors');
    const e = err as Error & { digest?: string };
    await recordSiteError({
      source: 'server', level: 'error', route: request.path, method: request.method,
      message: `${e?.name ?? 'Error'}: ${e?.message ?? String(err)}`, stack: e?.stack ?? null,
      meta: { routeType: context.routeType, routePath: context.routePath, renderSource: context.renderSource ?? null, digest: e?.digest ?? null },
    });
  }
}
