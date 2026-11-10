'use client';
import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/components/layout/providers';
import dynamic from 'next/dynamic';
// Results (charts, grids, narrative, PDF button) only appear after "Calculate" – load them on demand so the
// wizard is interactive sooner.
const Results = dynamic(() => import('@/components/results/results').then((m) => m.Results), {
  ssr: false,
  loading: () => <div className="mx-auto my-10 h-40 max-w-3xl animate-pulse rounded-lg bg-muted/40" aria-busy="true" />,
});
import { EMPTY, fromClient, toClientInput, toDraft, type WizardState } from '@/components/wizard/state';
import { Wizard } from '@/components/wizard/wizard';
import type { NumerologyResult } from '@/lib/numerology';
import type { Narrative } from '@/lib/narrative/service';
import { api } from '@/lib/client/api';
import { safeStorage } from '@/lib/utils';

const DRAFT_KEY = 'wizardDraft.v1';

/** Where the reading on screen lives in the database (if anywhere). */
interface Ctx { profileId?: string; reportId?: string; version?: number }

function ReadingInner() {
  const { t, lang } = useApp();
  const params = useSearchParams();
  const router = useRouter();
  const [form, setForm] = React.useState<WizardState>(EMPTY);
  const [result, setResult] = React.useState<NumerologyResult | null>(null);
  const [narrative, setNarrative] = React.useState<Narrative | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ctx, setCtx] = React.useState<Ctx>({});
  const [saved, setSaved] = React.useState(false);
  const [savedMsg, setSavedMsg] = React.useState<string | null>(null);

  // Load from ?report=, ?profile= or the local draft
  React.useEffect(() => {
    const reportId = params.get('report'), profileId = params.get('profile');
    (async () => {
      try {
        if (reportId) {
          const { report } = await api<{ report: { id: string; profileId: string; version: number; result: NumerologyResult; narrative: Narrative | null } }>(`/api/reports/${reportId}`);
          setForm(fromClient(report.result.client as never));
          setResult(report.result); setNarrative(report.narrative);
          setCtx({ profileId: report.profileId, reportId: report.id, version: report.version }); setSaved(true);
        } else if (profileId) {
          const { profile } = await api<{ profile: { id: string; input: never } }>(`/api/profiles/${profileId}`);
          setForm(fromClient(profile.input)); setCtx({ profileId: profile.id }); setResult(null);
        } else if (params.get('new')) {
          setForm(EMPTY); safeStorage().remove(DRAFT_KEY);
        } else {
          const d = safeStorage().get(DRAFT_KEY);
          if (d) try { setForm({ ...EMPTY, ...JSON.parse(d) }); } catch { /* ignore bad draft */ }
        }
      } catch (e) { setError(e instanceof Error ? e.message : t.err.server); }
    })();
  }, [params, t.err.server]);

  const update = (s: WizardState) => {
    setForm(s);
    if (!ctx.profileId) safeStorage().set(DRAFT_KEY, JSON.stringify(toDraft(s))); // never stores Aadhaar
  };

  async function submit() {
    setSubmitting(true); setError(null);
    try {
      const input = toClientInput(form);
      if (ctx.profileId) await api(`/api/profiles/${ctx.profileId}`, { method: 'PATCH', json: { input } });
      const json = await api<NumerologyResult>('/api/calculate', { method: 'POST', json: { input, modules: ['complete'] } });
      setResult(json); setNarrative(null); setSaved(false); setSavedMsg(null);
      setCtx((c) => ({ profileId: c.profileId })); // a new calculation becomes a new version when saved
      setForm((f) => ({ ...f, aadhaar: '', aadhaarConsent: false })); // drop Aadhaar from memory once used
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : t.err.server);
    } finally {
      setSubmitting(false);
    }
  }

  async function importFile(file: File) {
    setError(null);
    try {
      const data = JSON.parse(await file.text());
      if (data?.client?.fullName && data?.results?.dob) {
        update(fromClient(data.client));
        const { narrative: n, ...rest } = data;
        setResult(rest as NumerologyResult); setNarrative(n?.sections ? (n as Narrative) : null); setSaved(false); setCtx({});
      } else if (data?.kind === 'numerology.profile' && data?.profile?.input) {
        update(fromClient(data.profile.input)); setCtx({});
      } else if (data?.fullName) {
        update(fromClient(data));
      } else throw new Error('shape');
    } catch {
      setError(lang === 'hi' ? 'यह फ़ाइल मान्य अंक ज्योतिष एक्सपोर्ट नहीं है।' : 'This file is not a valid numerology export.');
    }
  }

  async function save() {
    if (!result) return;
    setError(null);
    try {
      if (ctx.reportId) {
        await api(`/api/reports/${ctx.reportId}`, { method: 'PATCH', json: { narrative } });
        setSavedMsg(`${t.dash.updated} · v${ctx.version}`);
      } else if (ctx.profileId) {
        const { report } = await api<{ report: { id: string; version: number } }>(`/api/profiles/${ctx.profileId}/reports`, { method: 'POST', json: { mode: 'save', result, narrative } });
        setCtx({ profileId: ctx.profileId, reportId: report.id, version: report.version });
        setSavedMsg(`${t.dash.savedAs} ${report.version}`);
      } else {
        const res = await api<{ profile: { id: string }; report: { id: string; version: number } }>('/api/profiles', { method: 'POST', json: { input: toClientInput(form), result, narrative } });
        setCtx({ profileId: res.profile.id, reportId: res.report.id, version: res.report.version });
        setSavedMsg(`${t.dash.savedAs} ${res.report.version}`);
        safeStorage().remove(DRAFT_KEY);
      }
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.err.server);
    }
  }

  if (result) {
    return (
      <>
        {error && <div className="container pt-6"><p className="rounded-md bg-danger/10 p-3 text-sm text-danger" role="alert">{error}</p></div>}
        <Results
          result={result} narrative={narrative} onNarrative={(n) => { setNarrative(n); setSaved(false); }} saved={saved} onSave={save}
          onEdit={() => setResult(null)}
          onNew={() => { setResult(null); setNarrative(null); setCtx({}); update(EMPTY); router.replace('/reading?new=1'); }}
          savedNote={saved && ctx.profileId ? <span className="text-success">{savedMsg ?? `v${ctx.version}`} · <Link className="underline" href={`/dashboard/${ctx.profileId}`}>{t.dash.viewProfile}</Link></span> : null}
        />
      </>
    );
  }
  return <Wizard value={form} onChange={update} onSubmit={submit} onImport={importFile} submitting={submitting} serverError={error} />;
}

export default function ReadingPage() {
  return <React.Suspense fallback={null}><ReadingInner /></React.Suspense>;
}
