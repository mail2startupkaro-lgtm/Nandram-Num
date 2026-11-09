'use client';
import * as React from 'react';
import { Plus, Save, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { Badge } from '@/components/ui/misc';
import { api, ApiError } from '@/lib/client/api';
import { cn } from '@/lib/utils';

type Expert = {
  id: string; email: string | null; phone: string | null; name: string | null; role: string; credits: number; disabledAt: string | null; createdAt: string; lastLoginAt: string | null;
  proUntil: string | null; plan: string | null; brandName: string | null; expertName: string | null; expertTitle: string | null; contactLine: string | null; website: string | null; bookingUrl: string | null;
  hasLogo: boolean; hasPhoto: boolean; hasSignature: boolean; clients: number; reports: number; customers: number;
};
const ERR: Record<string, string> = { USER_NOT_FOUND: 'No account found with this email or mobile. The person must sign up first.', CANNOT_DEMOTE_SELF: 'You cannot change your own role.', EXPERT_NAME_REQUIRED: 'Expert name is required.' };
const EMPTY = { identifier: '', expertName: '', expertTitle: '', brandName: '', contactLine: '', website: '', bookingUrl: '' };
const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString('en-IN') : '—');

export function ExpertsTab() {
  const [q, setQ] = React.useState('');
  const [rows, setRows] = React.useState<Expert[] | null>(null);
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [form, setForm] = React.useState(EMPTY);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [edit, setEdit] = React.useState(EMPTY);

  const load = React.useCallback(() => api<{ experts: Expert[] }>(`/api/admin/experts?q=${encodeURIComponent(q)}`).then((r) => setRows(r.experts)).catch(() => setRows([])), [q]);
  React.useEffect(() => { const h = setTimeout(load, 250); return () => clearTimeout(h); }, [load]);
  const run = async (fn: () => Promise<unknown>, ok = 'Saved') => {
    setMsg(null);
    try { await fn(); setMsg({ ok: true, text: ok }); await load(); }
    catch (e) { setMsg({ ok: false, text: e instanceof ApiError ? (ERR[e.body.error ?? ''] ?? e.body.issues?.map((i) => i.message).join(' · ') ?? e.message) : 'Something went wrong' }); }
  };
  const startEdit = (x: Expert) => { setEditId(x.id); setEdit({ identifier: '', expertName: x.expertName ?? x.name ?? '', expertTitle: x.expertTitle ?? '', brandName: x.brandName ?? '', contactLine: x.contactLine ?? '', website: x.website ?? '', bookingUrl: x.bookingUrl ?? '' }); };
  const fields = (v: typeof EMPTY, set: (n: typeof EMPTY) => void, p: string) => (
    <div className="grid gap-3 md:grid-cols-3">
      <Field label="Expert name" htmlFor={`${p}-en`} required><Input id={`${p}-en`} value={v.expertName} onChange={(e) => set({ ...v, expertName: e.target.value })} /></Field>
      <Field label="Expert title" htmlFor={`${p}-et`}><Input id={`${p}-et`} placeholder="e.g. Numerologist & Vedic Consultant" value={v.expertTitle} onChange={(e) => set({ ...v, expertTitle: e.target.value })} /></Field>
      <Field label="Brand name" htmlFor={`${p}-bn`} hint="Blank uses the expert name"><Input id={`${p}-bn`} value={v.brandName} onChange={(e) => set({ ...v, brandName: e.target.value })} /></Field>
      <Field label="Contact line" htmlFor={`${p}-cl`}><Input id={`${p}-cl`} value={v.contactLine} onChange={(e) => set({ ...v, contactLine: e.target.value })} /></Field>
      <Field label="Website" htmlFor={`${p}-w`}><Input id={`${p}-w`} value={v.website} onChange={(e) => set({ ...v, website: e.target.value })} /></Field>
      <Field label="Booking link" htmlFor={`${p}-bl`}><Input id={`${p}-bl`} value={v.bookingUrl} onChange={(e) => set({ ...v, bookingUrl: e.target.value })} /></Field>
    </div>
  );
  const body = (v: typeof EMPTY) => ({ expertName: v.expertName, expertTitle: v.expertTitle, brandName: v.brandName || undefined, contactLine: v.contactLine, website: v.website, bookingUrl: v.bookingUrl });

  return (
    <section className="glass space-y-4 rounded-lg p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="flex items-center gap-2 text-xl font-semibold"><UserCheck className="h-5 w-5 text-gold" />Experts</h2><p className="text-sm text-muted-foreground">{rows ? `${rows.length} listed` : 'Loading…'} · accounts with the expert role or saved expert branding.</p></div>
        <Button variant="gold" onClick={() => setAdding(!adding)}><Plus /> {adding ? 'Close' : 'Add expert'}</Button>
      </div>
      {adding && (
        <div className="space-y-3 rounded-md border border-gold/40 bg-gold/5 p-4">
          <Field label="Account email or mobile" htmlFor="x-id" required hint="The person must already have an account on the site."><Input id="x-id" value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} /></Field>
          {fields(form, setForm, 'x')}
          <Button variant="gold" disabled={form.identifier.trim().length < 5 || form.expertName.trim().length < 2}
            onClick={() => run(async () => { await api('/api/admin/experts', { method: 'POST', json: { identifier: form.identifier, ...body(form) } }); setForm(EMPTY); setAdding(false); }, 'Expert added')}><Save /> Save expert</Button>
        </div>
      )}
      <Input placeholder="Search name, brand, email or mobile…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
      {msg && <p className={cn('text-sm', msg.ok ? 'text-success' : 'text-danger')} role="status">{msg.text}</p>}
      {rows && rows.length === 0 && <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No experts yet. Use “Add expert” to list one.</p>}
      <div className="space-y-3">
        {rows?.map((x) => {
          const pro = x.proUntil && new Date(x.proUntil) > new Date();
          return (
            <div key={x.id} className={cn('rounded-lg border border-border p-4', x.disabledAt && 'opacity-60')}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-lg font-semibold">{x.expertName ?? x.name ?? '—'} {x.expertTitle && <span className="text-sm font-normal text-muted-foreground">· {x.expertTitle}</span>}</p>
                  <p className="text-sm text-muted-foreground">{x.brandName ?? 'No brand set'} · {x.email ?? x.phone}{x.email && x.phone ? ` · ${x.phone}` : ''}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge>{x.role}</Badge>{pro ? <Badge>Pro until {fmt(x.proUntil)}</Badge> : <Badge>No Pro plan</Badge>}{x.disabledAt && <Badge>Disabled</Badge>}
                    {x.hasLogo && <Badge>Logo</Badge>}{x.hasPhoto && <Badge>Photo</Badge>}{x.hasSignature && <Badge>Signature</Badge>}
                  </div>
                </div>
                <dl className="grid grid-cols-4 gap-x-5 text-center text-xs text-muted-foreground">
                  {([['Clients', x.clients], ['Reports', x.reports], ['Customers', x.customers], ['Credits', x.credits]] as const).map(([k, n]) => <div key={k}><dd className="font-serif text-xl font-bold text-foreground">{n}</dd><dt>{k}</dt></div>)}
                </dl>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Joined {fmt(x.createdAt)} · Last login {fmt(x.lastLoginAt)}{x.bookingUrl ? ` · Booking: ${x.bookingUrl}` : ''}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => (editId === x.id ? setEditId(null) : startEdit(x))}>{editId === x.id ? 'Close' : 'Edit details'}</Button>
                <Button size="sm" variant="ghost" onClick={() => run(() => api('/api/admin/users', { method: 'PATCH', json: { id: x.id, disabled: !x.disabledAt } }), x.disabledAt ? 'Enabled' : 'Disabled')}>{x.disabledAt ? 'Enable' : 'Disable'}</Button>
                {x.role === 'expert' && <Button size="sm" variant="ghost" className="text-danger" onClick={() => { if (window.confirm('Remove expert status? The account becomes a normal customer.')) run(() => api('/api/admin/experts', { method: 'PATCH', json: { id: x.id, removeExpert: true } }), 'Removed from experts'); }}>Remove expert</Button>}
              </div>
              {editId === x.id && (
                <div className="mt-3 space-y-3 border-t border-border pt-3">
                  {fields(edit, setEdit, `e${x.id}`)}
                  <Button variant="gold" size="sm" disabled={edit.expertName.trim().length < 2} onClick={() => run(async () => { await api('/api/admin/experts', { method: 'PATCH', json: { id: x.id, ...body(edit) } }); setEditId(null); })}><Save /> Save changes</Button>
                  <p className="text-xs text-muted-foreground">Logo, photo and signature are managed by the expert under Settings → Branding.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
