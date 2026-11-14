'use client';
import * as React from 'react';
import { Check, Download, Mail, X } from 'lucide-react';
import type { NumerologyResult } from '@/lib/numerology';
import type { Narrative } from '@/lib/narrative/service';
import { useApp } from '@/components/layout/providers';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/form';
import { safeStorage } from '@/lib/utils';

const THEME_IDS = ['royal-gold-maroon', 'cosmic-blue', 'saffron-cream', 'minimal-white'] as const;

export function PdfButton({ result, narrative, reportId }: { result: NumerologyResult; narrative: Narrative | null; reportId?: string }) {
  const { t, lang, me } = useApp();
  const hi = lang === 'hi';
  const [theme, setTheme] = React.useState<string>('royal-gold-maroon');
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState(false);

  // Email modal / inline input state
  const [showEmailPrompt, setShowEmailPrompt] = React.useState(false);
  const [emailInput, setEmailInput] = React.useState('');
  const [emailBusy, setEmailBusy] = React.useState(false);
  const [emailSuccess, setEmailSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
    const v = safeStorage().get('pdfTheme');
    if (v && (THEME_IDS as readonly string[]).includes(v)) setTheme(v);
  }, []);

  React.useEffect(() => {
    if (!emailInput) {
      const defaultEmail = result.client.email || me?.user?.email || '';
      if (defaultEmail) setEmailInput(defaultEmail);
    }
  }, [result.client.email, me?.user?.email, emailInput]);

  async function download() {
    if (narrative?.status === 'awaiting_review') { setMsg(t.pdf.reviewFirst); return; }
    setBusy(true); setMsg(null);
    try {
      const res = await fetch('/api/pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ result, narrative: narrative ?? undefined, theme }) });
      if (!res.ok) throw new Error(String(res.status));
      setPreview(res.headers.get('x-report-tier') === 'preview');
      const blob = await res.blob();
      const name = /filename="([^"]+)"/.exec(res.headers.get('content-disposition') ?? '')?.[1] ?? 'numerology-report.pdf';
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: url, download: name });
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch {
      setMsg(hi ? 'प्रिंट विंडो खुल रही है (प्रिंटर में "Save as PDF" चुनें)...' : 'Opening Print window (select "Save as PDF" to save)...');
      setTimeout(() => {
        window.print();
      }, 300);
    } finally {
      setBusy(false);
    }
  }

  async function handleSendEmail() {
    const targetEmail = (emailInput || result.client.email || me?.user?.email || '').trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      setMsg(hi ? 'कृपया मान्य ईमेल पता दर्ज करें' : 'Please enter a valid email address');
      return;
    }
    setEmailBusy(true);
    setMsg(null);
    setEmailSuccess(null);
    try {
      let res: Response;
      if (reportId) {
        res = await fetch(`/api/reports/${reportId}/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: targetEmail, theme }),
        });
      } else {
        res = await fetch('/api/pdf/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ result, narrative: narrative ?? undefined, theme, email: targetEmail }),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to send');
      setEmailSuccess(hi ? `रिपोर्ट ${targetEmail} पर भेज दी गई है!` : `Report sent to ${targetEmail}!`);
      setShowEmailPrompt(false);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error sending email');
    } finally {
      setEmailBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <Select aria-label={t.pdf.theme} value={theme} onChange={(e) => { setTheme(e.target.value); safeStorage().set('pdfTheme', e.target.value); }} className="h-10 w-40 text-xs">
          {THEME_IDS.map((id) => <option key={id} value={id}>{t.pdf.themes[id]}</option>)}
        </Select>
        <Button variant="gold" onClick={download} disabled={busy}>
          <Download className={busy ? 'animate-bounce' : ''} /> {busy ? t.pdf.making : t.btn.pdf}
        </Button>
        <Button variant="outline" onClick={() => setShowEmailPrompt((v) => !v)} disabled={emailBusy} title={hi ? 'ईमेल पर भेजें' : 'Send report to email'}>
          <Mail className="h-4 w-4" /> {hi ? 'ईमेल' : 'Email'}
        </Button>
      </div>

      {showEmailPrompt && (
        <div className="flex items-center gap-1.5 rounded-md border border-gold/40 bg-gold/5 p-1.5">
          <input
            type="email"
            placeholder="client@example.com"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            className="h-8 w-48 rounded border border-input bg-background px-2 text-xs focus:border-gold focus:outline-none"
          />
          <Button size="sm" variant="gold" disabled={emailBusy} onClick={handleSendEmail} className="h-8 text-xs">
            {emailBusy ? (hi ? 'भेज रहे हैं…' : 'Sending…') : (hi ? 'भेजें' : 'Send')}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowEmailPrompt(false)} className="h-8 px-1.5">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {emailSuccess && <p className="flex items-center gap-1 text-xs text-success"><Check className="h-3 w-3" /> {emailSuccess}</p>}
      {msg && <p className="max-w-xs text-xs text-warning" role="alert">{msg}</p>}
      {preview && <p className="max-w-xs text-xs text-muted-foreground">{t.account.preview} <a href="/pricing" className="text-gold underline">{t.account.unlockFull}</a></p>}
    </div>
  );
}
