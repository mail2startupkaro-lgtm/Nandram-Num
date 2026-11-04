'use client';
import * as React from 'react';
import { Check, Copy, Link2, Mail, MessageCircle, X } from 'lucide-react';
import { useApp } from '@/components/layout/providers';
import { Button, buttonVariants } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { Badge } from '@/components/ui/misc';
import { api } from '@/lib/client/api';

interface LinkRow { id: string; expiresAt: string; revokedAt: string | null; views: number; createdAt: string; passwordProtected: boolean }
interface Created { url: string; whatsapp: string; email: string; expiresAt: string; passwordProtected: boolean }

export function ShareDialog({ reportId, onClose }: { reportId: string; onClose: () => void }) {
  const { t } = useApp();
  const [days, setDays] = React.useState(7);
  const [password, setPassword] = React.useState('');
  const [created, setCreated] = React.useState<Created | null>(null);
  const [links, setLinks] = React.useState<LinkRow[]>([]);
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => setLinks((await api<{ links: LinkRow[] }>(`/api/reports/${reportId}/share`)).links), [reportId]);
  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);

  async function create() {
    setError(null);
    try { setCreated(await api<Created>(`/api/reports/${reportId}/share`, { method: 'POST', json: { days, ...(password ? { password } : {}) } })); setPassword(''); load(); }
    catch (e) { setError(e instanceof Error ? e.message : t.err.server); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="share-title" onClick={onClose}>
      <div className="glass w-full max-w-lg rounded-lg bg-background p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 id="share-title" className="flex items-center gap-2 text-xl font-semibold"><Link2 className="h-5 w-5 text-gold" />{t.dash.shareTitle}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label={t.dash.close}><X /></Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t.dash.expiresIn} htmlFor="sh-days">
            <Select id="sh-days" value={days} onChange={(e) => setDays(Number(e.target.value))}>{[1, 3, 7, 14, 30].map((d) => <option key={d} value={d}>{d} {t.dash.days}</option>)}</Select>
          </Field>
          <Field label={t.dash.password} htmlFor="sh-pw"><Input id="sh-pw" type="password" autoComplete="new-password" minLength={4} value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        </div>
        <Button className="mt-3" variant="gold" onClick={create}><Link2 /> {t.dash.createLink}</Button>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}

        {created && (
          <div className="mt-4 space-y-2 rounded-md border border-gold/40 bg-gold/5 p-3">
            <Input readOnly value={created.url} onFocus={(e) => e.target.select()} aria-label="Share link" />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={async () => { await navigator.clipboard.writeText(created.url).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? <Check /> : <Copy />} {copied ? t.dash.copied : t.dash.copy}</Button>
              <a className={buttonVariants({ size: 'sm', variant: 'outline' })} href={created.whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle /> {t.dash.whatsapp}</a>
              <a className={buttonVariants({ size: 'sm', variant: 'outline' })} href={created.email}><Mail /> {t.dash.email}</a>
            </div>
          </div>
        )}

        {links.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold">{t.dash.activeLinks}</p>
            <ul className="max-h-48 space-y-1.5 overflow-y-auto text-sm">
              {links.map((l) => {
                const expired = new Date(l.expiresAt) < new Date();
                return (
                  <li key={l.id} className="flex items-center gap-2 rounded border border-border px-2 py-1.5">
                    <span className="flex-1 text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleDateString('en-IN')} → {new Date(l.expiresAt).toLocaleDateString('en-IN')} · {l.views} {t.dash.views}{l.passwordProtected ? ' · 🔒' : ''}</span>
                    {l.revokedAt ? <Badge>{t.dash.revoked}</Badge> : expired ? <Badge>{t.dash.expired}</Badge> : <Button size="sm" variant="ghost" className="text-danger" onClick={async () => { await api(`/api/reports/${reportId}/share?shareId=${l.id}`, { method: 'DELETE' }); load(); }}>{t.dash.revoke}</Button>}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
