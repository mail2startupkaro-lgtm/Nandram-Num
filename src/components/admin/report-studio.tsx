'use client';
/** Admin → Report generator: build a fully customised, service-tailored report for any client, verify it, edit the text, download the PDF. */
import * as React from 'react';
import { AlertTriangle, Check, CheckCircle2, FileDown, FileText, Info, RefreshCw, ShieldCheck, Sparkles, X, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select } from '@/components/ui/form';
import { Badge } from '@/components/ui/misc';
import { api, ApiError, download } from '@/lib/client/api';
import { SERVICE_PRESETS, getServicePreset, type ServicePreset } from '@/lib/billing/service-presets';
import type { Order } from '@/components/admin/services-admin';
import { cn } from '@/lib/utils';

const MODULES = [
  { id: 'complete', label: 'Complete life report (all)' }, { id: 'dob', label: 'Date of birth' }, { id: 'name', label: 'Name numerology' },
  { id: 'mobile', label: 'Mobile number' }, { id: 'couple', label: 'Couple compatibility' },
] as const;

const CHAPTERS = [
  { id: 'glance', label: 'Numbers at a glance' }, { id: 'core', label: 'Moolank & Bhagyank' }, { id: 'grid', label: 'Lo Shu grid' }, { id: 'kua', label: 'Kua & directions' },
  { id: 'timing', label: 'Timing & forecast' }, { id: 'life', label: 'Career, love & wellbeing' }, { id: 'name', label: 'Name numerology' },
  { id: 'numbers', label: 'Mobile & Aadhaar' }, { id: 'couple', label: 'Couple compatibility' }, { id: 'remedies', label: 'Remedies' },
];

const THEMES = ['royal-gold-maroon', 'cosmic-blue', 'saffron-cream', 'minimal-white'];
const CONCERNS = ['career', 'business', 'money', 'marriage', 'love', 'health', 'children', 'education', 'foreignTravel', 'property', 'legal'];
const today = () => new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);

type CheckItem = { level: 'ok' | 'info' | 'warn' | 'error'; label: string; detail: string };
type Num = { compound: number; single: number; master: number | null };
type Preview = {
  summary: {
    clientName: string; dob: string; age: number; asOf: string; engineVersion: string; moolank: { value: number; compound: number; master: number | null }; bhagyank: { value: number; compound: number; master: number | null };
    kua: number; kuaGroup: string; loShu: Record<string, number>; missing: number[]; repeated: number[]; personal: { personalYear: number; personalMonth: number; personalDay: number };
    lifeAreas: Record<string, number>; name: { chaldean: Num; pythagorean: Num; score: number; needsCorrection: boolean } | null;
    mobile: { masked: string; total: Num; score: number; verdict: string } | null; couple: { overall: number; partner: string } | null;
  };
  checks: CheckItem[]; writer: 'ai' | 'offline'; sections: { id: string; title: string; text: string; warnings: string[] }[];
};

const LO_SHU = [[4, 9, 2], [3, 5, 7], [8, 1, 6]];
const ICON = { ok: CheckCircle2, info: Info, warn: AlertTriangle, error: XCircle };
const TONE = { ok: 'text-success', info: 'text-muted-foreground', warn: 'text-warning', error: 'text-danger' };

function formatDobForInput(val?: string | null): string {
  if (!val) return '';
  const s = val.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.split('-').reverse().join('-');
  return s;
}

export function ReportStudio({
  preloadedOrder,
  onClearPreloadedOrder,
}: {
  preloadedOrder?: Order | null;
  onClearPreloadedOrder?: () => void;
} = {}) {
  const [selectedServiceCode, setSelectedServiceCode] = React.useState<string>('SVC_PERSONAL_REPORT');
  const [recentOrders, setRecentOrders] = React.useState<Order[] | null>(null);
  const [selectedOrderId, setSelectedOrderId] = React.useState<string>('');
  const [activeOrderBanner, setActiveOrderBanner] = React.useState<{ id: string; name: string; service: string } | null>(null);

  const [c, setC] = React.useState({
    fullName: '', commonName: '', hindiName: '', gender: 'male', kuaBasis: '', dob: '', timeOfBirth: '', placeOfBirth: '', mobile: '',
    maritalStatus: '', profession: '', city: '', state: '', concerns: [] as string[],
    partnerName: '', partnerGender: 'female', partnerDob: '',
  });

  const defaultPreset = getServicePreset('SVC_PERSONAL_REPORT')!;
  const [o, setO] = React.useState({
    serviceCode: defaultPreset.code,
    reportTitle: defaultPreset.reportTitle,
    modules: defaultPreset.modules as string[],
    language: 'en',
    theme: 'royal-gold-maroon',
    asOf: today(),
    reportDate: today(),
    useAi: true,
    hidden: CHAPTERS.map((ch) => ch.id).filter((id) => !defaultPreset.includedChapters.includes(id)),
    note: '',
    watermark: '',
    brandName: '',
    expertName: '',
    expertTitle: '',
    contactLine: '',
    bookingUrl: '',
  });

  const [p, setP] = React.useState<Preview | null>(null);
  const [edits, setEdits] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState<'' | 'preview' | 'pdf'>('');
  const [err, setErr] = React.useState<string | null>(null);
  const [confirmed, setConfirmed] = React.useState(false);

  const setCv = (k: keyof typeof c, v: unknown) => { setC((prev) => ({ ...prev, [k]: v })); setP(null); setConfirmed(false); };
  const setOv = (k: keyof typeof o, v: unknown) => setO((prev) => ({ ...prev, [k]: v }));

  // Load saved expert branding from local storage
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('report-studio-expert');
      if (raw) {
        const v = JSON.parse(raw) as { expertName?: string; expertTitle?: string };
        setO((prev) => ({ ...prev, expertName: prev.expertName || v.expertName || '', expertTitle: prev.expertTitle || v.expertTitle || '' }));
      }
    } catch { /* storage unavailable */ }
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem('report-studio-expert', JSON.stringify({ expertName: o.expertName, expertTitle: o.expertTitle }));
    } catch { /* storage unavailable */ }
  }, [o.expertName, o.expertTitle]);

  // Load list of recent service orders so admin can pick one anytime
  React.useEffect(() => {
    api<{ orders: Order[] }>('/api/admin/service-orders?status=all')
      .then((r) => setRecentOrders(r.orders))
      .catch(() => setRecentOrders([]));
  }, []);

  // Apply service preset template
  const applyPreset = React.useCallback((code: string) => {
    setSelectedServiceCode(code);
    setP(null);
    setConfirmed(false);

    if (code === 'CUSTOM') {
      setO((prev) => ({ ...prev, serviceCode: '', reportTitle: 'Custom Numerology Report' }));
      return;
    }

    const preset = getServicePreset(code);
    if (!preset) return;

    const hidden = CHAPTERS.map((ch) => ch.id).filter((id) => !preset.includedChapters.includes(id));
    setO((prev) => ({
      ...prev,
      serviceCode: preset.code,
      reportTitle: preset.reportTitle,
      modules: preset.modules,
      hidden,
    }));
  }, []);

  // Preload order details
  const loadOrder = React.useCallback((ord: Order) => {
    const d = ord.details;
    const clientName = d.clientName || d.currentName || '';
    const currentName = d.currentName || d.clientName || '';
    const dob = formatDobForInput(d.dob);
    const partnerDob = formatDobForInput(d.partnerDob);
    const gender = (d.gender as 'male' | 'female' | 'other') || 'male';
    const partnerGender = gender === 'male' ? 'female' : 'male';

    setC((prev) => ({
      ...prev,
      fullName: clientName,
      commonName: currentName,
      dob,
      gender,
      mobile: d.mobile || '',
      timeOfBirth: d.tob || '',
      placeOfBirth: d.pob || '',
      partnerName: d.partnerName || '',
      partnerDob,
      partnerGender,
      profession: d.profession || '',
    }));

    if (d.questions?.trim()) {
      setO((prev) => ({
        ...prev,
        note: prev.note ? `${prev.note}\n\nClient questions:\n${d.questions}` : `Client questions:\n${d.questions}`,
      }));
    }

    setSelectedOrderId(ord.id);
    const preset = getServicePreset(ord.serviceCode);
    const serviceLabel = preset?.label || ord.serviceCode;
    setActiveOrderBanner({ id: ord.id, name: clientName || 'Client', service: serviceLabel });

    if (preset) {
      applyPreset(preset.code);
    }
  }, [applyPreset]);

  // Handle passed-in preloaded order prop
  React.useEffect(() => {
    if (preloadedOrder) {
      loadOrder(preloadedOrder);
    }
  }, [preloadedOrder, loadOrder]);

  function clearLoadedOrder() {
    setSelectedOrderId('');
    setActiveOrderBanner(null);
    onClearPreloadedOrder?.();
  }

  function payload(action: 'preview' | 'pdf') {
    const input: Record<string, unknown> = {
      fullName: c.fullName, gender: c.gender, dob: c.dob, concerns: c.concerns, language: o.language,
      ...Object.fromEntries((['commonName', 'hindiName', 'timeOfBirth', 'placeOfBirth', 'mobile', 'maritalStatus', 'profession', 'city', 'state', 'kuaBasis'] as const).filter((k) => c[k].trim()).map((k) => [k, c[k].trim()])),
    };
    if (c.partnerName.trim() && c.partnerDob.trim()) input.partner = { name: c.partnerName.trim(), gender: c.partnerGender, dob: c.partnerDob.trim() };
    const branding = Object.fromEntries((['brandName', 'expertName', 'expertTitle', 'contactLine', 'bookingUrl'] as const).filter((k) => o[k].trim()).map((k) => [k, o[k].trim()]));
    return {
      action, input, modules: o.modules, language: o.language, theme: o.theme, asOf: o.asOf || undefined, reportDate: o.reportDate || undefined, useAi: o.useAi,
      hiddenChapters: o.hidden, expertNote: o.note || undefined, watermark: o.watermark || undefined, branding, sectionEdits: action === 'pdf' ? edits : {},
      reportTitle: o.reportTitle || undefined, serviceCode: o.serviceCode || undefined,
    };
  }

  const errText = (e: unknown) => (e instanceof ApiError ? (e.body.issues?.map((i) => `${i.path ? `${i.path}: ` : ''}${i.message}`).join(' · ') || e.message) : 'Something went wrong');

  async function preview() {
    setBusy('preview'); setErr(null);
    try { const r = await api<Preview>('/api/admin/report-studio', { method: 'POST', json: payload('preview') }); setP(r); setEdits({}); setConfirmed(false); }
    catch (e) { setErr(errText(e)); } finally { setBusy(''); }
  }

  async function pdf() {
    setBusy('pdf'); setErr(null);
    try { await download('/api/admin/report-studio', { method: 'POST', json: payload('pdf') }); }
    catch (e) { setErr(errText(e)); } finally { setBusy(''); }
  }

  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const errors = p?.checks.filter((x) => x.level === 'error').length ?? 0;
  const warns = p?.checks.filter((x) => x.level === 'warn').length ?? 0;
  const ta = 'w-full rounded-md border border-input bg-background/70 p-3 text-sm';

  const currentPreset = getServicePreset(selectedServiceCode);
  const isKeyField = (fieldName: string) => currentPreset?.keyFields.includes(fieldName);

  return (
    <div className="space-y-6">
      {/* 0 · Service-wise report generation option */}
      <section className="glass rounded-xl border border-gold/40 bg-gold/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Sparkles className="h-5 w-5 text-gold" /> Service-wise Report Generation
            </h2>
            <p className="text-sm text-muted-foreground">
              Select the service to automatically configure report modules, chapters, and cover branding.
            </p>
          </div>
          {activeOrderBanner && (
            <div className="flex items-center gap-2 rounded-full border border-success/40 bg-success/10 px-3 py-1 text-xs font-medium text-success">
              <span>Order #{activeOrderBanner.id.slice(0, 8)} · {activeOrderBanner.name} ({activeOrderBanner.service})</span>
              <button onClick={clearLoadedOrder} title="Clear loaded order" className="hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Service preset selector grid */}
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICE_PRESETS.map((preset) => {
            const isSelected = selectedServiceCode === preset.code;
            return (
              <button
                key={preset.code}
                type="button"
                onClick={() => applyPreset(preset.code)}
                className={cn(
                  'flex flex-col rounded-lg border p-3 text-left transition-all',
                  isSelected
                    ? 'border-gold bg-gold/20 shadow-sm'
                    : 'border-border/60 bg-background/50 hover:border-gold/50 hover:bg-muted/50'
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-lg">{preset.icon}</span>
                  <Badge tone={isSelected ? 'gold' : undefined} className="text-[10px]">
                    {preset.badge}
                  </Badge>
                </div>
                <p className="mt-2 text-sm font-semibold leading-tight">{preset.label}</p>
                <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{preset.description}</p>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => applyPreset('CUSTOM')}
            className={cn(
              'flex flex-col justify-center rounded-lg border p-3 text-left transition-all',
              selectedServiceCode === 'CUSTOM'
                ? 'border-gold bg-gold/20 shadow-sm'
                : 'border-border/60 bg-background/50 hover:border-gold/50 hover:bg-muted/50'
            )}
          >
            <span className="text-lg">⚙️</span>
            <p className="mt-2 text-sm font-semibold">Custom / All Modules</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Manually choose any combination of modules and chapters.</p>
          </button>
        </div>

        {/* Preset active hint box */}
        {currentPreset && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gold/30 bg-background/60 p-3 text-xs">
            <div className="flex items-center gap-2">
              <Badge tone="good"><Check className="h-3 w-3" /> {currentPreset.label}</Badge>
              <span className="text-muted-foreground">
                Target: <b className="text-foreground">{currentPreset.reportTitle}</b> · {currentPreset.includedChapters.length} chapters included
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {currentPreset.includedChapters.map((ch) => (
                <span key={ch} className="rounded bg-gold/15 px-2 py-0.5 text-[11px] text-gold font-medium">
                  {CHAPTERS.find((c) => c.id === ch)?.label || ch}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Load from Paid Service Orders */}
        {recentOrders && recentOrders.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pre-fill from paid client order:
            </span>
            <Select
              value={selectedOrderId}
              onChange={(e) => {
                const ord = recentOrders.find((o) => o.id === e.target.value);
                if (ord) loadOrder(ord);
              }}
              className="h-8 max-w-md text-xs"
              aria-label="Select client order"
            >
              <option value="">— Select a client order to load details —</option>
              {recentOrders.map((ord) => {
                const name = ord.details.clientName || ord.details.currentName || 'Client';
                const service = getServicePreset(ord.serviceCode)?.label || ord.serviceCode;
                const date = new Date(ord.createdAt).toLocaleDateString('en-IN');
                return (
                  <option key={ord.id} value={ord.id}>
                    {name} · {service} · ₹{(ord.payment.amountPaise / 100).toLocaleString('en-IN')} ({date})
                  </option>
                );
              })}
            </Select>
            {activeOrderBanner && (
              <Button size="sm" variant="ghost" onClick={clearLoadedOrder} className="h-8 text-xs">
                Clear pre-fill
              </Button>
            )}
          </div>
        )}
      </section>

      {/* 1 · Client details */}
      <section className="glass rounded-lg p-5">
        <h2 className="text-xl font-semibold">1 · Client details</h2>
        <p className="mb-4 text-sm text-muted-foreground">Nothing here is saved – the report is calculated fresh and downloaded. Dates as DD-MM-YYYY.</p>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Full name (as per documents)" htmlFor="s-fn" required className={cn(isKeyField('fullName') && 'rounded-md p-1 bg-gold/5 border border-gold/30')}><Input id="s-fn" value={c.fullName} onChange={(e) => setCv('fullName', e.target.value)} /></Field>
          <Field label="Commonly used name" htmlFor="s-cn" hint="Used for name number & signature" className={cn(isKeyField('commonName') && 'rounded-md p-1 bg-gold/5 border border-gold/30')}><Input id="s-cn" value={c.commonName} onChange={(e) => setCv('commonName', e.target.value)} /></Field>
          <Field label="Name in Hindi" htmlFor="s-hn"><Input id="s-hn" value={c.hindiName} onChange={(e) => setCv('hindiName', e.target.value)} /></Field>
          <Field label="Date of birth" htmlFor="s-dob" required className={cn(isKeyField('dob') && 'rounded-md p-1 bg-gold/5 border border-gold/30')}><Input id="s-dob" placeholder="DD-MM-YYYY" value={c.dob} onChange={(e) => setCv('dob', e.target.value)} /></Field>
          <Field label="Gender" htmlFor="s-g"><Select id="s-g" value={c.gender} onChange={(e) => setCv('gender', e.target.value)}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></Select></Field>
          <Field label="Kua formula" htmlFor="s-k" hint="Leave on auto unless gender is Other"><Select id="s-k" value={c.kuaBasis} onChange={(e) => setCv('kuaBasis', e.target.value)}><option value="">Auto (from gender)</option><option value="male">Male formula</option><option value="female">Female formula</option></Select></Field>
          <Field label="Mobile number" htmlFor="s-m" className={cn(isKeyField('mobile') && 'rounded-md p-1 bg-gold/5 border border-gold/30')}><Input id="s-m" inputMode="numeric" value={c.mobile} onChange={(e) => setCv('mobile', e.target.value)} /></Field>
          <Field label="Time of birth (HH:MM)" htmlFor="s-t"><Input id="s-t" placeholder="14:30" value={c.timeOfBirth} onChange={(e) => setCv('timeOfBirth', e.target.value)} /></Field>
          <Field label="Place of birth" htmlFor="s-pob"><Input id="s-pob" value={c.placeOfBirth} onChange={(e) => setCv('placeOfBirth', e.target.value)} /></Field>
          <Field label="Marital status" htmlFor="s-ms"><Select id="s-ms" value={c.maritalStatus} onChange={(e) => setCv('maritalStatus', e.target.value)}><option value="">—</option>{['single', 'married', 'engaged', 'divorced', 'widowed'].map((x) => <option key={x} value={x}>{x}</option>)}</Select></Field>
          <Field label="Profession" htmlFor="s-pr" className={cn(isKeyField('profession') && 'rounded-md p-1 bg-gold/5 border border-gold/30')}><Input id="s-pr" value={c.profession} onChange={(e) => setCv('profession', e.target.value)} /></Field>
          <Field label="City / State" htmlFor="s-city"><div className="flex gap-2"><Input id="s-city" placeholder="City" value={c.city} onChange={(e) => setCv('city', e.target.value)} /><Input aria-label="State" placeholder="State" value={c.state} onChange={(e) => setCv('state', e.target.value)} /></div></Field>
        </div>
        <div className="mt-3"><p className="mb-1.5 text-sm font-medium">Focus areas</p><div className="flex flex-wrap gap-2">{CONCERNS.map((x) => (
          <button key={x} type="button" onClick={() => setCv('concerns', toggle(c.concerns, x))} className={cn('rounded-full border px-3 py-1 text-xs', c.concerns.includes(x) ? 'border-gold bg-gold/20' : 'border-border hover:bg-muted')}>{x}</button>
        ))}</div></div>
        <div className="mt-4 grid gap-3 rounded-md border border-gold/40 bg-gold/5 p-3 md:grid-cols-3">
          <Field label="Report prepared by (Numerology expert name)" htmlFor="s-exp" hint="Printed on the cover, signature and closing. Remembered for next time."><Input id="s-exp" placeholder="e.g. Acharya Nandram" value={o.expertName} onChange={(e) => setOv('expertName', e.target.value)} /></Field>
          <Field label="Expert title (optional)" htmlFor="s-expt"><Input id="s-expt" placeholder="e.g. Numerologist & Vedic Consultant" value={o.expertTitle} onChange={(e) => setOv('expertTitle', e.target.value)} /></Field>
        </div>
        <div className={cn('mt-4 grid gap-3 rounded-md border p-3 md:grid-cols-3', isKeyField('partnerName') ? 'border-gold/60 bg-gold/5' : 'border-border')}>
          <Field label="Partner name (for couple report)" htmlFor="s-pn"><Input id="s-pn" value={c.partnerName} onChange={(e) => setCv('partnerName', e.target.value)} /></Field>
          <Field label="Partner gender" htmlFor="s-pg"><Select id="s-pg" value={c.partnerGender} onChange={(e) => setCv('partnerGender', e.target.value)}><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></Select></Field>
          <Field label="Partner date of birth" htmlFor="s-pd"><Input id="s-pd" placeholder="DD-MM-YYYY" value={c.partnerDob} onChange={(e) => setCv('partnerDob', e.target.value)} /></Field>
        </div>
      </section>

      {/* 2 · Report settings */}
      <section className="glass rounded-lg p-5">
        <h2 className="mb-4 text-xl font-semibold">2 · Report settings</h2>
        <div className="mb-4">
          <Field label="Report title printed on cover & running header" htmlFor="o-title" hint="Auto-filled from service preset, can be customized.">
            <Input id="o-title" value={o.reportTitle} onChange={(e) => setOv('reportTitle', e.target.value)} className="font-medium" />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-1.5 text-sm font-medium">Report modules</p>
            <div className="space-y-1.5">{MODULES.map((m) => (
              <Checkbox key={m.id} id={`mod-${m.id}`} label={m.label} checked={o.modules.includes(m.id)} onChange={(v) => {
                const next = m.id === 'complete' ? (v ? ['complete'] : ['dob']) : toggle(o.modules.filter((x) => x !== 'complete'), m.id);
                setO({ ...o, modules: next.length ? next : ['dob'] }); setP(null);
              }} />
            ))}</div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Language" htmlFor="o-l"><Select id="o-l" value={o.language} onChange={(e) => { setOv('language', e.target.value); setP(null); }}><option value="en">English</option><option value="hi">Hindi</option><option value="hinglish">Hinglish</option></Select></Field>
            <Field label="PDF theme" htmlFor="o-t"><Select id="o-t" value={o.theme} onChange={(e) => setOv('theme', e.target.value)}>{THEMES.map((x) => <option key={x} value={x}>{x}</option>)}</Select></Field>
            <Field label="Forecast as of" htmlFor="o-a" hint="Personal year/month counted from this date"><Input id="o-a" type="date" value={o.asOf} onChange={(e) => { setOv('asOf', e.target.value); setP(null); }} /></Field>
            <Field label="Date printed on report" htmlFor="o-r"><Input id="o-r" type="date" value={o.reportDate} onChange={(e) => setOv('reportDate', e.target.value)} /></Field>
            <Field label="Watermark (optional)" htmlFor="o-w"><Input id="o-w" placeholder="e.g. DRAFT" value={o.watermark} onChange={(e) => setOv('watermark', e.target.value)} /></Field>
            <div className="flex items-end"><Checkbox id="o-ai" label="Use AI writer (falls back to offline)" checked={o.useAi} onChange={(v) => { setOv('useAi', v); setP(null); }} /></div>
          </div>
        </div>
        <div className="mt-4">
          <p className="mb-1.5 text-sm font-medium">Chapters to include</p>
          <div className="flex flex-wrap gap-2">{CHAPTERS.map((ch) => (
            <button key={ch.id} type="button" onClick={() => setOv('hidden', toggle(o.hidden, ch.id))} className={cn('rounded-full border px-3 py-1 text-xs', o.hidden.includes(ch.id) ? 'border-border text-muted-foreground line-through' : 'border-gold bg-gold/20 font-medium')}>{ch.label}</button>
          ))}</div>
          <p className="mt-1 text-xs text-muted-foreground">Chapters without data (e.g. no partner for couple) are skipped automatically.</p>
        </div>
        <details className="mt-4 rounded-md border border-border p-3">
          <summary className="cursor-pointer text-sm font-medium">Branding for this report (optional – blank uses your saved branding)</summary>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {([['brandName', 'Brand name'], ['contactLine', 'Contact line'], ['bookingUrl', 'Booking link (QR code)']] as const).map(([k, l]) => (
              <Field key={k} label={l} htmlFor={`b-${k}`}><Input id={`b-${k}`} value={o[k]} onChange={(e) => setOv(k, e.target.value)} /></Field>
            ))}
          </div>
        </details>
        <Field label="Personal note from the expert (printed in the closing chapter)" htmlFor="o-n" className="mt-4"><textarea id="o-n" rows={3} className={ta} value={o.note} onChange={(e) => setOv('note', e.target.value)} /></Field>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="gold" onClick={preview} disabled={!!busy || c.fullName.trim().length < 2 || !c.dob.trim()}>{busy === 'preview' ? <RefreshCw className="animate-spin" /> : <ShieldCheck />} Calculate & check accuracy</Button>
          {err && <p className="text-sm text-danger" role="alert">{err}</p>}
        </div>
      </section>

      {p && (
        <>
          <section className="glass rounded-lg p-5">
            <div className="mb-4 flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold">3 · Verify</h2>
              {errors ? <Badge tone="bad">{errors} error(s)</Badge> : <Badge tone="good">core numbers verified</Badge>}{warns > 0 && <Badge tone="warn">{warns} to review</Badge>}
              <Badge>{p.writer === 'ai' ? 'AI writer' : 'offline writer'}</Badge><Badge>engine v{p.summary.engineVersion}</Badge></div>
            <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[['Moolank', p.summary.moolank.value, p.summary.moolank.compound], ['Bhagyank', p.summary.bhagyank.value, p.summary.bhagyank.compound], ['Kua', p.summary.kua, p.summary.kuaGroup],
                    ['Personal year', p.summary.personal.personalYear, p.summary.asOf], ['Name (Chaldean)', p.summary.name?.chaldean.single ?? '—', p.summary.name?.chaldean.compound ?? ''], ['Mobile', p.summary.mobile?.total.single ?? '—', p.summary.mobile ? `score ${p.summary.mobile.score}` : '']].map(([k, v, sub]) => (
                    <div key={String(k)} className="rounded-md border border-border p-2"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</p><p className="font-serif text-2xl font-bold text-gold">{v}</p><p className="text-[10px] text-muted-foreground">{sub}</p></div>
                  ))}
                </div>
                <div className="flex gap-4">
                  <div className="grid grid-cols-3 gap-1">{LO_SHU.flat().map((n) => (
                    <div key={n} className={cn('grid h-12 w-12 place-items-center rounded border text-sm font-semibold', p.summary.loShu[n] ? 'border-gold/60 bg-gold/15' : 'border-dashed border-border text-muted-foreground')}>{p.summary.loShu[n] ? String(n).repeat(p.summary.loShu[n]) : n}</div>
                  ))}</div>
                  <div className="text-xs text-muted-foreground"><p className="mb-1 font-medium text-foreground">Lo Shu</p><p>Missing: {p.summary.missing.join(', ') || 'none'}</p><p>Repeated: {p.summary.repeated.join(', ') || 'none'}</p>
                    {p.summary.couple && <p className="mt-2">Couple with {p.summary.couple.partner}: {p.summary.couple.overall}</p>}</div>
                </div>
              </div>
              <ul className="space-y-1.5 text-sm">{p.checks.map((x, i) => { const I = ICON[x.level]; return (
                <li key={i} className="flex gap-2"><I className={cn('mt-0.5 h-4 w-4 shrink-0', TONE[x.level])} /><span><b>{x.label}.</b> <span className="text-muted-foreground">{x.detail}</span></span></li>
              ); })}</ul>
            </div>
          </section>

          <section className="glass rounded-lg p-5">
            <h2 className="text-xl font-semibold">4 · Edit the report text</h2>
            <p className="mb-4 text-sm text-muted-foreground">Change any section before downloading. Keep numbers the same as the calculations above.</p>
            <div className="space-y-3">{p.sections.map((s) => (
              <details key={s.id} className="rounded-md border border-border p-3" open={s.warnings.length > 0}>
                <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium">{s.title}{edits[s.id] !== undefined && edits[s.id] !== s.text && <Badge tone="gold">edited</Badge>}{s.warnings.length > 0 && <Badge tone="warn">check</Badge>}</summary>
                <textarea rows={8} className={cn(ta, 'mt-2')} value={edits[s.id] ?? s.text} onChange={(e) => setEdits({ ...edits, [s.id]: e.target.value })} />
                {edits[s.id] !== undefined && edits[s.id] !== s.text && <button type="button" className="text-xs text-muted-foreground underline" onClick={() => { const n = { ...edits }; delete n[s.id]; setEdits(n); }}>Undo changes</button>}
              </details>
            ))}</div>
          </section>

          <section className="glass rounded-lg p-5">
            <h2 className="mb-3 text-xl font-semibold">5 · Download</h2>
            <Checkbox id="confirm" checked={confirmed} onChange={setConfirmed} label={<>I have confirmed the date of birth ({p.summary.dob.split('-').reverse().join('-')}) and name spelling with the client.</>} />
            <Button className="mt-4" variant="gold" onClick={pdf} disabled={!!busy || !confirmed || errors > 0}>{busy === 'pdf' ? <RefreshCw className="animate-spin" /> : <FileDown />} Generate PDF</Button>
            {errors > 0 && <p className="mt-2 text-sm text-danger">Fix the errors above before generating.</p>}
          </section>
        </>
      )}
    </div>
  );
}
