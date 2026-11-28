/**
 * Sends errors that happen in visitors' browsers to Admin → Website Health (/api/errors).
 * At most 8 reports per page view, each different error once; never throws and never slows the page.
 */
const sent = new Set<string>();
let count = 0;

export function reportClientError(e: { message: string; stack?: string; kind?: 'error' | 'rejection' | 'react' | 'chunk'; digest?: string }) {
  try {
    if (typeof window === 'undefined' || count >= 8) return;
    const key = `${e.kind}|${e.message}`.slice(0, 300);
    if (sent.has(key)) return;
    sent.add(key); count++;
    const body = JSON.stringify({ message: String(e.message || 'Unknown error').slice(0, 1000), stack: e.stack?.slice(0, 4000), url: window.location.href.slice(0, 500), kind: e.kind ?? 'error', digest: e.digest });
    if (navigator.sendBeacon) navigator.sendBeacon('/api/errors', new Blob([body], { type: 'application/json' }));
    else void fetch('/api/errors', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true }).catch(() => undefined);
  } catch { /* never break the page */ }
}

/** Listens for uncaught errors and unhandled promise rejections. Returns the clean-up function. */
export function installErrorReporter(): () => void {
  const onError = (ev: ErrorEvent) => {
    const err = ev.error as Error | undefined;
    const msg = err?.message || ev.message || 'Unknown error';
    reportClientError({ message: msg, stack: err?.stack ?? (ev.filename ? `at ${ev.filename}:${ev.lineno}:${ev.colno}` : undefined), kind: /ChunkLoadError|Loading chunk/i.test(msg) ? 'chunk' : 'error' });
  };
  const onRejection = (ev: PromiseRejectionEvent) => {
    const r = ev.reason as Error | string | undefined;
    const msg = typeof r === 'string' ? r : r?.message || 'Unhandled promise rejection';
    reportClientError({ message: msg, stack: typeof r === 'object' ? r?.stack : undefined, kind: /ChunkLoadError|dynamically imported module/i.test(msg) ? 'chunk' : 'rejection' });
  };
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);
  return () => { window.removeEventListener('error', onError); window.removeEventListener('unhandledrejection', onRejection); };
}
