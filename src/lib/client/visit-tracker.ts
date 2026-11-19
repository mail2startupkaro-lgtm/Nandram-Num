'use client';
/**
 * First-party visitor tracking for Admin → Visitor analytics.
 * Counts page views, active time on each page (only while the tab is visible), scroll depth, source and conversion events.
 * Stores two random ids in localStorage (visitor + 30-minute session); nothing personal is sent.
 */

const ENDPOINT = '/api/analytics/collect';
const SESSION_IDLE_MS = 30 * 60_000;
const HEARTBEAT_MS = 15_000;
const SKIP = /^\/(admin|888)(\/|$)/;

type State = { vid: string; sid: string; newVisitor: boolean; entry: boolean };
let current: { id: number | null; path: string; activeMs: number; visibleSince: number | null; maxScroll: number } | null = null;
let heartbeat: ReturnType<typeof setInterval> | null = null;
let listening = false;
let disabled = false;

const rid = () => {
  try { return crypto.randomUUID().replace(/-/g, '').slice(0, 24); } catch { return (Date.now().toString(36) + Math.random().toString(36).slice(2, 14)).slice(0, 24); }
};
function store(k: string, v?: string) {
  try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch { /* private mode */ }
  return null;
}

/** Visitor id (permanent) + session id (renewed after 30 minutes of inactivity). */
function ids(): State {
  let vid = store('mn_vid');
  let firstSession = store('mn_vfs');
  if (!vid) { vid = rid(); store('mn_vid', vid); firstSession = null; }
  const now = Date.now();
  const last = Number(store('mn_sts') ?? 0);
  let sid = store('mn_sid');
  let entry = false;
  if (!sid || now - last > SESSION_IDLE_MS) { sid = rid(); store('mn_sid', sid); entry = true; }
  if (!firstSession) { firstSession = sid; store('mn_vfs', sid); }
  store('mn_sts', String(now));
  return { vid, sid, newVisitor: firstSession === sid, entry };
}
const touch = () => store('mn_sts', String(Date.now()));

function send(body: object, beacon = false) {
  const data = JSON.stringify(body);
  try {
    if (beacon && navigator.sendBeacon) { navigator.sendBeacon(ENDPOINT, new Blob([data], { type: 'text/plain' })); return; }
    void fetch(ENDPOINT, { method: 'POST', body: data, keepalive: true, headers: { 'content-type': 'text/plain' } }).catch(() => {});
  } catch { /* ignore */ }
}

function activeMs() {
  if (!current) return 0;
  return current.activeMs + (current.visibleSince ? Date.now() - current.visibleSince : 0);
}
function readScroll() {
  if (!current) return;
  const h = document.documentElement.scrollHeight - window.innerHeight;
  const p = h <= 0 ? 100 : Math.round(((window.scrollY || 0) / h) * 100);
  current.maxScroll = Math.max(current.maxScroll, Math.min(100, Math.max(0, p)));
}
function flush(beacon: boolean) {
  if (!current?.id) return;
  readScroll();
  const sid = store('mn_sid');
  if (sid) send({ t: 'end', s: sid, id: current.id, ms: Math.round(activeMs()), sc: current.maxScroll }, beacon);
}

function listen() {
  if (listening) return;
  listening = true;
  document.addEventListener('visibilitychange', () => {
    if (!current) return;
    if (document.visibilityState === 'hidden') {
      if (current.visibleSince) { current.activeMs += Date.now() - current.visibleSince; current.visibleSince = null; }
      flush(true);
    } else { current.visibleSince = Date.now(); touch(); }
  });
  window.addEventListener('pagehide', () => flush(true));
  window.addEventListener('scroll', () => readScroll(), { passive: true });
  // Contact clicks are the main conversions for a consultancy: count them automatically.
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement | null)?.closest?.('a');
    const href = a?.getAttribute('href') ?? '';
    if (!href) return;
    if (href.startsWith('tel:')) visitEvent('call_click', { label: 'phone' });
    else if (/wa\.me|api\.whatsapp\.com|whatsapp:/i.test(href)) visitEvent('whatsapp_click', { label: a?.textContent?.trim().slice(0, 60) || 'whatsapp' });
    else if (/(^|\/\/)(t\.me|telegram\.me)\//i.test(href)) visitEvent('telegram_click', { label: 'telegram' });
    else if (href.startsWith('mailto:')) visitEvent('email_click', { label: 'email' });
    else if (/^https?:\/\//i.test(href)) { try { const h = new URL(href).hostname; if (h !== location.hostname) visitEvent('outbound_click', { label: h }); } catch { /* ignore */ } }
  }, { capture: true });
}

/** Call on every route change (App Router). */
export async function trackVisit(pathWithQuery: string) {
  if (typeof window === 'undefined' || disabled) return;
  const pathOnly = pathWithQuery.split('?')[0];
  if (current && current.path === pathWithQuery) return;
  flush(false);
  if (heartbeat) clearInterval(heartbeat);
  current = null;
  if (SKIP.test(pathOnly) || /^(1|yes)$/.test(navigator.doNotTrack ?? '')) return;
  listen();
  const st = ids();
  const sp = new URLSearchParams(location.search);
  current = { id: null, path: pathWithQuery, activeMs: 0, visibleSince: document.visibilityState === 'visible' ? Date.now() : null, maxScroll: 0 };
  const mine = current;
  let tz: string | undefined;
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* ignore */ }
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST', keepalive: true, headers: { 'content-type': 'text/plain' },
      body: JSON.stringify({
        t: 'pv', v: st.vid, s: st.sid, nv: st.newVisitor, en: st.entry, p: location.pathname + location.search, ti: document.title.slice(0, 200),
        r: st.entry ? document.referrer : undefined,
        us: st.entry ? sp.get('utm_source') ?? sp.get('ref') ?? undefined : undefined, um: st.entry ? sp.get('utm_medium') ?? undefined : undefined, uc: st.entry ? sp.get('utm_campaign') ?? undefined : undefined,
        l: navigator.language, tz, w: window.screen?.width,
      }),
    });
    const data = res.ok && res.headers.get('content-type')?.includes('json') ? await res.json() : null;
    if (data?.skip) { disabled = true; current = null; return; } // site owner signed in – not counted
    if (current === mine && data?.id) mine.id = Number(data.id);
  } catch { return; }
  heartbeat = setInterval(() => { if (document.visibilityState === 'visible' && current === mine) { touch(); flush(false); } }, HEARTBEAT_MS);
}

/** Records a conversion / interaction event against the current visit. */
export function visitEvent(name: string, opts: { label?: string; value?: number } = {}) {
  if (typeof window === 'undefined' || disabled) return;
  const vid = store('mn_vid'), sid = store('mn_sid');
  if (!vid || !sid || SKIP.test(location.pathname)) return;
  touch();
  send({ t: 'ev', v: vid, s: sid, id: current?.id ?? undefined, n: name.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 40), p: location.pathname,
    lb: opts.label?.slice(0, 120), val: typeof opts.value === 'number' && Number.isFinite(opts.value) ? opts.value : undefined }, true);
}
