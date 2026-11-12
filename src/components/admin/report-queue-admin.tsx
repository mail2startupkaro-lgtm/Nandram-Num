'use client';
import * as React from 'react';
import { Pause, Play, RefreshCw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/misc';
import { api } from '@/lib/client/api';
import type { QueueState } from '@/lib/report-queue';
import { cn } from '@/lib/utils';

interface Item { id: string; version: number; module: string; language: string; profile: string; profileId: string; owner: string | null; email: string | null; phone: string | null; requestedAt: string; deliverAt: string; releasedAt: string | null; onHold: boolean; queue: QueueState }
const STAGE = ['', 'Received', 'In the queue', 'Being prepared', 'Ready'];
const t = (d: string | null) => (d ? new Date(d).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—');

/** Admin → Report queue: general clients' submitted reports, their delivery times, and release / hold controls. */
export function ReportQueueAdmin() {
  const [items, setItems] = React.useState<Item[] | null>(null);
  const [filter, setFilter] = React.useState<'open' | 'all'>('open');
  const load = React.useCallback(() => { api<{ items: Item[] }>('/api/admin/report-queue').then((r) => setItems(r.items)).catch(() => setItems([])); }, []);
  React.useEffect(() => { load(); const iv = setInterval(load, 60_000); return () => clearInterval(iv); }, [load]);
  const act = async (id: string, action: 'release' | 'hold' | 'resume') => { await api('/api/admin/report-queue', { method: 'POST', json: { id, action } }); load(); };
  const list = (items ?? []).filter((i) => filter === 'all' || i.queue.state !== 'ready');
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><h2 className="text-2xl font-semibold">Report queue</h2><p className="text-sm text-muted-foreground">Reports submitted by general clients. Each becomes downloadable 1 h 55 min of working time (8 am – 10 pm IST) after submission. You can open a report, release it early or put it on hold.</p></div>
        <div className="flex gap-2"><div className="flex gap-1 rounded-md border border-border p-1 text-sm">{(['open', 'all'] as const).map((f) => <button key={f} onClick={() => setFilter(f)} className={cn('rounded px-3 py-1', filter === f ? 'bg-gold/20 font-semibold' : 'hover:bg-muted')}>{f === 'open' ? 'In progress' : 'All'}</button>)}</div><Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</Button></div>
      </div>
      {!items ? <div className="glass h-32 animate-pulse rounded-lg" /> : list.length === 0 ? <p className="glass rounded-lg p-6 text-center text-muted-foreground">Nothing in the queue.</p> : (
        <div className="glass overflow-x-auto rounded-lg"><table className="w-full min-w-[820px] text-sm">
          <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="p-3 font-medium">Client / report</th><th className="p-3 font-medium">Customer</th><th className="p-3 font-medium">Submitted</th><th className="p-3 font-medium">Due</th><th className="p-3 font-medium">Stage</th><th className="p-3 text-right font-medium">Actions</th></tr></thead>
          <tbody>{list.map((i) => (
            <tr key={i.id} className="border-b border-border/50">
              <td className="p-3"><span className="font-medium">{i.profile}</span><span className="block text-xs text-muted-foreground">{i.module} · v{i.version} · {i.language}</span></td>
              <td className="p-3"><span>{i.owner ?? '—'}</span><span className="block text-xs text-muted-foreground">{i.email ?? i.phone ?? ''}</span></td>
              <td className="p-3">{t(i.requestedAt)}</td><td className="p-3">{t(i.deliverAt)}</td>
              <td className="p-3"><Badge tone={i.queue.state === 'ready' ? 'good' : i.onHold ? 'warn' : 'gold'}>{i.queue.state === 'not_requested' ? '—' : STAGE[i.queue.stage]}{i.onHold && i.queue.state !== 'ready' ? ' · on hold' : ''}{i.queue.state === 'queued' && i.queue.paused ? ' · night' : ''}</Badge></td>
              <td className="p-3"><span className="flex justify-end gap-1">
                {i.queue.state !== 'ready' && <Button size="sm" variant="outline" onClick={() => act(i.id, 'release')}><Zap className="h-4 w-4" /> Release now</Button>}
                {i.queue.state !== 'ready' && (i.onHold ? <Button size="sm" variant="ghost" onClick={() => act(i.id, 'resume')}><Play className="h-4 w-4" /> Resume</Button> : <Button size="sm" variant="ghost" onClick={() => act(i.id, 'hold')}><Pause className="h-4 w-4" /> Hold</Button>)}
              </span></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
      <p className="text-xs text-muted-foreground">To change a client&apos;s report text before it is ready, put it on hold and prepare it in the Report generator.</p>
    </div>
  );
}
