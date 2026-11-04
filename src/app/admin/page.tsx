'use client';
import * as React from 'react';
import { BookOpen, CreditCard, LayoutDashboard, Palette, Receipt, Save, ScrollText, Tag, Users, Wand2 } from 'lucide-react';
import { useApp } from '@/components/layout/providers';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { Badge } from '@/components/ui/misc';
import { api, ApiError } from '@/lib/client/api';
import { cn } from '@/lib/utils';

const inr = (p: number) => `₹${(p / 100).toLocaleString('en-IN', { minimumFractionDigits: p % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
const THEMES = ['royal-gold-maroon', 'cosmic-blue', 'saffron-cream', 'minimal-white'];
const SECTIONS = ['intro', 'moolank', 'bhagyank', 'combination', 'loshu', 'missing', 'kua', 'forecast', 'lifePeriods', 'career', 'relationships', 'wellbeing', 'name', 'mobile', 'aadhaar', 'couple', 'remedies', 'closing'];
const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard }, { id: 'users', label: 'Users', icon: Users }, { id: 'plans', label: 'Plans', icon: CreditCard },
  { id: 'coupons', label: 'Coupons', icon: Tag }, { id: 'knowledge', label: 'Knowledge base', icon: BookOpen }, { id: 'themes', label: 'PDF themes', icon: Palette },
  { id: 'prompts', label: 'Writer prompts', icon: Wand2 }, { id: 'seller', label: 'Invoice settings', icon: ScrollText }, { id: 'payments', label: 'Payments', icon: Receipt },
] as const;

function useMsg() {
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const wrap = async (fn: () => Promise<unknown>, ok = 'Saved') => { setMsg(null); try { await fn(); setMsg({ ok: true, text: ok }); } catch (e) { setMsg({ ok: false, text: e instanceof ApiError ? e.message : 'Something went wrong' }); } };
  const node = msg ? <p className={cn('text-sm', msg.ok ? 'text-success' : 'text-danger')} role="status">{msg.text}</p> : null;
  return { wrap, node };
}

export default function AdminPage() {
  const { me } = useApp();
  const [tab, setTab] = React.useState<(typeof TABS)[number]['id']>('overview');
  if (me && me.user?.role !== 'super_admin') return <div className="container py-12"><p className="glass rounded-lg p-6">Admins only.</p></div>;
  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">Admin</h1>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="glass flex gap-1 overflow-x-auto rounded-lg p-2 lg:flex-col">
          {TABS.map((x) => (
            <button key={x.id} onClick={() => setTab(x.id)} className={cn('flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-left text-sm', tab === x.id ? 'bg-gold/20 font-semibold' : 'hover:bg-muted')}>
              <x.icon className="h-4 w-4 text-gold" />{x.label}
            </button>
          ))}
        </nav>
        <div className="min-w-0">
          {tab === 'overview' && <Overview />}{tab === 'users' && <UsersTab />}{tab === 'plans' && <PlansTab />}{tab === 'coupons' && <CouponsTab />}
          {tab === 'knowledge' && <KnowledgeTab />}{tab === 'themes' && <ThemesTab />}{tab === 'prompts' && <PromptsTab />}{tab === 'seller' && <SellerTab />}{tab === 'payments' && <PaymentsTab />}
        </div>
      </div>
    </div>
  );
}

const Card = ({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) => (
  <section className={cn('glass rounded-lg p-5', className)}>{title && <h2 className="mb-4 text-xl font-semibold">{title}</h2>}{children}</section>
);

function Bars({ data }: { data: { label: string; value: number; display?: string }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-1.5">
      {data.map((d) => (
        <div key={d.label} className="grid grid-cols-[90px_1fr_80px] items-center gap-2 text-sm">
          <span className="truncate text-muted-foreground">{d.label}</span>
          <span className="h-3 rounded bg-muted"><span className="block h-3 rounded bg-gradient-to-r from-maroon to-gold" style={{ width: `${(d.value / max) * 100}%` }} /></span>
          <span className="text-right tabular-nums">{d.display ?? d.value}</span>
        </div>
      ))}
      {!data.length && <p className="text-sm text-muted-foreground">No data yet.</p>}
    </div>
  );
}

function Overview() {
  type O = { totals: Record<string, number>; byModule: { module: string; n: number }[]; byPlan: { plan: string; n: number; paise: number }[]; revenueByMonth: { month: string; paise: number }[]; reportsByDay: { day: string; n: number }[] };
  const [o, setO] = React.useState<O | null>(null);
  React.useEffect(() => { api<O>('/api/admin/overview').then(setO); }, []);
  if (!o) return <div className="h-40 animate-pulse rounded-lg bg-muted" />;
  const stats = [['Users', o.totals.users], ['Experts', o.totals.experts], ['Active Pro', o.totals.activePro], ['Client profiles', o.totals.profiles], ['Reports', o.totals.reports], ['Reports (30 days)', o.totals.reports30], ['Paid orders', o.totals.paid], ['Revenue', inr(o.totals.revenue)]];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{stats.map(([k, v]) => <div key={k} className="glass rounded-lg p-4"><p className="text-xs uppercase tracking-wider text-muted-foreground">{k}</p><p className="font-serif text-2xl font-bold text-gold">{v}</p></div>)}</div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Revenue by month"><Bars data={o.revenueByMonth.map((m) => ({ label: m.month, value: m.paise, display: inr(m.paise) }))} /></Card>
        <Card title="Popular report types"><Bars data={o.byModule.map((m) => ({ label: m.module, value: m.n }))} /></Card>
        <Card title="Sales by plan"><Bars data={o.byPlan.map((m) => ({ label: m.plan, value: m.paise, display: `${m.n} · ${inr(m.paise)}` }))} /></Card>
        <Card title="Reports – last 30 days"><Bars data={o.reportsByDay.slice(-10).map((m) => ({ label: m.day.slice(5), value: m.n }))} /></Card>
      </div>
    </div>
  );
}

function UsersTab() {
  type U = { id: string; email: string | null; phone: string | null; name: string | null; role: string; credits: number; disabledAt: string | null; proUntil: string | null; profiles: number; lastLoginAt: string | null };
  const [q, setQ] = React.useState('');
  const [rows, setRows] = React.useState<U[]>([]);
  const { wrap, node } = useMsg();
  const load = React.useCallback(() => api<{ users: U[] }>(`/api/admin/users?q=${encodeURIComponent(q)}`).then((r) => setRows(r.users)), [q]);
  React.useEffect(() => { const h = setTimeout(load, 250); return () => clearTimeout(h); }, [load]);
  const patch = (body: object) => wrap(async () => { await api('/api/admin/users', { method: 'PATCH', json: body }); await load(); });
  return (
    <Card title="Users">
      <Input placeholder="Search email, name or mobile…" value={q} onChange={(e) => setQ(e.target.value)} className="mb-4 max-w-sm" />
      {node}
      <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-sm">
        <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2">User</th><th>Role</th><th>Credits</th><th>Pro until</th><th>Clients</th><th>Actions</th></tr></thead>
        <tbody>{rows.map((u) => (
          <tr key={u.id} className={cn('border-b border-border/50', u.disabledAt && 'opacity-50')}>
            <td className="py-2"><b>{u.name ?? '—'}</b><br /><span className="text-xs text-muted-foreground">{u.email ?? u.phone}</span></td>
            <td><Select value={u.role} onChange={(e) => patch({ id: u.id, role: e.target.value })} className="h-8 w-32 text-xs"><option value="customer">customer</option><option value="expert">expert</option><option value="super_admin">super_admin</option></Select></td>
            <td className="tabular-nums">{u.credits}</td>
            <td className="text-xs">{u.proUntil && new Date(u.proUntil) > new Date() ? new Date(u.proUntil).toLocaleDateString('en-IN') : '—'}</td>
            <td>{u.profiles}</td>
            <td className="space-x-1 whitespace-nowrap">
              <Button size="sm" variant="ghost" onClick={() => patch({ id: u.id, addCredits: 1 })}>+1 credit</Button>
              <Button size="sm" variant="ghost" onClick={() => patch({ id: u.id, proDays: 30 })}>Pro 30d</Button>
              <Button size="sm" variant="ghost" className="text-danger" onClick={() => patch({ id: u.id, disabled: !u.disabledAt })}>{u.disabledAt ? 'Enable' : 'Disable'}</Button>
            </td>
          </tr>
        ))}</tbody>
      </table></div>
    </Card>
  );
}

function PlansTab() {
  type P = { code: string; name: string; description: string; pricePaise: number; intervalDays: number | null; credits: number; active: boolean; sort: number; features: { fullReports: boolean; whiteLabel: boolean; bulk: boolean; share: boolean; watermark: boolean; maxProfiles: number | null } };
  const [plans, setPlans] = React.useState<P[]>([]);
  const { wrap, node } = useMsg();
  React.useEffect(() => { api<{ plans: P[] }>('/api/admin/plans').then((r) => setPlans(r.plans)); }, []);
  const upd = (i: number, patch: Partial<P>) => setPlans(plans.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  return (
    <Card title="Plans (prices include GST)">
      {node}
      <div className="space-y-4">{plans.map((p, i) => (
        <div key={p.code} className="grid gap-3 rounded-md border border-border p-3 md:grid-cols-6">
          <Field label="Code"><Input value={p.code} disabled /></Field>
          <Field label="Name" className="md:col-span-2"><Input value={p.name} onChange={(e) => upd(i, { name: e.target.value })} /></Field>
          <Field label="Price ₹"><Input type="number" value={p.pricePaise / 100} onChange={(e) => upd(i, { pricePaise: Math.round(Number(e.target.value) * 100) })} /></Field>
          <Field label="Days (blank = one-time)"><Input type="number" value={p.intervalDays ?? ''} onChange={(e) => upd(i, { intervalDays: e.target.value ? Number(e.target.value) : null })} /></Field>
          <Field label="Credits"><Input type="number" value={p.credits} onChange={(e) => upd(i, { credits: Number(e.target.value) })} /></Field>
          <Field label="Description" className="md:col-span-4"><Input value={p.description} onChange={(e) => upd(i, { description: e.target.value })} /></Field>
          <div className="flex flex-wrap items-end gap-3 text-xs md:col-span-2">
            {(['fullReports', 'whiteLabel', 'bulk', 'share'] as const).map((f) => <label key={f} className="flex items-center gap-1"><input type="checkbox" checked={p.features[f]} onChange={(e) => upd(i, { features: { ...p.features, [f]: e.target.checked } })} />{f}</label>)}
            <label className="flex items-center gap-1"><input type="checkbox" checked={p.active} onChange={(e) => upd(i, { active: e.target.checked })} />active</label>
          </div>
          <div className="md:col-span-6"><Button size="sm" onClick={() => wrap(() => api('/api/admin/plans', { method: 'PUT', json: p }))}><Save /> Save {p.code}</Button></div>
        </div>
      ))}</div>
    </Card>
  );
}

function CouponsTab() {
  type C = { code: string; percentOff: number | null; amountOffPaise: number | null; maxUses: number | null; used: number; planCodes: string[] | null; expiresAt: string | null; active: boolean };
  const [rows, setRows] = React.useState<C[]>([]);
  const [f, setF] = React.useState({ code: '', kind: 'percent', value: 10, maxUses: '', expires: '', plans: '' });
  const { wrap, node } = useMsg();
  const load = () => api<{ coupons: C[] }>('/api/admin/coupons').then((r) => setRows(r.coupons));
  React.useEffect(() => { load(); }, []);
  return (
    <Card title="Coupons">
      <div className="mb-4 grid gap-3 md:grid-cols-6">
        <Field label="Code"><Input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} placeholder="DIWALI20" /></Field>
        <Field label="Type"><Select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}><option value="percent">% off</option><option value="amount">₹ off</option></Select></Field>
        <Field label="Value"><Input type="number" value={f.value} onChange={(e) => setF({ ...f, value: Number(e.target.value) })} /></Field>
        <Field label="Max uses"><Input type="number" value={f.maxUses} onChange={(e) => setF({ ...f, maxUses: e.target.value })} /></Field>
        <Field label="Expires"><Input type="date" value={f.expires} onChange={(e) => setF({ ...f, expires: e.target.value })} /></Field>
        <Field label="Plans (comma, blank = all)"><Input value={f.plans} onChange={(e) => setF({ ...f, plans: e.target.value.toUpperCase() })} /></Field>
      </div>
      <Button onClick={() => wrap(async () => {
        await api('/api/admin/coupons', { method: 'POST', json: {
          code: f.code, percentOff: f.kind === 'percent' ? f.value : null, amountOffPaise: f.kind === 'amount' ? Math.round(f.value * 100) : null,
          maxUses: f.maxUses ? Number(f.maxUses) : null, expiresAt: f.expires ? new Date(`${f.expires}T23:59:59+05:30`).toISOString() : null,
          planCodes: f.plans ? f.plans.split(',').map((s) => s.trim()).filter(Boolean) : null,
        } });
        await load();
      }, 'Coupon saved')}><Tag /> Save coupon</Button>
      <div className="mt-2">{node}</div>
      <table className="mt-4 w-full text-sm"><tbody>{rows.map((c) => (
        <tr key={c.code} className="border-b border-border/50">
          <td className="py-2 font-mono font-semibold">{c.code}</td><td>{c.percentOff ? `${c.percentOff}%` : inr(c.amountOffPaise ?? 0)}</td>
          <td>{c.used}{c.maxUses ? ` / ${c.maxUses}` : ''} used</td><td className="text-xs">{c.planCodes?.join(', ') ?? 'all plans'}</td>
          <td className="text-xs">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-IN') : 'no expiry'}</td>
          <td><Button size="sm" variant="ghost" onClick={() => wrap(async () => { await api('/api/admin/coupons', { method: 'PATCH', json: { code: c.code, active: !c.active } }); await load(); })}>{c.active ? <Badge tone="good">active</Badge> : <Badge>inactive</Badge>}</Button></td>
        </tr>
      ))}</tbody></table>
    </Card>
  );
}

function KnowledgeTab() {
  type E = { key: string; title: string; body: string; defaultBody: string; edited: boolean; custom: boolean; tags: string[] };
  const [lang, setLang] = React.useState('en');
  const [entries, setEntries] = React.useState<E[]>([]);
  const [q, setQ] = React.useState('');
  const [sel, setSel] = React.useState<E | null>(null);
  const { wrap, node } = useMsg();
  const load = React.useCallback(() => api<{ entries: E[] }>(`/api/admin/knowledge?lang=${lang}`).then((r) => setEntries(r.entries)), [lang]);
  React.useEffect(() => { load(); }, [load]);
  const shown = entries.filter((e) => !q || `${e.key} ${e.title} ${e.body}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <Card title="Knowledge base – your interpretations">
      <p className="mb-3 text-sm text-muted-foreground">The report writer builds every section on these notes. Edits apply to new reports immediately (cached reports refresh automatically). Avoid digits in notes – numbers come from the calculations.</p>
      <div className="mb-3 flex flex-wrap gap-2"><Select value={lang} onChange={(e) => { setLang(e.target.value); setSel(null); }} className="w-36"><option value="en">English</option><option value="hi">Hindi</option><option value="hinglish">Hinglish</option></Select><Input placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <Button variant="outline" onClick={() => setSel({ key: 'CUSTOM_', title: '', body: '', defaultBody: '', edited: false, custom: true, tags: [] })}>New entry</Button></div>
      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <ul className="max-h-[520px] space-y-0.5 overflow-y-auto rounded-md border border-border p-1 text-sm">
          {shown.map((e) => <li key={e.key}><button onClick={() => setSel(e)} className={cn('flex w-full items-center justify-between rounded px-2 py-1 text-left', sel?.key === e.key ? 'bg-gold/20' : 'hover:bg-muted')}><span className="truncate font-mono text-xs">{e.key}</span>{e.edited && <Badge tone="gold">edited</Badge>}</button></li>)}
        </ul>
        {sel ? (
          <div className="space-y-3">
            <Field label="Key"><Input value={sel.key} disabled={!sel.custom || sel.edited} onChange={(e) => setSel({ ...sel, key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') })} /></Field>
            <Field label="Title"><Input value={sel.title} onChange={(e) => setSel({ ...sel, title: e.target.value })} /></Field>
            <Field label="Interpretation"><textarea rows={8} className="w-full rounded-md border border-input bg-background/70 p-3 text-sm" value={sel.body} onChange={(e) => setSel({ ...sel, body: e.target.value })} /></Field>
            {sel.defaultBody && sel.body !== sel.defaultBody && <p className="text-xs text-muted-foreground"><b>Default:</b> {sel.defaultBody}</p>}
            <div className="flex gap-2">
              <Button onClick={() => wrap(async () => { await api('/api/admin/knowledge', { method: 'PUT', json: { key: sel.key, language: lang, title: sel.title, body: sel.body } }); await load(); })}><Save /> Save</Button>
              {sel.edited && <Button variant="ghost" onClick={() => wrap(async () => { await api(`/api/admin/knowledge?key=${sel.key}&lang=${lang}`, { method: 'DELETE' }); setSel(null); await load(); }, 'Reverted to default')}>Revert to default</Button>}
            </div>
            {node}
          </div>
        ) : <p className="text-sm text-muted-foreground">Select an entry to edit.</p>}
      </div>
    </Card>
  );
}

type Settings = { seller: Record<string, string>; themes: { defaultTheme: string; enabled: string[]; overrides: Record<string, { primary?: string; accent?: string; border?: string }> }; prompts: { extraStyleRules: string; sectionBriefs: Record<string, string> } };
function useSettings() {
  const [s, setS] = React.useState<Settings | null>(null);
  React.useEffect(() => { api<Settings>('/api/admin/settings').then(setS); }, []);
  return [s, setS] as const;
}

function ThemesTab() {
  const [s, setS] = useSettings();
  const { wrap, node } = useMsg();
  if (!s) return <div className="h-40 animate-pulse rounded-lg bg-muted" />;
  const th = s.themes;
  const setTh = (v: Partial<Settings['themes']>) => setS({ ...s, themes: { ...th, ...v } });
  return (
    <Card title="PDF themes">
      <div className="space-y-3">{THEMES.map((id) => (
        <div key={id} className="flex flex-wrap items-center gap-4 rounded-md border border-border p-3 text-sm">
          <label className="flex w-48 items-center gap-2"><input type="checkbox" checked={th.enabled.includes(id)} onChange={(e) => setTh({ enabled: e.target.checked ? [...th.enabled, id] : th.enabled.filter((x) => x !== id) })} />{id}</label>
          <label className="flex items-center gap-2"><input type="radio" name="def" checked={th.defaultTheme === id} onChange={() => setTh({ defaultTheme: id })} />default</label>
          {(['primary', 'accent', 'border'] as const).map((c) => (
            <label key={c} className="flex items-center gap-1 text-xs">{c}<input type="color" value={th.overrides[id]?.[c] ?? '#888888'} onChange={(e) => setTh({ overrides: { ...th.overrides, [id]: { ...(th.overrides[id] ?? {}), [c]: e.target.value } } })} /></label>
          ))}
          {th.overrides[id] && <Button size="sm" variant="ghost" onClick={() => { const o = { ...th.overrides }; delete o[id]; setTh({ overrides: o }); }}>reset colours</Button>}
        </div>
      ))}</div>
      <Button className="mt-4" onClick={() => wrap(() => api('/api/admin/settings', { method: 'PUT', json: { key: 'themes', value: th } }))}><Save /> Save themes</Button>
      <div className="mt-2">{node}</div>
    </Card>
  );
}

function PromptsTab() {
  const [s, setS] = useSettings();
  const { wrap, node } = useMsg();
  const [section, setSection] = React.useState('intro');
  if (!s) return <div className="h-40 animate-pulse rounded-lg bg-muted" />;
  const p = s.prompts;
  return (
    <Card title="Report writer – prompt templates">
      <Field label="House style rules (added to the writer's style guide)" hint="Example: Always begin remedies with a Ganesh vandana. Prefer 'upay' over 'remedy' in Hinglish.">
        <textarea rows={6} className="w-full rounded-md border border-input bg-background/70 p-3 text-sm" value={p.extraStyleRules} onChange={(e) => setS({ ...s, prompts: { ...p, extraStyleRules: e.target.value } })} />
      </Field>
      <div className="mt-4 grid gap-3 md:grid-cols-[200px_1fr]">
        <Select value={section} onChange={(e) => setSection(e.target.value)}>{SECTIONS.map((x) => <option key={x} value={x}>{x}{p.sectionBriefs[x] ? ' ✎' : ''}</option>)}</Select>
        <textarea rows={4} placeholder="Leave blank to use the built-in brief for this section." className="w-full rounded-md border border-input bg-background/70 p-3 text-sm" value={p.sectionBriefs[section] ?? ''}
          onChange={(e) => { const b = { ...p.sectionBriefs, [section]: e.target.value }; if (!e.target.value) delete b[section]; setS({ ...s, prompts: { ...p, sectionBriefs: b } }); }} />
      </div>
      <Button className="mt-4" onClick={() => wrap(() => api('/api/admin/settings', { method: 'PUT', json: { key: 'prompts', value: p } }))}><Save /> Save prompts</Button>
      <div className="mt-2">{node}</div>
    </Card>
  );
}

function SellerTab() {
  const [s, setS] = useSettings();
  const { wrap, node } = useMsg();
  if (!s) return <div className="h-40 animate-pulse rounded-lg bg-muted" />;
  const v = s.seller;
  const fields: [string, string][] = [['legalName', 'Legal business name'], ['gstin', 'GSTIN'], ['address', 'Registered address'], ['state', 'State'], ['stateCode', 'State code (2 digits)'], ['sac', 'SAC code (confirm with your CA)'], ['email', 'Billing email'], ['phone', 'Phone'], ['invoicePrefix', 'Invoice prefix']];
  return (
    <Card title="Invoice / GST settings">
      <div className="grid gap-3 md:grid-cols-2">{fields.map(([k, label]) => <Field key={k} label={label}><Input value={v[k] ?? ''} onChange={(e) => setS({ ...s, seller: { ...v, [k]: e.target.value } })} /></Field>)}</div>
      <Button className="mt-4" onClick={() => wrap(() => api('/api/admin/settings', { method: 'PUT', json: { key: 'seller', value: v } }))}><Save /> Save</Button>
      <div className="mt-2">{node}</div>
    </Card>
  );
}

function PaymentsTab() {
  type P = { id: string; planCode: string; status: string; amountPaise: number; discountPaise: number; couponCode: string | null; invoiceNumber: string | null; createdAt: string; email: string | null; phone: string | null };
  const [rows, setRows] = React.useState<P[]>([]);
  React.useEffect(() => { api<{ payments: P[] }>('/api/admin/payments').then((r) => setRows(r.payments)); }, []);
  return (
    <Card title="Payments">
      <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-sm">
        <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2">Date</th><th>Customer</th><th>Plan</th><th>Amount</th><th>Coupon</th><th>Status</th><th>Invoice</th></tr></thead>
        <tbody>{rows.map((p) => (
          <tr key={p.id} className="border-b border-border/50">
            <td className="py-2">{new Date(p.createdAt).toLocaleDateString('en-IN')}</td><td className="text-xs">{p.email ?? p.phone}</td><td>{p.planCode}</td>
            <td>{inr(p.amountPaise)}{p.discountPaise ? <span className="text-xs text-muted-foreground"> (-{inr(p.discountPaise)})</span> : null}</td><td className="font-mono text-xs">{p.couponCode ?? ''}</td>
            <td><Badge tone={p.status === 'paid' ? 'good' : p.status === 'failed' ? 'bad' : 'default'}>{p.status}</Badge></td>
            <td>{p.invoiceNumber && <a className="text-gold underline" href={`/api/billing/invoices/${p.id}`}>{p.invoiceNumber}</a>}</td>
          </tr>
        ))}</tbody>
      </table></div>
    </Card>
  );
}
