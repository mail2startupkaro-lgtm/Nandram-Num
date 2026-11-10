'use client';
import * as React from 'react';
import { Mail, MessageCircle, Phone, RefreshCw, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/form';
import { Badge } from '@/components/ui/misc';
import { api } from '@/lib/client/api';
import { CONTACT_STATUSES, CONTACT_TOPICS, subjectLabel, type ContactStatus } from '@/lib/contact-options';
import { cn } from '@/lib/utils';

interface Msg { id: string; topic: string; service: string | null; name: string; phone: string; email: string | null; message: string; language: string; status: ContactStatus; adminNote: string | null; userId: string | null; page: string | null; createdAt: string; updatedAt: string }
const STATUS_LABEL: Record<ContactStatus, string> = { new: 'New', in_progress: 'In progress', resolved: 'Resolved' };
const TOPIC_LABEL: Record<string, string> = { service: 'Service enquiry', support: 'Support', other: 'Other' };
const tone = (s: ContactStatus) => (s === 'new' ? 'warn' : s === 'resolved' ? 'good' : 'gold') as 'warn' | 'good' | 'gold';
const when = (d: string) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

/** Admin inbox for the Contact Us form. */
export function MessagesTab({ onCounts }: { onCounts?: (newCount: number) => void }) {
  const [status, setStatus] = React.useState<ContactStatus | 'all'>('all');
  const [topic, setTopic] = React.useState('all');
  const [q, setQ] = React.useState('');
  const [data, setData] = React.useState<{ messages: Msg[]; counts: Record<ContactStatus, number> } | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const load = React.useCallback(async () => {
    setErr(null);
    try { const r = await api<{ messages: Msg[]; counts: Record<ContactStatus, number> }>(`/api/admin/messages?status=${status}&topic=${topic}`); setData(r); onCounts?.(r.counts.new); }
    catch { setErr('Could not load messages.'); }
  }, [status, topic, onCounts]);
  React.useEffect(() => { load(); }, [load]);

  const needle = q.trim().toLowerCase();
  const list = (data?.messages ?? []).filter((m) => !needle || [m.name, m.phone, m.email ?? '', m.message].some((x) => x.toLowerCase().includes(needle)));
  const total = data ? Object.values(data.counts).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-2xl font-semibold">Contact messages</h2><p className="text-sm text-muted-foreground">Messages from the Contact Us page. Details are stored encrypted.</p></div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {(['all', ...CONTACT_STATUSES] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={cn('rounded-full border px-3 py-1 text-sm', status === s ? 'border-gold bg-gold/20 font-semibold' : 'border-border hover:border-gold/50')}>
            {s === 'all' ? 'All' : STATUS_LABEL[s]} <span className="text-muted-foreground">({s === 'all' ? total : data?.counts[s] ?? 0})</span>
          </button>
        ))}
        <Select value={topic} onChange={(e) => setTopic(e.target.value)} className="h-8 w-44 text-sm" aria-label="Filter by type">
          <option value="all">All types</option>{CONTACT_TOPICS.map((t) => <option key={t} value={t}>{TOPIC_LABEL[t]}</option>)}
        </Select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, mobile, email, text" aria-label="Search messages" className="h-8 min-w-[220px] flex-1 rounded-md border border-input bg-background px-3 text-sm" />
      </div>
      {err && <p className="text-sm text-danger">{err}</p>}
      {!data && !err && <div className="glass h-32 animate-pulse rounded-lg" />}
      {data && list.length === 0 && <p className="glass rounded-lg p-6 text-center text-muted-foreground">No messages here yet.</p>}
      <div className="space-y-3">{list.map((m) => <MessageCard key={m.id} m={m} onChanged={load} />)}</div>
    </div>
  );
}

function MessageCard({ m, onChanged }: { m: Msg; onChanged: () => void }) {
  const [note, setNote] = React.useState(m.adminNote ?? '');
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const patch = async (body: Record<string, unknown>, ok: string) => { setBusy(true); setMsg(null); try { await api('/api/admin/messages', { method: 'PATCH', json: { id: m.id, ...body } }); setMsg(ok); onChanged(); } catch { setMsg('Could not save.'); } finally { setBusy(false); } };
  const remove = async () => { if (!window.confirm('Delete this message permanently?')) return; setBusy(true); try { await api('/api/admin/messages', { method: 'DELETE', json: { id: m.id } }); onChanged(); } catch { setMsg('Could not delete.'); setBusy(false); } };
  const wa = m.phone.replace(/\D/g, '');
  return (
    <article className={cn('glass rounded-xl border p-4', m.status === 'new' ? 'border-gold/60' : 'border-border')}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{m.name} <Badge tone={tone(m.status)} className="ml-1">{STATUS_LABEL[m.status]}</Badge></p>
          <p className="text-xs text-muted-foreground">{when(m.createdAt)} · {TOPIC_LABEL[m.topic] ?? m.topic}{m.service ? ` → ${subjectLabel(m.topic, m.service)}` : ''} · {m.language === 'hi' ? 'Hindi' : 'English'}{m.page ? ` · from ${m.page}` : ''}{m.userId ? ' · signed-in user' : ''}</p>
        </div>
        <Select value={m.status} disabled={busy} onChange={(e) => patch({ status: e.target.value }, 'Status updated')} className="h-8 w-36 text-sm" aria-label="Status">
          {CONTACT_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </Select>
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-sm">
        <a href={`tel:${m.phone}`} className="inline-flex items-center gap-1 hover:text-gold"><Phone className="h-4 w-4 text-gold" />{m.phone}</a>
        <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-success hover:underline"><MessageCircle className="h-4 w-4" />WhatsApp</a>
        {m.email && <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1 hover:text-gold"><Mail className="h-4 w-4 text-gold" />{m.email}</a>}
      </div>
      <p className="mt-3 whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-sm" lang={m.language === 'hi' ? 'hi' : undefined}>{m.message}</p>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={2000} placeholder="Internal note (only admins see this)" aria-label="Internal note" className="min-w-[240px] flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" />
        <Button size="sm" variant="outline" disabled={busy || note === (m.adminNote ?? '')} onClick={() => patch({ adminNote: note }, 'Note saved')}><Save className="h-4 w-4" /> Save note</Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={remove} aria-label="Delete message"><Trash2 className="h-4 w-4 text-danger" /></Button>
      </div>
      {msg && <p className="mt-1 text-xs text-muted-foreground" role="status">{msg}</p>}
    </article>
  );
}
