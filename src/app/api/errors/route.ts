import { z } from 'zod';
import { clientIp, json, readJson } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rate-limit';
import { recordSiteError } from '@/lib/server/site-errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  message: z.string().max(1000), stack: z.string().max(4000).optional(), url: z.string().max(500).optional(),
  kind: z.enum(['error', 'rejection', 'react', 'chunk']).default('error'), digest: z.string().max(100).optional(),
});
/** Browser noise that says nothing about our website. */
const NOISE = /ResizeObserver loop|^Script error\.?$|chrome-extension:|moz-extension:|safari-extension:|Non-Error promise rejection captured|AbortError|The user aborted|cancelled|NotAllowedError: play\(\)/i;

/** POST /api/errors – an error in a visitor's browser (sent by the site itself). Public, small and rate-limited. */
export async function POST(req: Request) {
  const rl = rateLimit(`clienterr:${clientIp(req)}`, 20, 10 * 60_000);
  if (!rl.ok) return json({ ok: true }); // silently drop – never make the visitor's page retry
  let b: z.infer<typeof Body>;
  try { b = Body.parse(await readJson(req, 12_000)); } catch { return json({ ok: false }, 400); }
  if (NOISE.test(b.message) || NOISE.test(b.stack ?? '')) return json({ ok: true });
  let route: string | null = null;
  try { route = b.url ? new URL(b.url).pathname : null; } catch { route = null; }
  const chunk = b.kind === 'chunk' || /ChunkLoadError|Loading chunk|dynamically imported module/i.test(b.message);
  await recordSiteError({
    source: 'client', level: chunk ? 'warning' : 'error', route, method: null,
    message: chunk ? `Page code failed to load (usually an old tab after a new deployment): ${b.message}` : b.message,
    stack: b.stack ?? null, meta: { kind: b.kind, digest: b.digest ?? null, userAgent: (req.headers.get('user-agent') ?? '').slice(0, 200) },
  });
  return json({ ok: true });
}
