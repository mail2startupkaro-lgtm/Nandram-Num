'use client';
import * as React from 'react';
import { useParams } from 'next/navigation';
import { Download, Lock } from 'lucide-react';
import type { NumerologyResult } from '@/lib/numerology';
import type { Narrative } from '@/lib/narrative/service';
import { planetOf } from '@/lib/numerology/data/planets';
import { useApp } from '@/components/layout/providers';
import { NumberGrid } from '@/components/results/grid';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { download } from '@/lib/client/api';

type State =
  | { kind: 'loading' }
  | { kind: 'password'; wrong?: boolean }
  | { kind: 'error'; status: string }
  | { kind: 'ok'; result: NumerologyResult; narrative: Narrative | null; expiresAt: string };

export default function SharedReport() {
  const { t, lang } = useApp();
  const { token } = useParams<{ token: string }>();
  const [state, setState] = React.useState<State>({ kind: 'loading' });
  const [pw, setPw] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const open = React.useCallback(async (password?: string) => {
    const res = await fetch(`/api/share/${token}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(password ? { password } : {}) });
    const data = await res.json().catch(() => ({ status: 'not_found' }));
    if (data.status === 'ok') setState({ kind: 'ok', result: data.report.result, narrative: data.report.narrative, expiresAt: data.expiresAt });
    else if (data.status === 'password_required') setState({ kind: 'password' });
    else if (data.status === 'wrong_password') setState({ kind: 'password', wrong: true });
    else setState({ kind: 'error', status: data.status ?? 'not_found' });
  }, [token]);
  React.useEffect(() => { open(); }, [open]);

  if (state.kind === 'loading') return <div className="container py-16"><div className="mx-auto h-40 max-w-2xl animate-pulse rounded-lg bg-muted" /></div>;
  if (state.kind === 'error') {
    const msg = state.status === 'expired' ? t.share.expired : state.status === 'revoked' ? t.share.revoked : t.share.notFound;
    return <div className="container py-16"><p className="glass mx-auto max-w-md rounded-lg p-8 text-center">{msg}</p></div>;
  }
  if (state.kind === 'password') {
    return (
      <div className="container py-16">
        <form className="glass mx-auto max-w-sm space-y-4 rounded-lg p-6" onSubmit={(e) => { e.preventDefault(); open(pw); }}>
          <p className="flex items-center gap-2 font-serif text-xl font-semibold"><Lock className="h-5 w-5 text-gold" />{t.share.needPassword}</p>
          <Field label={t.dash.password.replace(/ \(.*\)/, '')} htmlFor="pw" error={state.wrong ? t.share.wrong : undefined}>
            <Input id="pw" type="password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} />
          </Field>
          <Button type="submit" variant="gold" className="w-full">{t.share.unlock}</Button>
        </form>
      </div>
    );
  }

  const { result: r, narrative } = state;
  const d = r.results.dob;
  const core = [[t.preview.moolank, d.moolank.value], [t.preview.bhagyank, d.bhagyank.value], [t.preview.kua, d.kua.value], [t.preview.py, d.personalCycles.current.personalYear]] as [string, number][];
  return (
    <div className="container max-w-3xl space-y-6 py-8 sm:py-12">
      <div className="glass rounded-lg p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-gold">{t.share.title}</p>
        <h1 className="text-3xl font-bold sm:text-4xl">{r.client.commonName || r.client.fullName}</h1>
        <p className="text-sm text-muted-foreground">{d.dob.iso.split('-').reverse().join('-')} · {t.share.validUntil} {new Date(state.expiresAt).toLocaleDateString('en-IN')}</p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {core.map(([k, n]) => (
            <div key={k} className="rounded-lg border border-gold/30 p-3 text-center"><p className="text-xs uppercase text-muted-foreground">{k}</p><p className="num-badge gold-text text-4xl font-bold">{n}</p><p className="text-xs">{lang === 'hi' ? planetOf(n).devanagari : planetOf(n).name}</p></div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-6">
          <NumberGrid size="md" cells={d.loShu.cells} label={t.r.loShu} />
          {narrative && (
            <Button variant="gold" disabled={busy} onClick={async () => { setBusy(true); try { await download(`/api/share/${token}/pdf`, { method: 'POST', json: pw ? { password: pw } : {} }); } finally { setBusy(false); } }}>
              <Download className={busy ? 'animate-bounce' : ''} /> {busy ? t.pdf.making : t.share.download}
            </Button>
          )}
        </div>
      </div>
      {narrative ? (
        <article className="glass space-y-6 rounded-lg p-6">
          {narrative.sections.map((s) => (
            <section key={s.id}><h2 className="mb-2 font-serif text-xl font-semibold text-gold">{s.title}</h2>{s.text.split(/\n\s*\n/).map((p, i) => <p key={i} className="mb-3 leading-relaxed">{p}</p>)}</section>
          ))}
        </article>
      ) : <p className="glass rounded-lg p-6 text-center text-muted-foreground">{t.share.notReady}</p>}
    </div>
  );
}
