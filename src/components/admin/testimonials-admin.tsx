'use client';
/** Admin → Testimonials: add, edit, reorder, hide or delete the client reviews shown in the slider on every page. */
import * as React from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, ExternalLink, Plus, Save, Star, Trash2, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { Badge } from '@/components/ui/misc';
import { api, ApiError } from '@/lib/client/api';
import { cn } from '@/lib/utils';
import { serviceLabel, TESTIMONIAL_SERVICES, type Testimonial, type TestimonialSettings } from '@/lib/testimonials';

const blank = (): Testimonial => ({ id: `t${Date.now().toString(36)}`, name: '', gender: 'female', location: '', service: 'general', quoteEn: '', quoteHi: '', rating: null, consent: false, active: true });

export function TestimonialsAdmin() {
  const [s, setS] = React.useState<TestimonialSettings | null>(null);
  const [saved, setSaved] = React.useState<string>('');
  const [editing, setEditing] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => { api<{ testimonials: TestimonialSettings }>('/api/admin/settings').then((r) => { setS(r.testimonials); setSaved(JSON.stringify(r.testimonials)); }).catch(() => setMsg({ ok: false, text: 'Could not load testimonials.' })); }, []);
  if (!s) return <div className="glass h-40 animate-pulse rounded-xl" aria-busy="true" />;
  const dirty = JSON.stringify(s) !== saved;
  const upd = (id: string, p: Partial<Testimonial>) => setS({ ...s, items: s.items.map((t) => (t.id === id ? { ...t, ...p } : t)) });
  const move = (i: number, d: number) => { const items = [...s.items]; const j = i + d; if (j < 0 || j >= items.length) return; [items[i], items[j]] = [items[j], items[i]]; setS({ ...s, items }); };
  const live = s.items.filter((t) => t.active && t.consent).length;

  async function save() {
    const bad = s!.items.find((t) => t.name.trim().length < 2 || t.quoteEn.trim().length < 10);
    if (bad) { setEditing(bad.id); setMsg({ ok: false, text: 'Each testimonial needs a name and the review text.' }); return; }
    setBusy(true); setMsg(null);
    try { await api('/api/admin/settings', { method: 'PUT', json: { key: 'testimonials', value: s } }); setSaved(JSON.stringify(s)); setMsg({ ok: true, text: `Saved. ${live} testimonial(s) are live on every page.` }); }
    catch (e) { setMsg({ ok: false, text: e instanceof ApiError ? e.message : 'Save failed.' }); } finally { setBusy(false); }
  }

  return (
    <div className="space-y-5">
      <section className="glass rounded-xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-semibold">Testimonials</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Shown as an animated slider (“What Our Clients Say About Us”) above the footer on every public page. On a service page that service’s reviews come first. Only publish reviews written by real clients who agreed to be shown – Indian consumer rules (CCPA / IS 19000:2022) treat invented or edited reviews as misleading.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-gold" checked={s.enabled} onChange={(e) => setS({ ...s, enabled: e.target.checked })} />Show slider</label>
            <Button variant="outline" onClick={() => { const n = blank(); setS({ ...s, items: [n, ...s.items] }); setEditing(n.id); }}><Plus />Add testimonial</Button>
            <Button variant="gold" onClick={save} disabled={!dirty || busy}><Save />{busy ? 'Saving…' : 'Save'}</Button>
            {dirty && <Button variant="ghost" onClick={() => { setS(JSON.parse(saved)); setEditing(null); }}><Undo2 />Undo</Button>}
          </div>
        </div>
        <p className="mt-3 text-sm"><Badge tone="gold">{live} live</Badge> <span className="text-muted-foreground">of {s.items.length} · </span><a href="/" target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-gold hover:underline">See it on the site<ExternalLink className="h-3 w-3" /></a></p>
        {msg && <p className={cn('mt-2 text-sm', msg.ok ? 'text-success' : 'text-danger')} role="status">{msg.text}</p>}
      </section>

      <ul className="space-y-3">
        {s.items.map((t, i) => {
          const open = editing === t.id; const isLive = t.active && t.consent;
          return (
            <li key={t.id} className={cn('glass rounded-xl p-4', !isLive && 'opacity-70')}>
              <div className="flex flex-wrap items-start gap-3">
                <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold text-white', t.gender === 'female' ? 'bg-gradient-to-br from-rose-500 to-amber-500' : 'bg-gradient-to-br from-indigo-600 to-amber-500')}>{t.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?'}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{t.name || 'New testimonial'} <span className="text-xs font-normal text-muted-foreground">{t.gender === 'female' ? 'Female' : 'Male'}{t.location ? ` · ${t.location}` : ''} · {serviceLabel(t.service).en}</span>
                    {t.rating ? <span className="ml-1 inline-flex items-center text-xs text-gold">{t.rating}<Star className="ml-0.5 h-3 w-3 fill-gold" /></span> : null}
                    {' '}{isLive ? <Badge tone="good">Live</Badge> : !t.consent ? <Badge tone="warn">No permission</Badge> : <Badge>Hidden</Badge>}</p>
                  {!open && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">“{t.quoteEn}”</p>}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp /></Button>
                  <Button size="icon" variant="ghost" onClick={() => move(i, 1)} disabled={i === s.items.length - 1} aria-label="Move down"><ArrowDown /></Button>
                  <Button size="icon" variant="ghost" onClick={() => upd(t.id, { active: !t.active })} aria-label={t.active ? 'Hide' : 'Show'} title={t.active ? 'Hide from the site' : 'Show on the site'}>{t.active ? <Eye /> : <EyeOff />}</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(open ? null : t.id)}>{open ? 'Close' : 'Edit'}</Button>
                  <Button size="icon" variant="ghost" className="text-rose-500" onClick={() => { if (window.confirm(`Delete the testimonial from ${t.name || 'this client'}?`)) setS({ ...s, items: s.items.filter((x) => x.id !== t.id) }); }} aria-label="Delete"><Trash2 /></Button>
                </div>
              </div>
              {open && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Field label="Client name" htmlFor={`n-${t.id}`} required hint="First name + surname initial is enough, e.g. “Priya V.”"><Input id={`n-${t.id}`} value={t.name} maxLength={60} onChange={(e) => upd(t.id, { name: e.target.value })} /></Field>
                  <Field label="City / country" htmlFor={`l-${t.id}`}><Input id={`l-${t.id}`} value={t.location} maxLength={60} onChange={(e) => upd(t.id, { location: e.target.value })} placeholder="Jaipur, India" /></Field>
                  <Field label="Client" htmlFor={`g-${t.id}`}><Select id={`g-${t.id}`} value={t.gender} onChange={(e) => upd(t.id, { gender: e.target.value as Testimonial['gender'] })}><option value="female">Female</option><option value="male">Male</option></Select></Field>
                  <Field label="Service" htmlFor={`s-${t.id}`} hint="Shown first on that service’s page"><Select id={`s-${t.id}`} value={t.service} onChange={(e) => upd(t.id, { service: e.target.value as Testimonial['service'] })}>{TESTIMONIAL_SERVICES.map((x) => <option key={x.id} value={x.id}>{x.en}</option>)}</Select></Field>
                  <Field label="Review (client’s own words)" htmlFor={`q-${t.id}`} required className="sm:col-span-2"><textarea id={`q-${t.id}`} rows={3} maxLength={600} className="w-full rounded-md border border-input bg-background/70 p-2 text-sm" value={t.quoteEn} onChange={(e) => upd(t.id, { quoteEn: e.target.value })} /></Field>
                  <Field label="Hindi version (optional)" htmlFor={`h-${t.id}`} hint="Only if the client wrote it in Hindi or approved the translation; otherwise the original is shown in both languages." className="sm:col-span-2"><textarea id={`h-${t.id}`} rows={2} maxLength={600} className="w-full rounded-md border border-input bg-background/70 p-2 text-sm" value={t.quoteHi} onChange={(e) => upd(t.id, { quoteHi: e.target.value })} /></Field>
                  <Field label="Star rating given by the client" htmlFor={`r-${t.id}`}><Select id={`r-${t.id}`} value={t.rating ?? ''} onChange={(e) => upd(t.id, { rating: e.target.value ? Number(e.target.value) : null })}><option value="">No rating (don’t show stars)</option>{[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} ★</option>)}</Select></Field>
                  <label className="flex items-start gap-2 pt-6 text-sm"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-gold" checked={t.consent} onChange={(e) => upd(t.id, { consent: e.target.checked })} />This is a real client review and the client agreed to it being published.</label>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {dirty && <div className="sticky bottom-4 flex justify-end"><Button variant="gold" onClick={save} disabled={busy} className="shadow-xl"><Save />Save changes</Button></div>}
    </div>
  );
}
