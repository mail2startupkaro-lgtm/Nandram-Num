'use client';
import * as React from 'react';
import Link from 'next/link';
import { Check, CheckCircle2, Circle, Clock, Download, Loader2, Mail, Moon, Send } from 'lucide-react';
import { useApp } from '@/components/layout/providers';
import { Button, buttonVariants } from '@/components/ui/button';
import { api, ApiError, download } from '@/lib/client/api';
import type { QueueState } from '@/lib/report-queue';
import { cn } from '@/lib/utils';
import { useTimeZone } from '@/lib/client/currency';
import { isIST, workingHoursLabel } from '@/lib/client/working-hours';

/** Is this visitor served by the delivery queue (general client) rather than instant PDFs (Pro / admin)? */
export function useQueued() {
  const { me } = useApp();
  return !(me?.account?.isAdmin || me?.account?.features.fullReports);
}

const T = {
  en: {
    stages: [['Received', 'Your details have been received.'], ['In the queue', 'Your report is in the queue.'], ['Being prepared', 'Your report is being prepared.'], ['Ready', 'Your report is ready to download.']] as [string, string][],
    expected: (t: string) => `Expected by ${t}`, paused: (t: string) => `Paused for the night – resumes at ${t}`, hold: 'On hold – we will update you shortly.',
    hours: (h: string) => `Reports are prepared between ${h} and are usually ready about 2 hours after you submit them.`,
    download: 'Download report (PDF)', snapshot: 'One-page summary', submit: 'Submit for report', submitting: 'Submitting…', uses: 'Uses 1 report credit.', credits: (n: number) => `Credits left: ${n}`,
    noCredit: 'Choose a plan to get your complete report.', plans: 'See plans', signIn: 'Sign in to get your report', saveFirst: 'Save this reading first, then submit it for your complete report.', save: 'Save reading',
    title: 'Your complete report', error: 'Something went wrong. Please try again.',
  },
  hi: {
    stages: [['प्राप्त', 'आपका विवरण प्राप्त हो गया है।'], ['क्रम में', 'आपकी रिपोर्ट क्रम में है।'], ['तैयार हो रही है', 'आपकी रिपोर्ट तैयार की जा रही है।'], ['तैयार', 'आपकी रिपोर्ट डाउनलोड के लिए तैयार है।']] as [string, string][],
    expected: (t: string) => `अपेक्षित समय: ${t}`, paused: (t: string) => `रात के लिए रुका – ${t} पर फिर शुरू`, hold: 'अस्थायी रूप से रुका – हम जल्द ही अपडेट देंगे।',
    hours: (h: string) => `रिपोर्ट ${h} के बीच तैयार की जाती हैं और जमा करने के लगभग 2 घंटे बाद तैयार हो जाती हैं।`,
    download: 'रिपोर्ट डाउनलोड करें (PDF)', snapshot: 'एक-पृष्ठ सारांश', submit: 'रिपोर्ट के लिए जमा करें', submitting: 'जमा हो रहा है…', uses: '1 रिपोर्ट क्रेडिट उपयोग होगा।', credits: (n: number) => `शेष क्रेडिट: ${n}`,
    noCredit: 'अपनी संपूर्ण रिपोर्ट पाने के लिए प्लान चुनें।', plans: 'प्लान देखें', signIn: 'रिपोर्ट पाने के लिए साइन इन करें', saveFirst: 'पहले यह रीडिंग सहेजें, फिर अपनी संपूर्ण रिपोर्ट के लिए जमा करें।', save: 'रीडिंग सहेजें',
    title: 'आपकी संपूर्ण रिपोर्ट', error: 'कुछ गड़बड़ हुई। कृपया फिर प्रयास करें।',
  },
};

/** Date/time in the visitor's own time zone (with its short name when outside India, e.g. "12 Nov, 9:55 am EST"). */
const when = (iso: string, lang: 'en' | 'hi', tz = 'Asia/Kolkata') => new Date(iso).toLocaleString(lang === 'hi' ? 'hi-IN' : isIST(tz) ? 'en-IN' : 'en-US', { timeZone: tz, day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', ...(isIST(tz) ? {} : { timeZoneName: 'short' as const }) });

/** Four-step status bar shown to general clients. */
export function QueueTracker({ queue, compact = false }: { queue: QueueState; compact?: boolean }) {
  const { lang } = useApp();
  const t = T[lang];
  const tz = useTimeZone();
  if (queue.state === 'not_requested') return null;
  const stage = queue.stage;
  return (
    <div className={cn('space-y-3', compact && 'space-y-2')} aria-live="polite">
      <ol className={cn('grid gap-2', compact ? 'grid-cols-4' : 'sm:grid-cols-4')}>
        {t.stages.map(([name, text], i) => {
          const n = i + 1; const done = n < stage || stage === 4; const now = n === stage && stage !== 4;
          return (
            <li key={name} className={cn('rounded-lg border p-2.5', done ? 'border-success/40 bg-success/10' : now ? 'border-gold bg-gold/10' : 'border-border/60 opacity-60')}>
              <p className="flex items-center gap-1.5 text-sm font-semibold">{done ? <CheckCircle2 className="h-4 w-4 text-success" /> : now ? <Loader2 className="h-4 w-4 animate-spin text-gold" /> : <Circle className="h-4 w-4" />}<span>{n}. {name}</span></p>
              {!compact && <p className="mt-0.5 text-xs text-muted-foreground">{text}</p>}
            </li>
          );
        })}
      </ol>
      {queue.state === 'queued' && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {queue.onHold ? <span className="text-warning">{t.hold}</span> : queue.paused && queue.resumesAt ? <span className="inline-flex items-center gap-1"><Moon className="h-3.5 w-3.5 text-gold" />{t.paused(when(queue.resumesAt, lang, tz))}</span> : null}
          {!queue.onHold && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-gold" />{t.expected(when(queue.deliverAt, lang, tz))}</span>}
        </p>
      )}
    </div>
  );
}

/**
 * The "complete report" box for general clients: Submit for report → status → Download when ready.
 * Polls every minute while the report is being prepared.
 */
export function ReportRequestPanel({ reportId, saved, onSave, theme = 'royal-gold-maroon' }: { reportId?: string; saved: boolean; onSave: () => void | Promise<void>; theme?: string }) {
  const { lang, me, refreshMe } = useApp();
  const t = T[lang];
  const tz = useTimeZone();
  const [queue, setQueue] = React.useState<QueueState | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [noCredit, setNoCredit] = React.useState(false);
  const [clientEmail, setClientEmail] = React.useState('');
  const [emailBusy, setEmailBusy] = React.useState(false);
  const [emailSent, setEmailSent] = React.useState(false);

  // Auto-seed email from user account
  React.useEffect(() => {
    if (me?.user?.email && !clientEmail) {
      setClientEmail(me.user.email);
    }
  }, [me?.user?.email, clientEmail]);

  const load = React.useCallback(async () => {
    if (!reportId) return;
    try {
      const r = await api<{ queue: QueueState; report?: { result?: { client?: { email?: string } } } }>(`/api/reports/${reportId}`);
      setQueue(r.queue);
      if (r.report?.result?.client?.email && !clientEmail) {
        setClientEmail(r.report.result.client.email);
      }
    } catch { /* keep last */ }
  }, [reportId, clientEmail]);
  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => {
    if (!queue || queue.state !== 'queued') return;
    const id = setInterval(load, 60_000); return () => clearInterval(id);
  }, [queue, load]);

  async function submit() {
    if (!reportId) return;
    setBusy(true); setErr(null); setNoCredit(false);
    try {
      const r = await api<{ queue: QueueState }>(`/api/reports/${reportId}/request`, {
        method: 'POST',
        json: { email: clientEmail.trim() || undefined },
      });
      setQueue(r.queue);
      await refreshMe();
    }
    catch (e) { if (e instanceof ApiError && e.status === 402) setNoCredit(true); else setErr(t.error); }
    finally { setBusy(false); }
  }

  async function sendEmailNow() {
    if (!reportId) return;
    setEmailBusy(true); setErr(null);
    try {
      await api(`/api/reports/${reportId}/email`, {
        method: 'POST',
        json: { email: clientEmail.trim() || undefined, theme },
      });
      setEmailSent(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t.error);
    } finally {
      setEmailBusy(false);
    }
  }

  let body: React.ReactNode;
  if (!me?.user) body = <Link href="/login?next=/reading" className={buttonVariants({ variant: 'gold' })}>{t.signIn}</Link>;
  else if (!reportId || !saved) body = <div className="space-y-2"><p className="text-sm text-muted-foreground">{t.saveFirst}</p><Button variant="gold" onClick={() => onSave()}>{t.save}</Button></div>;
  else if (!queue) body = <div className="h-10 animate-pulse rounded bg-muted" />;
  else if (queue.state === 'not_requested') body = noCredit
    ? <div className="space-y-2"><p className="text-sm">{t.noCredit}</p><Link href="/pricing" className={buttonVariants({ variant: 'gold' })}>{t.plans}</Link></div>
    : (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="email"
            placeholder={lang === 'hi' ? 'ईमेल आईडी (रिपोर्ट प्राप्त करने के लिए)' : 'Email ID (to receive report)'}
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            className="h-10 min-w-[240px] flex-1 rounded-md border border-input bg-background/80 px-3 text-sm focus:border-gold focus:outline-none"
          />
          <Button variant="gold" disabled={busy} onClick={submit}>
            <Send className="h-4 w-4" />{busy ? t.submitting : t.submit}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {t.uses} {t.credits(me.account?.credits ?? 0)} · {lang === 'hi' ? 'रिपोर्ट तैयार होने पर ईमेल पर भेजी जाएगी और डाउनलोड के लिए उपलब्ध रहेगी।' : 'Report will be emailed to this ID and also available for download.'}
        </p>
      </div>
    );
  else body = (
    <div className="space-y-3">
      <QueueTracker queue={queue} />
      {queue.state === 'ready' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="gold" disabled={busy} onClick={async () => { setBusy(true); try { await download(`/api/reports/${reportId}/pdf?kind=report&theme=${theme}`); } catch { setErr(t.error); } finally { setBusy(false); } }}>
              <Download className="h-4 w-4" />{t.download}
            </Button>
            <Button variant="ghost" onClick={() => download(`/api/reports/${reportId}/pdf?kind=output&theme=${theme}`).catch(() => setErr(t.error))}>
              {t.snapshot}
            </Button>
            <Button variant="outline" disabled={emailBusy} onClick={sendEmailNow}>
              <Mail className="h-4 w-4" />{emailSent ? (lang === 'hi' ? 'ईमेल भेजा गया ✓' : 'Emailed ✓') : emailBusy ? (lang === 'hi' ? 'भेजा जा रहा है…' : 'Sending…') : (lang === 'hi' ? 'ईमेल पर भेजें' : 'Send to email')}
            </Button>
          </div>
          {emailSent && (
            <p className="flex items-center gap-1.5 text-xs text-success">
              <Check className="h-3.5 w-3.5" />
              {lang === 'hi' ? `रिपोर्ट ${clientEmail || me?.user?.email || 'ईमेल'} पर भेज दी गई है।` : `Report successfully sent to ${clientEmail || me?.user?.email || 'your email'}.`}
            </p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <section id="report" className="glass scroll-mt-24 space-y-3 rounded-lg border border-gold/30 p-5" aria-labelledby="rq-title">
      <h2 id="rq-title" className="font-serif text-xl font-semibold">{t.title}</h2>
      {body}
      {err && <p className="text-sm text-danger" role="alert">{err}</p>}
      <p className="text-xs text-muted-foreground">{t.hours(workingHoursLabel(tz, lang === 'hi'))}</p>
    </section>
  );
}
