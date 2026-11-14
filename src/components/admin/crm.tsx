'use client';
/**
 * Admin → CRM: dashboard, pipeline board, contacts with filters + bulk actions, follow-ups, birthdays, tags, import/export
 * and a contact drawer with the full timeline, tasks, purchases, WhatsApp templates (EN/HI) and consent.
 */
import * as React from 'react';
import {
  AlarmClock, ArrowRight, Cake, CalendarClock, Check, CheckCircle2, ChevronLeft, ChevronRight, Copy, Download, Flame, Inbox, KanbanSquare, LayoutDashboard,
  ListChecks, Mail, MessageCircle, NotebookPen, Phone, Plus, RefreshCw, Search, ShieldCheck, ShieldOff, Tag, Trash2, Upload, Users, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { Badge } from '@/components/ui/misc';
import { api, ApiError, download } from '@/lib/client/api';
import { cn } from '@/lib/utils';

// ------------------------------------------------------------------ types & constants
type Stage = 'new' | 'contacted' | 'interested' | 'consultation' | 'proposal' | 'won' | 'lost';
interface TagRef { id: string; name: string }
interface Contact {
  id: string; name: string; email: string | null; phone: string | null; dob: string | null; gender: string | null; city: string | null; state: string | null; country: string | null; language: string | null;
  moolank: number | null; bhagyank: number | null; service: string | null; source: string; magnet: string | null; stage: Stage; ownerId: string | null; ownerName: string | null;
  dealValuePaise: number | null; priority: 'low' | 'normal' | 'high'; nextFollowUpAt: string | null; lastContactedAt: string | null; stageChangedAt: string; lostReason: string | null; notes: string | null;
  userId: string | null; utmSource: string | null; utmMedium: string | null; utmCampaign: string | null; createdAt: string; updatedAt: string; waConsent: boolean; tags: TagRef[];
  openTasks: number; touches: number; paidPaise: number; paidOrders: number; score: number;
}
interface Task { id: string; leadId: string; name: string; phone: string | null; stage: Stage; title: string; dueAt: string; priority: string; doneAt: string | null }
interface Owner { id: string; name: string | null; email: string | null; role: string }
interface Birthday { id: string; name: string; phone: string | null; dob: string; language: string | null; stage: Stage; inDays: number; waConsent: boolean; age: number; newPersonalYear: number }

export const STAGES: { id: Stage; label: string; short: string; tone: string; dot: string }[] = [
  { id: 'new', label: 'New lead', short: 'New', tone: 'border-sky-400/60', dot: 'bg-sky-400' },
  { id: 'contacted', label: 'Contacted', short: 'Contacted', tone: 'border-indigo-400/60', dot: 'bg-indigo-400' },
  { id: 'interested', label: 'Interested', short: 'Interested', tone: 'border-amber-400/60', dot: 'bg-amber-400' },
  { id: 'consultation', label: 'Consultation booked', short: 'Consultation', tone: 'border-violet-400/60', dot: 'bg-violet-400' },
  { id: 'proposal', label: 'Payment link sent', short: 'Payment link', tone: 'border-orange-400/60', dot: 'bg-orange-400' },
  { id: 'won', label: 'Won – customer', short: 'Won', tone: 'border-emerald-400/60', dot: 'bg-emerald-400' },
  { id: 'lost', label: 'Lost', short: 'Lost', tone: 'border-rose-400/60', dot: 'bg-rose-400' },
];
const stageOf = (s: Stage) => STAGES.find((x) => x.id === s) ?? STAGES[0];
const SOURCES = ['manual', 'services-funnel', 'website', 'signup', 'purchase', 'contact-form', 'import', 'whatsapp', 'youtube-live', 'instagram', 'facebook', 'referral', 'walk-in'];
const LOST_REASONS = ['Price too high', 'Not interested now', 'No response', 'Went to another astrologer', 'Wrong number', 'Only wanted free reading', 'Other'];
const CALL_OUTCOMES = ['Connected – interested', 'Connected – call back later', 'Connected – not interested', 'No answer', 'Busy', 'Switched off', 'Wrong number'];

const IST_MS = 330 * 60_000;
const toLocal = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() + IST_MS).toISOString().slice(0, 16) : '');
const fromLocal = (v: string) => (v ? new Date(new Date(`${v}:00Z`).getTime() - IST_MS).toISOString() : null);
const fmtDate = (iso: string | null, time = true) => (iso ? new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', ...(time ? { hour: 'numeric', minute: '2-digit' } : { year: 'numeric' }) }) : '–');
const inr = (p: number | null | undefined) => (p == null ? '–' : `₹${(p / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`);
const prettyService = (s: string | null) => (s ? s.replace(/^SVC_/, '').replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : null);
function ago(iso: string | null) {
  if (!iso) return 'never';
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return 'just now'; if (m < 60) return `${m} min ago`; const h = Math.round(m / 60); if (h < 24) return `${h} h ago`; const d = Math.round(h / 24); return d < 60 ? `${d} d ago` : fmtDate(iso, false);
}
function dueState(iso: string | null) {
  if (!iso) return null;
  const t = new Date(iso).getTime(); const now = Date.now();
  const todayIst = new Date(now + IST_MS).toISOString().slice(0, 10); const dIst = new Date(t + IST_MS).toISOString().slice(0, 10);
  return t < now && dIst < todayIst ? 'overdue' : dIst === todayIst ? 'today' : 'later';
}
/** Preset follow-up times: today 6pm, tomorrow 11am, in 3 days, next Monday – all IST. */
function preset(kind: 'later' | 'tomorrow' | '3d' | 'week') {
  const ist = new Date(Date.now() + IST_MS);
  const at = (days: number, h: number) => { const d = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() + days, h, 0)); return new Date(d.getTime() - IST_MS).toISOString(); };
  if (kind === 'later') return ist.getUTCHours() < 17 ? at(0, 18) : at(1, 11);
  if (kind === 'tomorrow') return at(1, 11);
  if (kind === '3d') return at(3, 11);
  return at(((8 - ist.getUTCDay()) % 7) || 7, 11);
}
const waNumber = (p: string | null) => (p ?? '').replace(/\D/g, '');
const errText = (e: unknown) => {
  if (!(e instanceof ApiError)) return 'Something went wrong.';
  const map: Record<string, string> = { DUPLICATE_CONTACT: 'A contact with this phone or email already exists.', PHONE_INVALID: 'Phone number is not valid – use 10 digits or +<country code>.', PHONE_OR_EMAIL_REQUIRED: 'Enter a phone number or an email.', NOTE_EMPTY: 'Write something first.', CONTACT_NOT_FOUND: 'This contact was deleted.' };
  return map[e.body.error ?? ''] ?? e.message;
};

// ------------------------------------------------------------------ WhatsApp templates
interface Tpl { id: string; label: string; en: string; hi: string }
const TEMPLATES: Tpl[] = [
  { id: 'intro', label: 'First contact', en: 'Namaste {name} 🙏 This is Acharya Nandram\'s team from myNumerologist.com. Thank you for your interest! Your Moolank is {moolank} and Bhagyank is {bhagyank}. Would you like a personal consultation? Reply here and we will guide you.', hi: 'नमस्ते {name} 🙏 मैं myNumerologist.com से आचार्य नंदराम जी की टीम से बोल रहा हूँ। आपकी रुचि के लिए धन्यवाद! आपका मूलांक {moolank} और भाग्यांक {bhagyank} है। क्या आप व्यक्तिगत परामर्श लेना चाहेंगे? यहाँ जवाब दें, हम आपका मार्गदर्शन करेंगे।' },
  { id: 'followup', label: 'Follow-up', en: 'Namaste {name}, just following up on your numerology enquiry. Do you have any questions about the report or the consultation? Happy to help.', hi: 'नमस्ते {name}, आपकी अंक ज्योतिष पूछताछ के बारे में फॉलो-अप कर रहे हैं। क्या रिपोर्ट या परामर्श के बारे में कोई प्रश्न है? हम मदद के लिए तैयार हैं।' },
  { id: 'sample', label: 'Sample report', en: 'Namaste {name}, here is a sample of our detailed numerology report so you can see what you will receive: https://mynumerologist.com/services . Your personalised report will be based on your DOB and name.', hi: 'नमस्ते {name}, हमारी विस्तृत अंक ज्योतिष रिपोर्ट का नमूना यहाँ देखें: https://mynumerologist.com/services । आपकी व्यक्तिगत रिपोर्ट आपकी जन्मतिथि और नाम पर आधारित होगी।' },
  { id: 'payment', label: 'Payment reminder', en: 'Namaste {name}, your consultation slot is reserved. You can complete the payment here: https://mynumerologist.com/services . Let us know if you need any help.', hi: 'नमस्ते {name}, आपका परामर्श स्लॉट आरक्षित है। भुगतान यहाँ पूरा करें: https://mynumerologist.com/services । किसी भी सहायता के लिए बताएँ।' },
  { id: 'birthday', label: 'Birthday wish', en: 'Happy Birthday {name}! 🎂✨ From today your Personal Year {py} begins. Wishing you a year of growth and good fortune. – Acharya Nandram, myNumerologist.com', hi: 'जन्मदिन की हार्दिक शुभकामनाएँ {name}! 🎂✨ आज से आपका व्यक्तिगत वर्ष {py} शुरू हो रहा है। आपका यह वर्ष उन्नति और सौभाग्य से भरा हो। – आचार्य नंदराम, myNumerologist.com' },
  { id: 'review', label: 'Ask for review', en: 'Namaste {name}, thank you for consulting with us 🙏 If the guidance helped you, a short review would mean a lot to us. Thank you!', hi: 'नमस्ते {name}, हमसे परामर्श लेने के लिए धन्यवाद 🙏 यदि मार्गदर्शन उपयोगी रहा हो तो कृपया एक छोटा सा रिव्यू दें। धन्यवाद!' },
];
function fill(t: string, v: { name: string; moolank?: number | null; bhagyank?: number | null; py?: number | null }) {
  return t.replace(/\{name\}/g, v.name.split(' ')[0]).replace(/\{moolank\}/g, String(v.moolank ?? '–')).replace(/\{bhagyank\}/g, String(v.bhagyank ?? '–')).replace(/\{py\}/g, String(v.py ?? '–'));
}

// ------------------------------------------------------------------ shared bits
function useToast() {
  const [t, setT] = React.useState<{ ok: boolean; text: string } | null>(null);
  React.useEffect(() => { if (!t) return; const h = setTimeout(() => setT(null), 4500); return () => clearTimeout(h); }, [t]);
  const node = t ? <div role="status" className={cn('fixed bottom-4 left-1/2 z-[70] -translate-x-1/2 rounded-lg px-4 py-2 text-sm shadow-lg', t.ok ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white')}>{t.text}</div> : null;
  return { show: (ok: boolean, text: string) => setT({ ok, text }), node };
}
const StageBadge = ({ s }: { s: Stage }) => <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-xs"><span className={cn('h-2 w-2 rounded-full', stageOf(s).dot)} />{stageOf(s).short}</span>;
const ScorePill = ({ n }: { n: number }) => <span title="Lead score (0–100)" className={cn('inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums', n >= 60 ? 'bg-rose-500/15 text-rose-500' : n >= 35 ? 'bg-amber-500/15 text-amber-600' : 'bg-muted text-muted-foreground')}>{n >= 60 && <Flame className="h-3 w-3" />}{n}</span>;
function DueBadge({ iso }: { iso: string | null }) {
  const s = dueState(iso); if (!s) return null;
  return <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[11px]', s === 'overdue' ? 'bg-rose-500/15 text-rose-500' : s === 'today' ? 'bg-amber-500/15 text-amber-600' : 'bg-muted text-muted-foreground')}><AlarmClock className="h-3 w-3" />{s === 'overdue' ? 'Overdue' : s === 'today' ? 'Today' : fmtDate(iso)}</span>;
}
function Kpi({ label, value, sub, tone, onClick }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: 'bad' | 'warn' | 'good'; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={!onClick} className={cn('glass rounded-xl p-4 text-left transition', onClick && 'hover:ring-1 hover:ring-gold/50')}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-2xl font-bold tabular-nums', tone === 'bad' && 'text-rose-500', tone === 'warn' && 'text-amber-600', tone === 'good' && 'text-emerald-500')}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </button>
  );
}
function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  React.useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-16" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={cn('w-full rounded-xl border bg-card p-5 shadow-2xl', wide ? 'max-w-3xl' : 'max-w-lg')}>
        <div className="mb-4 flex items-center justify-between"><h3 className="font-serif text-lg font-semibold">{title}</h3><button onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-muted"><X className="h-4 w-4" /></button></div>
        {children}
      </div>
    </div>
  );
}
function openWhatsApp(phone: string | null, text: string) { const n = waNumber(phone); if (n) window.open(`https://wa.me/${n}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer'); }

// ------------------------------------------------------------------ main
type View = 'dashboard' | 'pipeline' | 'contacts' | 'tasks' | 'birthdays' | 'tags';
const VIEWS: { id: View; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { id: 'pipeline', label: 'Pipeline', icon: KanbanSquare }, { id: 'contacts', label: 'Contacts', icon: Users },
  { id: 'tasks', label: 'Follow-ups', icon: ListChecks }, { id: 'birthdays', label: 'Birthdays', icon: Cake }, { id: 'tags', label: 'Tags', icon: Tag },
];
type Filter = Record<string, string>;

export function CrmAdmin() {
  const [view, setView] = React.useState<View>('dashboard');
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<Filter>({ stage: 'all', sort: 'recent' });
  const [adding, setAdding] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [rev, setRev] = React.useState(0); // bump to reload the visible view
  const [owners, setOwners] = React.useState<Owner[]>([]);
  const [tags, setTags] = React.useState<(TagRef & { n: number })[]>([]);
  const toast = useToast();
  const refresh = React.useCallback(() => setRev((r) => r + 1), []);
  React.useEffect(() => { api<{ owners: Owner[] }>('/api/admin/crm?view=owners').then((r) => setOwners(r.owners)).catch(() => {}); }, []);
  React.useEffect(() => { api<{ tags: (TagRef & { n: number })[] }>('/api/admin/crm?view=tags').then((r) => setTags(r.tags)).catch(() => {}); }, [rev]);
  const goContacts = (f: Filter) => { setFilter({ stage: 'all', sort: 'recent', ...f }); setView('contacts'); };

  async function sync() {
    try { const r = await api<{ added: number; linked: number; won: number }>('/api/admin/crm', { method: 'POST', json: { op: 'sync' } }); toast.show(true, `Synced: ${r.added} new contact(s), ${r.linked} linked to accounts, ${r.won} marked Won.`); refresh(); }
    catch (e) { toast.show(false, errText(e)); }
  }
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v)).toString();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-semibold">CRM</h2>
          <p className="text-sm text-muted-foreground">Every lead, client and customer in one place – from the website funnel, e-book popup, sign-ups, payments, Contact Us and your own entries.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="gold" onClick={() => setAdding(true)}><Plus />Add contact</Button>
          <Button size="sm" variant="outline" onClick={sync} title="Pull in new sign-ups, buyers and Contact Us messages"><RefreshCw />Sync</Button>
          <Button size="sm" variant="outline" onClick={() => setImporting(true)}><Upload />Import</Button>
          <Button size="sm" variant="outline" onClick={() => download(`/api/admin/crm?view=contacts&format=csv&${qs}`).catch((e) => toast.show(false, errText(e)))}><Download />Export</Button>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1" role="tablist">
        {VIEWS.map((v) => <button key={v.id} role="tab" aria-selected={view === v.id} onClick={() => setView(v.id)} className={cn('flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm', view === v.id ? 'bg-card font-semibold shadow' : 'text-muted-foreground hover:text-foreground')}><v.icon className="h-4 w-4 text-gold" />{v.label}</button>)}
      </nav>

      {view === 'dashboard' && <Dashboard rev={rev} onOpen={setOpenId} goContacts={goContacts} goTasks={() => setView('tasks')} goBirthdays={() => setView('birthdays')} />}
      {view === 'pipeline' && <Pipeline rev={rev} onOpen={setOpenId} owners={owners} toast={toast.show} />}
      {view === 'contacts' && <Contacts rev={rev} filter={filter} setFilter={setFilter} onOpen={setOpenId} owners={owners} tags={tags} toast={toast.show} refresh={refresh} />}
      {view === 'tasks' && <Tasks rev={rev} onOpen={setOpenId} toast={toast.show} />}
      {view === 'birthdays' && <Birthdays rev={rev} onOpen={setOpenId} toast={toast.show} />}
      {view === 'tags' && <TagsView tags={tags} goContacts={goContacts} toast={toast.show} refresh={refresh} />}

      {openId && <ContactDrawer id={openId} onClose={() => setOpenId(null)} owners={owners} toast={toast.show} onChanged={refresh} />}
      {adding && <AddContact owners={owners} onClose={() => setAdding(false)} onCreated={(id) => { setAdding(false); refresh(); setOpenId(id); }} onOpenExisting={(id) => { setAdding(false); setOpenId(id); }} />}
      {importing && <ImportDialog onClose={() => setImporting(false)} onDone={() => { refresh(); }} />}
      {toast.node}
    </div>
  );
}

// ------------------------------------------------------------------ dashboard
interface Dash {
  kpi: Record<string, number | null>; stages: { stage: Stage; n: number; value: number }[]; sources: { source: string; n: number; won: number }[];
  campaigns: { campaign: string; n: number; won: number }[]; interests: { service: string; n: number }[]; daily: { day: string; n: number }[];
  tasks: Task[]; birthdays: Birthday[]; recent: { id: string; type: string; body: string | null; createdAt: string; leadId: string; name: string }[];
}
function Dashboard({ rev, onOpen, goContacts, goTasks, goBirthdays }: { rev: number; onOpen: (id: string) => void; goContacts: (f: Filter) => void; goTasks: () => void; goBirthdays: () => void }) {
  const [d, setD] = React.useState<Dash | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  React.useEffect(() => { setErr(null); api<Dash>('/api/admin/crm?view=dashboard').then(setD).catch((e) => setErr(errText(e))); }, [rev]);
  if (err) return <p className="text-sm text-danger">{err}</p>;
  if (!d) return <div className="glass h-64 animate-pulse rounded-xl" aria-busy="true" />;
  const k = d.kpi as Record<string, number>;
  const open = d.stages.filter((s) => !['won', 'lost'].includes(s.stage));
  const openN = open.reduce((a, s) => a + s.n, 0), openValue = open.reduce((a, s) => a + s.value, 0);
  const max = Math.max(1, ...d.stages.map((s) => s.n)), dmax = Math.max(1, ...d.daily.map((x) => x.n));
  const delta = k.new7 - k.newPrev7;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Total contacts" value={k.total} sub={`${k.new30} added in 30 days`} onClick={() => goContacts({})} />
        <Kpi label="New this week" value={k.new7} sub={<span className={delta > 0 ? 'text-emerald-500' : delta < 0 ? 'text-rose-500' : ''}>{delta >= 0 ? '+' : ''}{delta} vs last week</span>} onClick={() => goContacts({ sort: 'created' })} />
        <Kpi label="Follow-ups overdue" value={k.overdue} tone={k.overdue ? 'bad' : undefined} sub={`${k.dueToday} due today`} onClick={goTasks} />
        <Kpi label="Not yet contacted" value={k.uncontacted} tone={k.uncontacted ? 'warn' : undefined} sub="New leads older than 24 h" onClick={() => goContacts({ stage: 'new', sort: 'created' })} />
        <Kpi label="Open pipeline" value={openN} sub={`${inr(openValue)} expected value`} onClick={() => goContacts({ stage: 'open' })} />
        <Kpi label="Gone cold" value={k.stale} tone={k.stale ? 'warn' : undefined} sub="Open, no contact for 7+ days" onClick={() => goContacts({ stale: '7', sort: 'recent' })} />
        <Kpi label="Win rate (30 days)" value={d.kpi.winRate30 == null ? '–' : `${d.kpi.winRate30}%`} tone="good" sub={`${k.won30} won · ${k.lost30} lost`} onClick={() => goContacts({ stage: 'won' })} />
        <Kpi label="CRM revenue (30 days)" value={inr(k.revenue30)} tone="good" sub={`${k.customers30} paying contact(s)`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="glass rounded-xl p-5">
          <h3 className="mb-3 font-semibold">Sales funnel</h3>
          <div className="space-y-2">{d.stages.map((s) => (
            <button key={s.stage} onClick={() => goContacts({ stage: s.stage })} className="grid w-full grid-cols-[120px_1fr_60px] items-center gap-2 text-left text-sm hover:opacity-80">
              <span className="flex items-center gap-1.5"><span className={cn('h-2 w-2 rounded-full', stageOf(s.stage).dot)} />{stageOf(s.stage).short}</span>
              <span className="h-5 overflow-hidden rounded bg-muted"><span className={cn('block h-full rounded', stageOf(s.stage).dot)} style={{ width: `${(s.n / max) * 100}%`, opacity: 0.75 }} /></span>
              <span className="text-right tabular-nums">{s.n}</span>
            </button>))}
          </div>
        </section>
        <section className="glass rounded-xl p-5">
          <h3 className="mb-3 font-semibold">New contacts – last 30 days</h3>
          <div className="flex h-36 items-end gap-[3px]" role="img" aria-label="New contacts per day">
            {d.daily.map((x) => <div key={x.day} title={`${x.day}: ${x.n}`} className="flex-1 rounded-t bg-gold/70 hover:bg-gold" style={{ height: `${Math.max(2, (x.n / dmax) * 100)}%` }} />)}
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-muted-foreground"><span>{d.daily[0]?.day.slice(5)}</span><span>today</span></div>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="glass rounded-xl p-5 lg:col-span-1">
          <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Due today &amp; overdue</h3><button onClick={goTasks} className="text-xs text-gold hover:underline">All follow-ups</button></div>
          {d.tasks.length === 0 ? <p className="text-sm text-muted-foreground">Nothing due. 🎉</p> : <ul className="space-y-2">{d.tasks.map((t) => (
            <li key={t.id}><button onClick={() => onOpen(t.leadId)} className="w-full rounded-md p-2 text-left text-sm hover:bg-muted"><span className="flex items-center justify-between gap-2"><span className="font-medium">{t.name}</span><DueBadge iso={t.dueAt} /></span><span className="text-xs text-muted-foreground">{t.title}</span></button></li>))}</ul>}
        </section>
        <section className="glass rounded-xl p-5">
          <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Birthdays – next 7 days</h3><button onClick={goBirthdays} className="text-xs text-gold hover:underline">See all</button></div>
          {d.birthdays.length === 0 ? <p className="text-sm text-muted-foreground">No birthdays this week.</p> : <ul className="space-y-1.5">{d.birthdays.slice(0, 8).map((b) => (
            <li key={b.id}><button onClick={() => onOpen(b.id)} className="flex w-full items-center justify-between rounded-md p-1.5 text-left text-sm hover:bg-muted"><span>{b.name} <span className="text-xs text-muted-foreground">turns {b.age} · PY {b.newPersonalYear}</span></span><span className="text-xs">{b.inDays === 0 ? <Badge tone="gold">Today</Badge> : `in ${b.inDays} d`}</span></button></li>))}</ul>}
        </section>
        <section className="glass rounded-xl p-5">
          <h3 className="mb-3 font-semibold">Recent activity</h3>
          {d.recent.length === 0 ? <p className="text-sm text-muted-foreground">No activity yet.</p> : <ul className="space-y-2">{d.recent.map((a) => (
            <li key={a.id}><button onClick={() => onOpen(a.leadId)} className="w-full text-left text-sm hover:underline"><span className="font-medium">{a.name}</span> <span className="text-muted-foreground">· {a.type} · {ago(a.createdAt)}</span>{a.body && <span className="block truncate text-xs text-muted-foreground">{a.body}</span>}</button></li>))}</ul>}
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <MiniTable title="Lead sources" head={['Source', 'Contacts', 'Won', 'Conv.']} rows={d.sources.map((s) => [s.source, s.n, s.won, s.n ? `${Math.round((s.won / s.n) * 100)}%` : '–'])} onRow={(i) => goContacts({ source: d.sources[i].source })} />
        <MiniTable title="Campaigns (UTM, 90 days)" head={['Campaign', 'Contacts', 'Won']} rows={d.campaigns.map((s) => [s.campaign, s.n, s.won])} />
        <MiniTable title="What they want" head={['Service', 'Contacts']} rows={d.interests.map((s) => [prettyService(s.service) ?? s.service, s.n])} />
      </div>
    </div>
  );
}
function MiniTable({ title, head, rows, onRow }: { title: string; head: string[]; rows: (string | number)[][]; onRow?: (i: number) => void }) {
  return (
    <section className="glass rounded-xl p-5">
      <h3 className="mb-3 font-semibold">{title}</h3>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">No data yet.</p> : (
        <table className="w-full text-sm"><thead><tr className="text-left text-xs uppercase text-muted-foreground">{head.map((h, i) => <th key={h} className={cn('pb-1', i > 0 && 'text-right')}>{h}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i} onClick={onRow ? () => onRow(i) : undefined} className={cn('border-t border-border/40', onRow && 'cursor-pointer hover:bg-muted')}>{r.map((c, j) => <td key={j} className={cn('py-1.5', j > 0 && 'text-right tabular-nums', j === 0 && 'max-w-[160px] truncate')}>{c}</td>)}</tr>)}</tbody></table>
      )}
    </section>
  );
}

// ------------------------------------------------------------------ pipeline (kanban)
function Pipeline({ rev, onOpen, toast }: { rev: number; onOpen: (id: string) => void; owners: Owner[]; toast: (ok: boolean, t: string) => void }) {
  const [list, setList] = React.useState<Contact[] | null>(null);
  const [q, setQ] = React.useState('');
  const [showClosed, setShowClosed] = React.useState(false);
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [over, setOver] = React.useState<Stage | null>(null);
  const [lostFor, setLostFor] = React.useState<Contact | null>(null);
  const load = React.useCallback(() => api<{ contacts: Contact[] }>(`/api/admin/crm?view=contacts&pageSize=1500&sort=recent${q ? `&q=${encodeURIComponent(q)}` : ''}`).then((r) => setList(r.contacts)).catch(() => setList([])), [q]);
  React.useEffect(() => { const h = setTimeout(load, 250); return () => clearTimeout(h); }, [load, rev]);

  async function move(c: Contact, stage: Stage, lostReason?: string) {
    if (c.stage === stage) return;
    if (stage === 'lost' && lostReason === undefined) { setLostFor(c); return; }
    setList((l) => l?.map((x) => (x.id === c.id ? { ...x, stage } : x)) ?? null);
    try { await api('/api/admin/crm', { method: 'POST', json: { op: 'update', id: c.id, stage, ...(lostReason ? { lostReason } : {}) } }); toast(true, `${c.name} → ${stageOf(stage).short}`); }
    catch (e) { toast(false, errText(e)); load(); }
  }
  const cols = STAGES.filter((s) => showClosed || !['won', 'lost'].includes(s.id));
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search name, phone, email…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-gold" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} />Show Won &amp; Lost</label>
        <span className="text-xs text-muted-foreground">Drag a card to another column to change its stage.</span>
      </div>
      {!list ? <div className="glass h-64 animate-pulse rounded-xl" /> : (
        <div className="flex gap-3 overflow-x-auto pb-3">
          {cols.map((s) => { const items = list.filter((c) => c.stage === s.id); const value = items.reduce((a, c) => a + (c.dealValuePaise ?? 0), 0); return (
            <div key={s.id} onDragOver={(e) => { e.preventDefault(); setOver(s.id); }} onDragLeave={() => setOver(null)}
              onDrop={(e) => { e.preventDefault(); setOver(null); const c = list.find((x) => x.id === dragId); if (c) move(c, s.id); setDragId(null); }}
              className={cn('flex w-72 shrink-0 flex-col rounded-xl border-t-4 bg-muted/40 p-2', s.tone, over === s.id && 'ring-2 ring-gold')}>
              <div className="mb-2 flex items-center justify-between px-1"><span className="text-sm font-semibold">{s.label}</span><span className="text-xs text-muted-foreground">{items.length}{value ? ` · ${inr(value)}` : ''}</span></div>
              <div className="flex max-h-[65vh] min-h-[120px] flex-col gap-2 overflow-y-auto">
                {items.map((c) => (
                  <div key={c.id} draggable onDragStart={() => setDragId(c.id)} onDragEnd={() => setDragId(null)} onClick={() => onOpen(c.id)}
                    className={cn('cursor-pointer rounded-lg border bg-card p-2.5 text-sm shadow-sm hover:border-gold/60', dragId === c.id && 'opacity-50', c.priority === 'high' && 'border-l-4 border-l-rose-500')}>
                    <div className="flex items-start justify-between gap-2"><span className="font-medium leading-tight">{c.name}</span><ScorePill n={c.score} /></div>
                    <div className="mt-1 text-xs text-muted-foreground">{c.phone ?? c.email}</div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[11px]">
                      {c.moolank && <span className="rounded bg-gold/15 px-1.5 py-0.5">M{c.moolank} · B{c.bhagyank}</span>}
                      {c.service && <span className="rounded bg-muted px-1.5 py-0.5">{prettyService(c.service)}</span>}
                      {c.dealValuePaise ? <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-emerald-600">{inr(c.dealValuePaise)}</span> : null}
                      <DueBadge iso={c.nextFollowUpAt} />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">{c.lastContactedAt ? `contacted ${ago(c.lastContactedAt)}` : 'not contacted yet'}</span>
                      <select aria-label="Move to stage" className="rounded border bg-background px-1 text-[11px]" value={c.stage} onClick={(e) => e.stopPropagation()} onChange={(e) => move(c, e.target.value as Stage)}>{STAGES.map((x) => <option key={x.id} value={x.id}>{x.short}</option>)}</select>
                    </div>
                  </div>))}
                {items.length === 0 && <p className="p-3 text-center text-xs text-muted-foreground">Drop here</p>}
              </div>
            </div>); })}
        </div>
      )}
      {lostFor && <LostDialog name={lostFor.name} onClose={() => setLostFor(null)} onPick={(r) => { const c = lostFor; setLostFor(null); move(c, 'lost', r); }} />}
    </div>
  );
}
function LostDialog({ name, onClose, onPick }: { name: string; onClose: () => void; onPick: (r: string) => void }) {
  const [other, setOther] = React.useState('');
  return (
    <Modal title={`Why was ${name} lost?`} onClose={onClose}>
      <div className="flex flex-wrap gap-2">{LOST_REASONS.filter((r) => r !== 'Other').map((r) => <Button key={r} size="sm" variant="outline" onClick={() => onPick(r)}>{r}</Button>)}</div>
      <div className="mt-3 flex gap-2"><Input placeholder="Other reason…" value={other} onChange={(e) => setOther(e.target.value)} maxLength={500} /><Button onClick={() => onPick(other.trim() || 'Other')}>Save</Button></div>
    </Modal>
  );
}

// ------------------------------------------------------------------ contacts table
function Contacts({ rev, filter, setFilter, onOpen, owners, tags, toast, refresh }: { rev: number; filter: Filter; setFilter: (f: Filter) => void; onOpen: (id: string) => void; owners: Owner[]; tags: TagRef[]; toast: (ok: boolean, t: string) => void; refresh: () => void }) {
  const [data, setData] = React.useState<{ contacts: Contact[]; total: number; page: number; pageSize: number } | null>(null);
  const [sel, setSel] = React.useState<Set<string>>(new Set());
  const [more, setMore] = React.useState(false);
  const [bulkTag, setBulkTag] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const qs = new URLSearchParams(Object.entries({ pageSize: '50', ...filter }).filter(([, v]) => v)).toString();
  React.useEffect(() => { const h = setTimeout(() => api<typeof data>(`/api/admin/crm?view=contacts&${qs}`).then(setData).catch(() => setData({ contacts: [], total: 0, page: 1, pageSize: 50 })), 200); return () => clearTimeout(h); }, [qs, rev]);
  React.useEffect(() => setSel(new Set()), [qs]);
  const set = (k: string, v: string) => setFilter({ ...filter, [k]: v, page: k === 'page' ? v : '' });
  const ids = [...sel];
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const activeCount = Object.entries(filter).filter(([k, v]) => v && !['sort', 'page', 'pageSize'].includes(k) && !(k === 'stage' && v === 'all')).length;

  async function doBulk(json: Record<string, unknown>, label: string) {
    if (!ids.length) return;
    if (json.action === 'delete' && !window.confirm(`Delete ${ids.length} contact(s) and their timeline? This cannot be undone.`)) return;
    setBusy(true);
    try { const r = await api<{ n: number }>('/api/admin/crm', { method: 'POST', json: { op: 'bulk', ids, ...json } }); toast(true, `${label}: ${r.n} contact(s)`); setSel(new Set()); refresh(); }
    catch (e) { toast(false, errText(e)); } finally { setBusy(false); }
  }
  function copyNumbers() {
    const chosen = data?.contacts.filter((c) => sel.has(c.id)) ?? [];
    const ok = chosen.filter((c) => c.phone && c.waConsent);
    navigator.clipboard.writeText(ok.map((c) => c.phone).join('\n')).then(() => toast(true, `Copied ${ok.length} number(s) with WhatsApp consent${chosen.length - ok.length ? ` – ${chosen.length - ok.length} skipped (no consent)` : ''}. Paste into a WhatsApp Business broadcast list.`));
  }

  return (
    <div className="space-y-3">
      <div className="glass space-y-3 rounded-xl p-3">
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search name, phone, email, city…" value={filter.q ?? ''} onChange={(e) => set('q', e.target.value)} /></div>
          <Select className="w-40" value={filter.stage ?? 'all'} onChange={(e) => set('stage', e.target.value)} aria-label="Stage"><option value="all">All stages</option><option value="open">Open (not won/lost)</option>{STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</Select>
          <Select className="w-40" value={filter.followUp ?? ''} onChange={(e) => set('followUp', e.target.value)} aria-label="Follow-up"><option value="">Any follow-up</option><option value="overdue">Overdue</option><option value="today">Due today</option><option value="week">Due in 7 days</option><option value="none">No follow-up set</option></Select>
          <Select className="w-40" value={filter.sort ?? 'recent'} onChange={(e) => set('sort', e.target.value)} aria-label="Sort"><option value="recent">Recently updated</option><option value="created">Newest first</option><option value="score">Hottest (score)</option><option value="followup">Next follow-up</option><option value="value">Deal value</option><option value="name">Name A–Z</option></Select>
          <Button variant="outline" onClick={() => setMore(!more)}>Filters{activeCount ? ` (${activeCount})` : ''}</Button>
          {activeCount > 0 && <Button variant="ghost" onClick={() => setFilter({ stage: 'all', sort: filter.sort ?? 'recent' })}><X />Clear</Button>}
        </div>
        {more && (
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
            <Select value={filter.source ?? ''} onChange={(e) => set('source', e.target.value)} aria-label="Source"><option value="">Any source</option>{SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}</Select>
            <Select value={filter.tag ?? ''} onChange={(e) => set('tag', e.target.value)} aria-label="Tag"><option value="">Any tag</option>{tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select>
            <Select value={filter.owner ?? ''} onChange={(e) => set('owner', e.target.value)} aria-label="Owner"><option value="">Any owner</option><option value="none">Unassigned</option>{owners.map((o) => <option key={o.id} value={o.id}>{o.name ?? o.email}</option>)}</Select>
            <Select value={filter.priority ?? ''} onChange={(e) => set('priority', e.target.value)} aria-label="Priority"><option value="">Any priority</option><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></Select>
            <Select value={filter.consent ?? ''} onChange={(e) => set('consent', e.target.value)} aria-label="WhatsApp consent"><option value="">Any consent</option><option value="whatsapp">WhatsApp opted-in</option><option value="none">No consent</option></Select>
            <Select value={filter.moolank ?? ''} onChange={(e) => set('moolank', e.target.value)} aria-label="Moolank"><option value="">Any Moolank</option>{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => <option key={n} value={n}>Moolank {n}</option>)}</Select>
            <Select value={filter.bhagyank ?? ''} onChange={(e) => set('bhagyank', e.target.value)} aria-label="Bhagyank"><option value="">Any Bhagyank</option>{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => <option key={n} value={n}>Bhagyank {n}</option>)}</Select>
            <Select value={filter.language ?? ''} onChange={(e) => set('language', e.target.value)} aria-label="Language"><option value="">Any language</option><option value="en">English</option><option value="hi">Hindi</option></Select>
            <Select value={filter.birthday ?? ''} onChange={(e) => set('birthday', e.target.value)} aria-label="Birthday"><option value="">Any birthday</option><option value="today">Birthday today</option><option value="week">Birthday in 7 days</option><option value="month">Birthday in 30 days</option></Select>
            <Select value={filter.stale ?? ''} onChange={(e) => set('stale', e.target.value)} aria-label="Not contacted"><option value="">Any last contact</option><option value="3">Not contacted 3+ days</option><option value="7">Not contacted 7+ days</option><option value="30">Not contacted 30+ days</option></Select>
          </div>
        )}
      </div>

      {sel.size > 0 && (
        <div className="sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-gold/50 bg-card p-2 text-sm shadow-lg">
          <span className="px-2 font-semibold">{sel.size} selected</span>
          <Select className="h-8 w-40 text-xs" value="" disabled={busy} onChange={(e) => e.target.value && doBulk({ action: 'stage', stage: e.target.value }, 'Stage changed')} aria-label="Move to stage"><option value="">Move to stage…</option>{STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</Select>
          <Select className="h-8 w-36 text-xs" value="" disabled={busy} onChange={(e) => e.target.value && doBulk({ action: 'owner', ownerId: e.target.value === 'none' ? null : e.target.value }, 'Owner set')} aria-label="Assign owner"><option value="">Assign to…</option><option value="none">Nobody</option>{owners.map((o) => <option key={o.id} value={o.id}>{o.name ?? o.email}</option>)}</Select>
          <Select className="h-8 w-32 text-xs" value="" disabled={busy} onChange={(e) => e.target.value && doBulk({ action: 'priority', priority: e.target.value }, 'Priority set')} aria-label="Priority"><option value="">Priority…</option><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></Select>
          <span className="flex items-center gap-1"><Input className="h-8 w-28 text-xs" placeholder="tag" value={bulkTag} onChange={(e) => setBulkTag(e.target.value)} list="crm-tags" /><Button size="sm" variant="outline" disabled={!bulkTag.trim() || busy} onClick={() => doBulk({ action: 'tag', tag: bulkTag.trim() }, 'Tagged')}>+ Tag</Button><Button size="sm" variant="ghost" disabled={!bulkTag.trim() || busy} onClick={() => doBulk({ action: 'untag', tag: bulkTag.trim() }, 'Tag removed')}>− Tag</Button></span>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => doBulk({ action: 'followup', title: 'Follow up', dueAt: preset('tomorrow') }, 'Follow-up set for tomorrow')}><CalendarClock />Follow up tomorrow</Button>
          <Button size="sm" variant="outline" onClick={copyNumbers}><Copy />Copy WhatsApp list</Button>
          <Button size="sm" variant="ghost" className="text-rose-500" disabled={busy} onClick={() => doBulk({ action: 'delete' }, 'Deleted')}><Trash2 />Delete</Button>
          <button onClick={() => setSel(new Set())} className="ml-auto rounded p-1 hover:bg-muted" aria-label="Clear selection"><X className="h-4 w-4" /></button>
          <datalist id="crm-tags">{tags.map((t) => <option key={t.id} value={t.name} />)}</datalist>
        </div>
      )}

      <div className="glass overflow-x-auto rounded-xl">
        {!data ? <div className="h-48 animate-pulse" /> : data.contacts.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground"><Inbox className="mx-auto mb-2 h-8 w-8 text-gold" />No contacts match. Add one, import a CSV, or press Sync to pull in sign-ups, buyers and Contact Us messages.</div>
        ) : (
          <table className="w-full min-w-[980px] text-sm">
            <thead><tr className="border-b text-left text-xs uppercase text-muted-foreground">
              <th className="w-8 p-2"><input type="checkbox" aria-label="Select all on this page" className="h-4 w-4 accent-gold" checked={data.contacts.every((c) => sel.has(c.id))} onChange={(e) => setSel(e.target.checked ? new Set(data.contacts.map((c) => c.id)) : new Set())} /></th>
              <th className="p-2">Contact</th><th className="p-2">Stage</th><th className="p-2">Score</th><th className="p-2">M / B</th><th className="p-2">Interested in</th><th className="p-2">Source</th><th className="p-2">Follow-up</th><th className="p-2">Last contact</th><th className="p-2 text-right">Value</th><th className="p-2" />
            </tr></thead>
            <tbody>{data.contacts.map((c) => (
              <tr key={c.id} className={cn('border-b border-border/40 hover:bg-muted/50', sel.has(c.id) && 'bg-gold/10')}>
                <td className="p-2"><input type="checkbox" aria-label={`Select ${c.name}`} className="h-4 w-4 accent-gold" checked={sel.has(c.id)} onChange={(e) => { const n = new Set(sel); if (e.target.checked) n.add(c.id); else n.delete(c.id); setSel(n); }} /></td>
                <td className="cursor-pointer p-2" onClick={() => onOpen(c.id)}>
                  <span className="flex items-center gap-1.5 font-medium">{c.priority === 'high' && <Flame className="h-3.5 w-3.5 text-rose-500" aria-label="High priority" />}{c.name}{c.paidOrders > 0 && <Badge tone="good" className="px-1.5 py-0 text-[10px]">paid</Badge>}</span>
                  <span className="block text-xs text-muted-foreground">{c.phone ?? ''}{c.phone && c.email ? ' · ' : ''}{c.email ?? ''}</span>
                  {c.tags.length > 0 && <span className="mt-0.5 flex flex-wrap gap-1">{c.tags.slice(0, 4).map((t) => <span key={t.id} className="rounded bg-gold/15 px-1.5 text-[10px]">{t.name}</span>)}</span>}
                </td>
                <td className="p-2"><StageBadge s={c.stage} /></td>
                <td className="p-2"><ScorePill n={c.score} /></td>
                <td className="p-2 whitespace-nowrap tabular-nums">{c.moolank ?? '–'} / {c.bhagyank ?? '–'}</td>
                <td className="p-2 text-xs">{prettyService(c.service) ?? '–'}</td>
                <td className="p-2 text-xs">{c.source}{c.utmSource && <span className="block text-muted-foreground">{c.utmSource}</span>}</td>
                <td className="p-2">{c.nextFollowUpAt ? <DueBadge iso={c.nextFollowUpAt} /> : <span className="text-xs text-muted-foreground">–</span>}</td>
                <td className="p-2 text-xs text-muted-foreground whitespace-nowrap">{ago(c.lastContactedAt)}</td>
                <td className="p-2 text-right tabular-nums">{c.paidPaise ? <span className="text-emerald-600">{inr(c.paidPaise)}</span> : c.dealValuePaise ? inr(c.dealValuePaise) : '–'}</td>
                <td className="p-2"><span className="flex gap-1">
                  {c.phone && <a href={`tel:${c.phone}`} className="rounded p-1.5 hover:bg-muted" aria-label={`Call ${c.name}`} title="Call"><Phone className="h-4 w-4" /></a>}
                  {c.phone && <button onClick={() => onOpen(c.id)} className="rounded p-1.5 text-emerald-600 hover:bg-muted" aria-label={`WhatsApp ${c.name}`} title="WhatsApp (opens templates)"><MessageCircle className="h-4 w-4" /></button>}
                </span></td>
              </tr>))}
            </tbody>
          </table>
        )}
      </div>
      {data && data.total > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{data.total} contact(s) · page {data.page} of {pages}</span>
          <div className="flex gap-2"><Button size="sm" variant="outline" disabled={data.page <= 1} onClick={() => set('page', String(data.page - 1))}><ChevronLeft />Prev</Button><Button size="sm" variant="outline" disabled={data.page >= pages} onClick={() => set('page', String(data.page + 1))}>Next<ChevronRight /></Button></div>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ follow-ups
function Tasks({ rev, onOpen, toast }: { rev: number; onOpen: (id: string) => void; toast: (ok: boolean, t: string) => void }) {
  const [tv, setTv] = React.useState<'overdue' | 'today' | 'upcoming' | 'done'>('today');
  const [data, setData] = React.useState<{ tasks: Task[]; counts: Record<string, number> } | null>(null);
  const [n, setN] = React.useState(0);
  React.useEffect(() => { api<typeof data>(`/api/admin/crm?view=tasks&tasks=${tv}`).then(setData).catch(() => setData({ tasks: [], counts: {} })); }, [tv, rev, n]);
  React.useEffect(() => { if (data && tv === 'today' && !data.counts.today && data.counts.overdue) setTv('overdue'); }, [data, tv]);
  async function upd(id: string, json: Record<string, unknown>, msg: string) {
    try { await api('/api/admin/crm', { method: 'POST', json: { op: 'taskUpdate', id, ...json } }); toast(true, msg); setN((x) => x + 1); } catch (e) { toast(false, errText(e)); }
  }
  const tabs = [{ id: 'overdue', label: 'Overdue' }, { id: 'today', label: 'Today' }, { id: 'upcoming', label: 'Upcoming' }, { id: 'done', label: 'Done' }] as const;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">{tabs.map((t) => (
        <button key={t.id} onClick={() => setTv(t.id)} className={cn('rounded-full border px-3 py-1 text-sm', tv === t.id ? 'border-gold bg-gold/20 font-semibold' : 'hover:bg-muted')}>
          {t.label}{data?.counts?.[t.id] != null && t.id !== 'done' && <span className={cn('ml-1.5 rounded-full px-1.5 text-xs', t.id === 'overdue' && data.counts[t.id] ? 'bg-rose-500 text-white' : 'bg-muted')}>{data.counts[t.id]}</span>}
        </button>))}
      </div>
      <div className="glass rounded-xl">
        {!data ? <div className="h-40 animate-pulse" /> : data.tasks.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">{tv === 'done' ? 'No completed follow-ups yet.' : 'Nothing here. Add follow-ups from a contact’s page.'}</p> : (
          <ul className="divide-y divide-border/50">{data.tasks.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-3 p-3">
              <button onClick={() => upd(t.id, { done: !t.doneAt }, t.doneAt ? 'Re-opened' : 'Marked done')} aria-label={t.doneAt ? 'Mark not done' : 'Mark done'} className={cn('flex h-6 w-6 items-center justify-center rounded-full border-2', t.doneAt ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gold hover:bg-gold/20')}>{t.doneAt && <Check className="h-3.5 w-3.5" />}</button>
              <div className="min-w-[200px] flex-1">
                <p className={cn('font-medium', t.doneAt && 'line-through opacity-60')}>{t.title}{t.priority === 'high' && <Flame className="ml-1 inline h-3.5 w-3.5 text-rose-500" />}</p>
                <button onClick={() => onOpen(t.leadId)} className="text-sm text-gold hover:underline">{t.name}</button> <StageBadge s={t.stage} />
              </div>
              <span className="text-sm">{t.doneAt ? `done ${ago(t.doneAt)}` : <DueBadge iso={t.dueAt} />}<span className="ml-1 text-xs text-muted-foreground">{!t.doneAt && fmtDate(t.dueAt)}</span></span>
              {!t.doneAt && <div className="flex flex-wrap gap-1">
                {t.phone && <a href={`tel:${t.phone}`} className="inline-flex h-8 items-center rounded-md border px-2 text-xs hover:bg-muted"><Phone className="mr-1 h-3.5 w-3.5" />Call</a>}
                <Button size="sm" variant="ghost" onClick={() => upd(t.id, { dueAt: preset('tomorrow') }, 'Moved to tomorrow')}>Tomorrow</Button>
                <Button size="sm" variant="ghost" onClick={() => upd(t.id, { dueAt: preset('3d') }, 'Moved by 3 days')}>+3 days</Button>
                <Button size="sm" variant="ghost" onClick={() => upd(t.id, { dueAt: preset('week') }, 'Moved to next week')}>Next week</Button>
              </div>}
            </li>))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ birthdays
function Birthdays({ rev, onOpen, toast }: { rev: number; onOpen: (id: string) => void; toast: (ok: boolean, t: string) => void }) {
  const [days, setDays] = React.useState(30);
  const [list, setList] = React.useState<Birthday[] | null>(null);
  React.useEffect(() => { api<{ birthdays: Birthday[] }>(`/api/admin/crm?view=birthdays&days=${days}`).then((r) => setList(r.birthdays)).catch(() => setList([])); }, [days, rev]);
  async function wish(b: Birthday) {
    const t = TEMPLATES.find((x) => x.id === 'birthday')!;
    openWhatsApp(b.phone, fill(b.language === 'hi' ? t.hi : t.en, { name: b.name, py: b.newPersonalYear }));
    try { await api('/api/admin/crm', { method: 'POST', json: { op: 'activity', id: b.id, type: 'whatsapp', body: 'Birthday wish sent', template: 'birthday' } }); toast(true, 'Logged on the timeline.'); } catch { /* ignore */ }
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3"><span className="text-sm">Show the next</span><Select className="w-32" value={days} onChange={(e) => setDays(Number(e.target.value))}>{[7, 15, 30, 60].map((d) => <option key={d} value={d}>{d} days</option>)}</Select>
        <p className="text-xs text-muted-foreground">A birthday is the start of a new Personal Year (birthday to birthday) – a natural moment for a yearly forecast offer.</p></div>
      <div className="glass overflow-x-auto rounded-xl">
        {!list ? <div className="h-40 animate-pulse" /> : list.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No birthdays in this period (only contacts with a date of birth are listed).</p> : (
          <table className="w-full min-w-[640px] text-sm"><thead><tr className="border-b text-left text-xs uppercase text-muted-foreground"><th className="p-2">When</th><th className="p-2">Name</th><th className="p-2">Turns</th><th className="p-2">New Personal Year</th><th className="p-2">Stage</th><th className="p-2" /></tr></thead>
            <tbody>{list.map((b) => (
              <tr key={b.id} className="border-b border-border/40">
                <td className="p-2">{b.inDays === 0 ? <Badge tone="gold">Today</Badge> : b.inDays === 1 ? 'Tomorrow' : `in ${b.inDays} days`}<span className="block text-xs text-muted-foreground">{b.dob.slice(8)}-{b.dob.slice(5, 7)}</span></td>
                <td className="p-2"><button onClick={() => onOpen(b.id)} className="font-medium hover:underline">{b.name}</button></td>
                <td className="p-2 tabular-nums">{b.age}</td><td className="p-2"><span className="rounded bg-gold/15 px-2 py-0.5 font-semibold">PY {b.newPersonalYear}</span></td>
                <td className="p-2"><StageBadge s={b.stage} /></td>
                <td className="p-2 text-right">{b.phone ? <Button size="sm" variant="outline" onClick={() => wish(b)} title={b.waConsent ? '' : 'No WhatsApp consent recorded – send only if they are an existing client.'}><MessageCircle className="text-emerald-600" />Send wish{!b.waConsent && <ShieldOff className="text-amber-500" />}</Button> : <span className="text-xs text-muted-foreground">no phone</span>}</td>
              </tr>))}</tbody></table>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ tags
function TagsView({ tags, goContacts, toast, refresh }: { tags: (TagRef & { n: number })[]; goContacts: (f: Filter) => void; toast: (ok: boolean, t: string) => void; refresh: () => void }) {
  async function del(t: TagRef) {
    if (!window.confirm(`Delete the tag "${t.name}"? Contacts keep everything else.`)) return;
    try { await api('/api/admin/crm', { method: 'POST', json: { op: 'tagDelete', id: t.id } }); toast(true, 'Tag deleted'); refresh(); } catch (e) { toast(false, errText(e)); }
  }
  return (
    <div className="glass rounded-xl p-5">
      <p className="mb-4 text-sm text-muted-foreground">Tags group contacts for follow-ups and WhatsApp broadcast lists – e.g. <em>YouTube live 14 Nov</em>, <em>Name correction</em>, <em>VIP</em>, <em>Diwali offer</em>. Add tags from a contact’s page, with bulk actions on Contacts, or in a CSV import.</p>
      {tags.length === 0 ? <p className="text-sm text-muted-foreground">No tags yet.</p> : (
        <div className="flex flex-wrap gap-2">{tags.map((t) => (
          <span key={t.id} className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 py-1 pl-3 pr-1 text-sm">
            <button onClick={() => goContacts({ tag: t.id })} className="hover:underline">{t.name}</button><span className="text-xs text-muted-foreground">{t.n}</span>
            <button onClick={() => del(t)} className="rounded-full p-1 hover:bg-rose-500/20" aria-label={`Delete tag ${t.name}`}><X className="h-3 w-3" /></button>
          </span>))}</div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ add contact
function ContactForm({ value, onChange, owners }: { value: Record<string, string>; onChange: (v: Record<string, string>) => void; owners: Owner[] }) {
  const s = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => onChange({ ...value, [k]: e.target.value });
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Full name" htmlFor="cf-name" required><Input id="cf-name" value={value.name ?? ''} onChange={s('name')} maxLength={120} /></Field>
      <Field label="Mobile / WhatsApp" htmlFor="cf-phone" hint="10-digit Indian or +country code"><Input id="cf-phone" inputMode="tel" value={value.phone ?? ''} onChange={s('phone')} maxLength={20} /></Field>
      <Field label="Email" htmlFor="cf-email"><Input id="cf-email" type="email" value={value.email ?? ''} onChange={s('email')} maxLength={320} /></Field>
      <Field label="Date of birth" htmlFor="cf-dob" hint="Moolank & Bhagyank are worked out automatically"><Input id="cf-dob" type="date" value={value.dob ?? ''} onChange={s('dob')} max={new Date().toISOString().slice(0, 10)} /></Field>
      <Field label="City" htmlFor="cf-city"><Input id="cf-city" value={value.city ?? ''} onChange={s('city')} maxLength={100} /></Field>
      <Field label="State" htmlFor="cf-state"><Input id="cf-state" value={value.state ?? ''} onChange={s('state')} maxLength={100} /></Field>
      <Field label="Gender" htmlFor="cf-g"><Select id="cf-g" value={value.gender ?? ''} onChange={s('gender')}><option value="">–</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></Select></Field>
      <Field label="Language" htmlFor="cf-lang"><Select id="cf-lang" value={value.language ?? 'en'} onChange={s('language')}><option value="en">English</option><option value="hi">Hindi</option></Select></Field>
      <Field label="Source" htmlFor="cf-src"><Select id="cf-src" value={value.source ?? 'manual'} onChange={s('source')}>{SOURCES.map((x) => <option key={x} value={x}>{x}</option>)}</Select></Field>
      <Field label="Interested in" htmlFor="cf-svc" hint="e.g. Name correction, Mobile number"><Input id="cf-svc" value={value.service ?? ''} onChange={s('service')} maxLength={50} /></Field>
      <Field label="Stage" htmlFor="cf-stage"><Select id="cf-stage" value={value.stage ?? 'new'} onChange={s('stage')}>{STAGES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</Select></Field>
      <Field label="Priority" htmlFor="cf-pr"><Select id="cf-pr" value={value.priority ?? 'normal'} onChange={s('priority')}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></Select></Field>
      <Field label="Expected value (₹)" htmlFor="cf-val"><Input id="cf-val" type="number" min={0} value={value.dealValueRupees ?? ''} onChange={s('dealValueRupees')} /></Field>
      <Field label="Owner" htmlFor="cf-own"><Select id="cf-own" value={value.ownerId ?? ''} onChange={s('ownerId')}><option value="">Unassigned</option>{owners.map((o) => <option key={o.id} value={o.id}>{o.name ?? o.email}</option>)}</Select></Field>
      <Field label="Notes" htmlFor="cf-notes" className="sm:col-span-2"><textarea id="cf-notes" rows={3} className="w-full rounded-md border border-input bg-background/70 p-2 text-sm" value={value.notes ?? ''} onChange={s('notes')} maxLength={4000} /></Field>
    </div>
  );
}
const toPayload = (v: Record<string, string>) => ({ ...v, dealValueRupees: v.dealValueRupees ? Number(v.dealValueRupees) : null, ownerId: v.ownerId || null, gender: v.gender || null });

function AddContact({ owners, onClose, onCreated, onOpenExisting }: { owners: Owner[]; onClose: () => void; onCreated: (id: string) => void; onOpenExisting: (id: string) => void }) {
  const [v, setV] = React.useState<Record<string, string>>({ language: 'en', source: 'manual', stage: 'new', priority: 'normal' });
  const [consent, setConsent] = React.useState(false);
  const [tags, setTagsText] = React.useState('');
  const [err, setErr] = React.useState<{ text: string; dupId?: string } | null>(null);
  const [busy, setBusy] = React.useState(false);
  async function save() {
    setBusy(true); setErr(null);
    try { const r = await api<{ id: string }>('/api/admin/crm', { method: 'POST', json: { op: 'create', ...toPayload(v), whatsappConsent: consent, tags: tags.split(',').map((t) => t.trim()).filter(Boolean) } }); onCreated(r.id); }
    catch (e) { setErr({ text: errText(e), dupId: e instanceof ApiError ? (e.body as { id?: string }).id : undefined }); } finally { setBusy(false); }
  }
  return (
    <Modal title="Add contact" onClose={onClose} wide>
      <ContactForm value={v} onChange={setV} owners={owners} />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Tags" htmlFor="cf-tags" hint="Comma separated"><Input id="cf-tags" value={tags} onChange={(e) => setTagsText(e.target.value)} placeholder="YouTube live, VIP" /></Field>
        <label className="flex items-start gap-2 pt-6 text-sm"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-gold" checked={consent} onChange={(e) => setConsent(e.target.checked)} />The client agreed to be contacted on WhatsApp (needed for broadcast lists).</label>
      </div>
      {err && <p className="mt-3 text-sm text-danger" role="alert">{err.text} {err.dupId && <button className="underline" onClick={() => onOpenExisting(err.dupId!)}>Open the existing contact</button>}</p>}
      <div className="mt-4 flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="gold" onClick={save} disabled={busy || !v.name?.trim()}><Plus />Save contact</Button></div>
    </Modal>
  );
}

// ------------------------------------------------------------------ import
/** Minimal RFC-4180 CSV parser (quotes, escaped quotes, CRLF). */
function parseCsv(text: string): string[][] {
  const out: string[][] = []; let row: string[] = []; let cell = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
    else if (ch === '"') q = true; else if (ch === ',') { row.push(cell); cell = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); out.push(row); row = []; cell = ''; } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); out.push(row); }
  return out.filter((r) => r.some((c) => c.trim()));
}
const HEADER_MAP: Record<string, string> = { name: 'name', 'full name': 'name', 'client name': 'name', phone: 'phone', mobile: 'phone', whatsapp: 'phone', 'mobile number': 'phone', 'phone number': 'phone', email: 'email', 'e-mail': 'email', dob: 'dob', 'date of birth': 'dob', birthday: 'dob', city: 'city', state: 'state', language: 'language', source: 'source', stage: 'stage', service: 'service', 'interested in': 'service', tags: 'tags', tag: 'tags', notes: 'notes', note: 'notes', consent: 'whatsappConsent', 'whatsapp consent': 'whatsappConsent' };

function ImportDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [rows, setRows] = React.useState<Record<string, string>[] | null>(null);
  const [cols, setCols] = React.useState<string[]>([]);
  const [result, setResult] = React.useState<{ added: number; duplicates: number; invalid: number; errors: { row: number; error: string }[] } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  function load(text: string) {
    setResult(null); setErr(null);
    const t = parseCsv(text.replace(/^﻿/, ''));
    if (t.length < 2) { setErr('The file needs a header row and at least one contact.'); return; }
    const head = t[0].map((h) => HEADER_MAP[h.trim().toLowerCase()] ?? '');
    if (!head.includes('name')) { setErr('No “Name” column found. Use headers like: Name, Mobile, Email, DOB, City, Tags, Notes.'); return; }
    setCols(head.filter(Boolean));
    setRows(t.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]?.trim() ?? '']).filter(([h]) => h))));
  }
  async function run() {
    if (!rows) return; setBusy(true);
    try { const r = await api<NonNullable<typeof result>>('/api/admin/crm', { method: 'POST', json: { op: 'import', rows } }); setResult(r); onDone(); } catch (e) { setErr(errText(e)); } finally { setBusy(false); }
  }
  const sample = 'Name,Mobile,Email,DOB,City,Source,Tags,Notes,WhatsApp consent\nRahul Sharma,9876543210,rahul@example.com,15-08-1990,Jaipur,youtube-live,YouTube live;VIP,Asked about name correction,yes';
  return (
    <Modal title="Import contacts from CSV" onClose={onClose} wide>
      <p className="mb-3 text-sm text-muted-foreground">Export from Excel / Google Sheets as CSV. Recognised columns: Name (required), Mobile, Email, DOB (DD-MM-YYYY or YYYY-MM-DD), City, State, Language, Source, Stage, Interested in, Tags (separate with ;), Notes, WhatsApp consent (yes/no). Existing phones/emails are skipped, never overwritten.</p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gold/50 px-3 py-2 text-sm hover:bg-gold/10"><Upload className="h-4 w-4" />Choose CSV file<input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) f.text().then(load); }} /></label>
        <Button size="sm" variant="ghost" onClick={() => { const b = new Blob(['﻿' + sample], { type: 'text/csv' }); const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(b), download: 'crm-import-template.csv' }); a.click(); }}><Download />Template</Button>
      </div>
      {err && <p className="mt-3 text-sm text-danger" role="alert">{err}</p>}
      {rows && !result && (
        <div className="mt-4">
          <p className="mb-2 text-sm"><strong>{rows.length}</strong> row(s) · columns: {cols.join(', ')}</p>
          <div className="max-h-56 overflow-auto rounded border text-xs"><table className="w-full"><thead><tr>{cols.map((c) => <th key={c} className="bg-muted p-1 text-left">{c}</th>)}</tr></thead><tbody>{rows.slice(0, 8).map((r, i) => <tr key={i} className="border-t">{cols.map((c) => <td key={c} className="p-1">{r[c]}</td>)}</tr>)}</tbody></table></div>
          <div className="mt-3 flex justify-end"><Button variant="gold" onClick={run} disabled={busy}>{busy ? 'Importing…' : `Import ${rows.length} contact(s)`}</Button></div>
        </div>
      )}
      {result && (
        <div className="mt-4 rounded-lg bg-muted p-3 text-sm">
          <p><CheckCircle2 className="mr-1 inline h-4 w-4 text-emerald-500" /><strong>{result.added}</strong> added · {result.duplicates} already in the CRM · {result.invalid} invalid</p>
          {result.errors.length > 0 && <ul className="mt-2 max-h-32 overflow-auto text-xs text-muted-foreground">{result.errors.map((e) => <li key={e.row}>Row {e.row}: {e.error}</li>)}</ul>}
          <div className="mt-3 flex justify-end"><Button onClick={onClose}>Done</Button></div>
        </div>
      )}
    </Modal>
  );
}

// ------------------------------------------------------------------ contact drawer
interface Detail {
  contact: Contact; activities: { id: string; type: string; body: string | null; meta: Record<string, unknown>; createdAt: string; by: string | null }[]; tasks: Task[];
  consents: { channel: string; status: string; purpose: string; optedInAt: string; optedOutAt: string | null }[]; events: { eventName: string; occurredAt: string }[];
  purchases: { id: string; plan: string; amountPaise: number; currency: string | null; status: string; invoice: string | null; at: string }[];
  orders: { id: string; service: string; status: string; at: string; deliveredAt: string | null }[];
  account?: { email: string | null; phone: string | null; credits: number; lastLoginAt: string | null; createdAt: string }; reportsCount: number;
  numerology: { moolank: number | null; bhagyank: number | null; personalYear: number | null; age: number | null };
}
const ACT_ICON: Record<string, React.ElementType> = { note: NotebookPen, call: Phone, whatsapp: MessageCircle, email: Mail, meeting: Users, stage: ArrowRight, task: CheckCircle2, system: RefreshCw };

function ContactDrawer({ id, onClose, owners, toast, onChanged }: { id: string; onClose: () => void; owners: Owner[]; toast: (ok: boolean, t: string) => void; onChanged: () => void }) {
  const [d, setD] = React.useState<Detail | null>(null);
  const [tab, setTab] = React.useState<'timeline' | 'details' | 'tasks' | 'purchases'>('timeline');
  const [note, setNote] = React.useState('');
  const [noteType, setNoteType] = React.useState<'note' | 'call' | 'meeting' | 'email'>('note');
  const [outcome, setOutcome] = React.useState(CALL_OUTCOMES[0]);
  const [edit, setEdit] = React.useState<Record<string, string> | null>(null);
  const [task, setTask] = React.useState({ title: 'Call back', due: toLocal(preset('tomorrow')), priority: 'normal' });
  const [tpl, setTpl] = React.useState(false);
  const [lost, setLost] = React.useState(false);
  const [newTag, setNewTag] = React.useState('');
  const load = React.useCallback(() => api<Detail>(`/api/admin/crm?view=contact&id=${id}`).then((r) => { setD(r); setEdit(null); }).catch((e) => { toast(false, errText(e)); onClose(); }), [id, onClose, toast]);
  React.useEffect(() => { setD(null); load(); }, [load]);
  React.useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);

  async function post(json: Record<string, unknown>, ok?: string) {
    try { await api('/api/admin/crm', { method: 'POST', json: { id, ...json } }); if (ok) toast(true, ok); await load(); onChanged(); return true; } catch (e) { toast(false, errText(e)); return false; }
  }
  const c = d?.contact;
  const lang = c?.language === 'hi' ? 'hi' : 'en';
  async function sendTemplate(t: Tpl, l: 'en' | 'hi') {
    if (!c) return;
    openWhatsApp(c.phone, fill(l === 'hi' ? t.hi : t.en, { name: c.name, moolank: d?.numerology.moolank, bhagyank: d?.numerology.bhagyank, py: d?.numerology.personalYear }));
    setTpl(false); await post({ op: 'activity', type: 'whatsapp', body: `WhatsApp: ${t.label}`, template: t.id }, 'WhatsApp opened – logged on the timeline');
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside role="dialog" aria-modal="true" aria-label="Contact" className="flex h-full w-full max-w-2xl flex-col overflow-hidden border-l bg-card shadow-2xl">
        {!d || !c ? <div className="m-6 h-40 animate-pulse rounded-xl bg-muted" /> : (<>
          <header className="border-b p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="flex items-center gap-2 truncate font-serif text-xl font-semibold">{c.name}<ScorePill n={c.score} /></h3>
                <p className="text-sm text-muted-foreground">{[c.phone, c.email, [c.city, c.state].filter(Boolean).join(', ')].filter(Boolean).join(' · ') || 'No contact details'}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                  {d.numerology.moolank && <span className="rounded bg-gold/15 px-2 py-0.5">Moolank {d.numerology.moolank}</span>}
                  {d.numerology.bhagyank && <span className="rounded bg-gold/15 px-2 py-0.5">Bhagyank {d.numerology.bhagyank}</span>}
                  {d.numerology.personalYear && <span className="rounded bg-gold/15 px-2 py-0.5">Personal Year {d.numerology.personalYear}</span>}
                  {d.numerology.age != null && <span className="rounded bg-muted px-2 py-0.5">Age {d.numerology.age}</span>}
                  <span className="rounded bg-muted px-2 py-0.5">{c.source}</span>
                  {c.waConsent ? <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 text-emerald-600"><ShieldCheck className="h-3 w-3" />WhatsApp consent</span> : <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-2 py-0.5 text-amber-600"><ShieldOff className="h-3 w-3" />No consent</span>}
                  {c.paidOrders > 0 && <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-emerald-600">Paid {inr(c.paidPaise)}</span>}
                </div>
              </div>
              <button onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Select aria-label="Stage" className="h-9 text-sm" value={c.stage} onChange={(e) => { const s = e.target.value as Stage; if (s === 'lost') setLost(true); else post({ op: 'update', stage: s }, `Stage: ${stageOf(s).label}`); }}>{STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</Select>
              <Select aria-label="Priority" className="h-9 text-sm" value={c.priority} onChange={(e) => post({ op: 'update', priority: e.target.value })}><option value="low">Low priority</option><option value="normal">Normal priority</option><option value="high">🔥 High priority</option></Select>
              <Select aria-label="Owner" className="h-9 text-sm" value={c.ownerId ?? ''} onChange={(e) => post({ op: 'update', ownerId: e.target.value || null })}><option value="">Unassigned</option>{owners.map((o) => <option key={o.id} value={o.id}>{o.name ?? o.email}</option>)}</Select>
              <Input aria-label="Expected value in rupees" className="h-9 text-sm" type="number" min={0} placeholder="Value ₹" defaultValue={c.dealValuePaise ? c.dealValuePaise / 100 : ''} onBlur={(e) => { const v = e.target.value ? Number(e.target.value) : null; if ((v == null ? null : Math.round(v * 100)) !== c.dealValuePaise) post({ op: 'update', dealValueRupees: v }, 'Value saved'); }} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {c.phone && <Button size="sm" variant="outline" className="text-emerald-600" onClick={() => setTpl(true)}><MessageCircle />WhatsApp</Button>}
              {c.phone && <a href={`tel:${c.phone}`} onClick={() => { setNoteType('call'); setTab('timeline'); }} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gold/50 px-3 text-xs hover:bg-gold/10"><Phone className="h-4 w-4" />Call</a>}
              {c.email && <a href={`mailto:${c.email}`} onClick={() => setNoteType('email')} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gold/50 px-3 text-xs hover:bg-gold/10"><Mail className="h-4 w-4" />Email</a>}
              <Button size="sm" variant="outline" onClick={() => setTab('tasks')}><CalendarClock />Follow-up{c.nextFollowUpAt && <DueBadge iso={c.nextFollowUpAt} />}</Button>
            </div>
            {c.stage === 'lost' && c.lostReason && <p className="mt-2 text-xs text-rose-500">Lost: {c.lostReason}</p>}
          </header>

          <div className="flex gap-1 border-b px-5 pt-2">{(['timeline', 'details', 'tasks', 'purchases'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn('-mb-px border-b-2 px-3 py-2 text-sm capitalize', tab === t ? 'border-gold font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground')}>
              {t}{t === 'tasks' && d.tasks.filter((x) => !x.doneAt).length > 0 && <span className="ml-1 rounded-full bg-gold/30 px-1.5 text-xs">{d.tasks.filter((x) => !x.doneAt).length}</span>}{t === 'purchases' && d.purchases.length > 0 && <span className="ml-1 text-xs">({d.purchases.length})</span>}
            </button>))}
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {tab === 'timeline' && (<div className="space-y-4">
              <div className="rounded-lg border p-3">
                <div className="mb-2 flex flex-wrap gap-1">{(['note', 'call', 'meeting', 'email'] as const).map((t) => <button key={t} onClick={() => setNoteType(t)} className={cn('rounded-full border px-2.5 py-0.5 text-xs capitalize', noteType === t ? 'border-gold bg-gold/20' : 'hover:bg-muted')}>{t === 'note' ? 'Note' : t === 'call' ? 'Log call' : t === 'meeting' ? 'Consultation / meeting' : 'Email sent'}</button>)}</div>
                {noteType === 'call' && <Select className="mb-2 h-9 text-sm" value={outcome} onChange={(e) => setOutcome(e.target.value)} aria-label="Call outcome">{CALL_OUTCOMES.map((o) => <option key={o}>{o}</option>)}</Select>}
                <textarea rows={3} className="w-full rounded-md border border-input bg-background/70 p-2 text-sm" placeholder={noteType === 'note' ? 'What did you learn? (questions, family situation, budget…)' : 'Details (optional)'} value={note} onChange={(e) => setNote(e.target.value)} maxLength={4000} />
                <div className="mt-2 flex justify-end"><Button size="sm" disabled={noteType === 'note' && !note.trim()} onClick={async () => { const ok = await post({ op: 'activity', type: noteType, body: noteType === 'call' ? `${outcome}${note.trim() ? ` – ${note.trim()}` : ''}` : note.trim(), ...(noteType === 'call' ? { outcome } : {}) }, 'Saved to the timeline'); if (ok) setNote(''); }}>Save</Button></div>
              </div>
              {c.notes && <div className="rounded-lg bg-gold/10 p-3 text-sm"><p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Pinned notes</p><p className="whitespace-pre-wrap">{c.notes}</p></div>}
              <ol className="relative space-y-4 border-l border-border pl-5">
                {d.activities.map((a) => { const Icon = ACT_ICON[a.type] ?? NotebookPen; return (
                  <li key={a.id} className="relative">
                    <span className="absolute -left-[29px] flex h-6 w-6 items-center justify-center rounded-full border bg-card"><Icon className={cn('h-3.5 w-3.5', a.type === 'whatsapp' ? 'text-emerald-600' : a.type === 'stage' ? 'text-gold' : 'text-muted-foreground')} /></span>
                    <p className="text-xs text-muted-foreground"><span className="font-medium capitalize text-foreground">{a.type === 'stage' ? 'Stage changed' : a.type}</span> · {fmtDate(a.createdAt)}{a.by ? ` · ${a.by}` : ''}</p>
                    {a.body && <p className="mt-0.5 whitespace-pre-wrap text-sm">{a.type === 'stage' ? a.body.replace(/\b(new|contacted|interested|consultation|proposal|won|lost)\b/g, (m) => stageOf(m as Stage).short) : a.body}</p>}
                  </li>); })}
                {d.events.map((e, i) => <li key={`e${i}`} className="relative"><span className="absolute -left-[29px] flex h-6 w-6 items-center justify-center rounded-full border bg-card"><Flame className="h-3.5 w-3.5 text-muted-foreground" /></span><p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">{e.eventName}</span> · {fmtDate(e.occurredAt)}</p></li>)}
                <li className="relative"><span className="absolute -left-[29px] flex h-6 w-6 items-center justify-center rounded-full border bg-card"><Plus className="h-3.5 w-3.5 text-muted-foreground" /></span><p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Added to CRM</span> · {fmtDate(c.createdAt)}{c.magnet ? ` · ${c.magnet}` : ''}{c.utmSource ? ` · ${[c.utmSource, c.utmMedium, c.utmCampaign].filter(Boolean).join(' / ')}` : ''}</p></li>
              </ol>
            </div>)}

            {tab === 'details' && (<div className="space-y-5">
              {edit ? (<>
                <ContactForm value={edit} onChange={setEdit} owners={owners} />
                <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setEdit(null)}>Cancel</Button><Button variant="gold" onClick={() => post({ op: 'update', ...toPayload(edit) }, 'Contact updated')}>Save changes</Button></div>
              </>) : (<>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {([['Phone', c.phone], ['Email', c.email], ['Date of birth', c.dob ? `${c.dob.slice(8)}-${c.dob.slice(5, 7)}-${c.dob.slice(0, 4)}` : null], ['Gender', c.gender], ['City', c.city], ['State', c.state], ['Language', c.language === 'hi' ? 'Hindi' : 'English'], ['Interested in', prettyService(c.service)], ['Lead magnet', c.magnet], ['UTM', [c.utmSource, c.utmMedium, c.utmCampaign].filter(Boolean).join(' / ') || null], ['Owner', c.ownerName], ['Last contacted', c.lastContactedAt ? `${fmtDate(c.lastContactedAt)} (${ago(c.lastContactedAt)})` : 'never'], ['In stage since', fmtDate(c.stageChangedAt)], ['Website account', c.userId ? (d.account ? `yes · ${d.account.credits} credits · ${d.reportsCount} report(s) · last login ${ago(d.account.lastLoginAt)}` : 'yes') : 'no']] as [string, string | null][]).map(([k, v]) => <React.Fragment key={k}><dt className="text-muted-foreground">{k}</dt><dd className="break-words">{v || '–'}</dd></React.Fragment>)}
                </dl>
                <div className="flex justify-end"><Button size="sm" variant="outline" onClick={() => setEdit({ name: c.name, phone: c.phone ?? '', email: c.email ?? '', dob: c.dob ?? '', gender: c.gender ?? '', city: c.city ?? '', state: c.state ?? '', language: c.language ?? 'en', source: c.source, service: c.service ?? '', stage: c.stage, priority: c.priority, dealValueRupees: c.dealValuePaise ? String(c.dealValuePaise / 100) : '', ownerId: c.ownerId ?? '', notes: c.notes ?? '' })}><NotebookPen />Edit details</Button></div>
              </>)}
              <section>
                <h4 className="mb-2 text-sm font-semibold">Tags</h4>
                <div className="flex flex-wrap items-center gap-1.5">{c.tags.map((t) => <span key={t.id} className="inline-flex items-center gap-1 rounded-full bg-gold/15 py-0.5 pl-2.5 pr-1 text-xs">{t.name}<button onClick={() => post({ op: 'tag', tag: t.name, remove: true })} aria-label={`Remove ${t.name}`} className="rounded-full p-0.5 hover:bg-rose-500/20"><X className="h-3 w-3" /></button></span>)}
                  <form onSubmit={(e) => { e.preventDefault(); if (newTag.trim()) post({ op: 'tag', tag: newTag.trim() }).then((ok) => ok && setNewTag('')); }} className="flex gap-1"><Input className="h-7 w-32 text-xs" placeholder="Add tag" value={newTag} onChange={(e) => setNewTag(e.target.value)} maxLength={60} /><Button size="sm" variant="ghost" type="submit"><Plus /></Button></form></div>
              </section>
              <section>
                <h4 className="mb-2 text-sm font-semibold">WhatsApp consent (DPDP audit trail)</h4>
                {d.consents.length === 0 ? <p className="text-xs text-muted-foreground">No consent recorded.</p> : <ul className="space-y-1 text-xs">{d.consents.map((x, i) => <li key={i}>{x.channel} · <span className={x.status === 'opted_in' ? 'text-emerald-600' : 'text-rose-500'}>{x.status.replace('_', ' ')}</span> · {x.purpose} · {fmtDate(x.optedInAt)}{x.optedOutAt ? ` → out ${fmtDate(x.optedOutAt)}` : ''}</li>)}</ul>}
                <div className="mt-2">{c.waConsent ? <Button size="sm" variant="ghost" className="text-rose-500" onClick={() => post({ op: 'consent', on: false }, 'Opted out')}><ShieldOff />Client asked to stop (opt out)</Button> : <Button size="sm" variant="ghost" onClick={() => post({ op: 'consent', on: true }, 'Consent recorded')}><ShieldCheck />Record consent given by the client</Button>}</div>
              </section>
              <section className="border-t pt-4"><Button size="sm" variant="ghost" className="text-rose-500" onClick={async () => { if (window.confirm(`Delete ${c.name} and the whole timeline? Payments and invoices are not affected.`)) { if (await post({ op: 'delete' }, 'Contact deleted')) onClose(); } }}><Trash2 />Delete contact</Button></section>
            </div>)}

            {tab === 'tasks' && (<div className="space-y-4">
              <div className="rounded-lg border p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_200px]">
                  <Input aria-label="Task" value={task.title} onChange={(e) => setTask({ ...task, title: e.target.value })} maxLength={200} list="crm-task-titles" />
                  <Input aria-label="Due (IST)" type="datetime-local" value={task.due} onChange={(e) => setTask({ ...task, due: e.target.value })} />
                </div>
                <datalist id="crm-task-titles">{['Call back', 'Send sample report', 'Send payment link', 'Confirm consultation time', 'Deliver report', 'Ask for review', 'Birthday wish'].map((x) => <option key={x} value={x} />)}</datalist>
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  {([['later', 'Later today'], ['tomorrow', 'Tomorrow 11am'], ['3d', 'In 3 days'], ['week', 'Next Monday']] as const).map(([k, l]) => <Button key={k} size="sm" variant="ghost" onClick={() => setTask({ ...task, due: toLocal(preset(k)) })}>{l}</Button>)}
                  <label className="ml-auto flex items-center gap-1 text-xs"><input type="checkbox" className="accent-gold" checked={task.priority === 'high'} onChange={(e) => setTask({ ...task, priority: e.target.checked ? 'high' : 'normal' })} />High</label>
                  <Button size="sm" disabled={task.title.trim().length < 2 || !task.due} onClick={async () => { const ok = await post({ op: 'task', leadId: id, title: task.title.trim(), dueAt: fromLocal(task.due), priority: task.priority }, 'Follow-up added'); if (ok) setTask({ title: 'Call back', due: toLocal(preset('tomorrow')), priority: 'normal' }); }}><Plus />Add follow-up</Button>
                </div>
              </div>
              {d.tasks.length === 0 ? <p className="text-sm text-muted-foreground">No follow-ups yet.</p> : <ul className="space-y-2">{d.tasks.map((t) => (
                <li key={t.id} className="flex items-center gap-3 rounded-lg border p-2.5 text-sm">
                  <button onClick={() => post({ op: 'taskUpdate', id: t.id, done: !t.doneAt })} aria-label={t.doneAt ? 'Mark not done' : 'Mark done'} className={cn('flex h-5 w-5 items-center justify-center rounded-full border-2', t.doneAt ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gold')}>{t.doneAt && <Check className="h-3 w-3" />}</button>
                  <span className={cn('flex-1', t.doneAt && 'line-through opacity-60')}>{t.title}{t.priority === 'high' && <Flame className="ml-1 inline h-3.5 w-3.5 text-rose-500" />}</span>
                  {t.doneAt ? <span className="text-xs text-muted-foreground">done {ago(t.doneAt)}</span> : <><DueBadge iso={t.dueAt} /><span className="text-xs text-muted-foreground">{fmtDate(t.dueAt)}</span></>}
                  <button onClick={() => post({ op: 'taskDelete', id: t.id })} aria-label="Delete follow-up" className="rounded p-1 hover:bg-rose-500/20"><Trash2 className="h-3.5 w-3.5" /></button>
                </li>))}</ul>}
            </div>)}

            {tab === 'purchases' && (<div className="space-y-4">
              {!c.userId && <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">This contact has no website account yet, so there are no online payments to show. When they sign up with the same mobile or email, Sync links them automatically.</p>}
              {d.purchases.length > 0 && <table className="w-full text-sm"><thead><tr className="text-left text-xs uppercase text-muted-foreground"><th className="pb-1">Date</th><th>Plan / service</th><th>Status</th><th>Invoice</th><th className="text-right">Amount</th></tr></thead>
                <tbody>{d.purchases.map((p) => <tr key={p.id} className="border-t border-border/40"><td className="py-1.5">{fmtDate(p.at, false)}</td><td>{prettyService(p.plan)}</td><td><Badge tone={p.status === 'paid' ? 'good' : p.status === 'failed' ? 'bad' : 'default'}>{p.status}</Badge></td><td className="text-xs">{p.invoice ?? '–'}</td><td className="text-right tabular-nums">{p.currency && p.currency !== 'INR' ? `$${(p.amountPaise / 100).toFixed(2)}` : inr(p.amountPaise)}</td></tr>)}</tbody></table>}
              {d.orders.length > 0 && <section><h4 className="mb-2 text-sm font-semibold">Expert service orders</h4><ul className="space-y-1 text-sm">{d.orders.map((o) => <li key={o.id} className="flex justify-between rounded border p-2"><span>{prettyService(o.service)}</span><span className="text-xs">{o.status.replace('_', ' ')} · {fmtDate(o.at, false)}{o.deliveredAt ? ` · delivered ${fmtDate(o.deliveredAt, false)}` : ''}</span></li>)}</ul></section>}
              {c.userId && d.purchases.length === 0 && d.orders.length === 0 && <p className="text-sm text-muted-foreground">No payments yet.</p>}
            </div>)}
          </div>
        </>)}

        {tpl && c && (
          <Modal title={`WhatsApp ${c.name}`} onClose={() => setTpl(false)} wide>
            {!c.waConsent && <p className="mb-3 rounded-md bg-amber-500/15 p-2 text-xs text-amber-700 dark:text-amber-400">No WhatsApp consent is recorded. Reply to their own enquiry is fine; avoid promotional messages until they agree.</p>}
            <div className="grid gap-2 sm:grid-cols-2">{TEMPLATES.map((t) => (
              <div key={t.id} className="rounded-lg border p-3">
                <p className="mb-1 text-sm font-semibold">{t.label}</p>
                <p className="mb-2 line-clamp-3 text-xs text-muted-foreground">{fill(lang === 'hi' ? t.hi : t.en, { name: c.name, moolank: d?.numerology.moolank, bhagyank: d?.numerology.bhagyank, py: d?.numerology.personalYear })}</p>
                <div className="flex gap-1"><Button size="sm" variant={lang === 'en' ? 'gold' : 'outline'} onClick={() => sendTemplate(t, 'en')}>English</Button><Button size="sm" variant={lang === 'hi' ? 'gold' : 'outline'} onClick={() => sendTemplate(t, 'hi')}>हिंदी</Button></div>
              </div>))}
            </div>
            <div className="mt-3 flex justify-end"><Button size="sm" variant="ghost" onClick={async () => { openWhatsApp(c.phone, ''); setTpl(false); await post({ op: 'activity', type: 'whatsapp', body: 'WhatsApp chat opened' }); }}>Open chat without a template</Button></div>
          </Modal>
        )}
        {lost && c && <LostDialog name={c.name} onClose={() => setLost(false)} onPick={(r) => { setLost(false); post({ op: 'update', stage: 'lost', lostReason: r }, 'Marked lost'); }} />}
      </aside>
    </div>
  );
}
