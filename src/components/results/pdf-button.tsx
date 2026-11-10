'use client';
import * as React from 'react';
import { Download } from 'lucide-react';
import type { NumerologyResult } from '@/lib/numerology';
import type { Narrative } from '@/lib/narrative/service';
import { useApp } from '@/components/layout/providers';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/form';
import { safeStorage } from '@/lib/utils';

const THEME_IDS = ['royal-gold-maroon', 'cosmic-blue', 'saffron-cream', 'minimal-white'] as const;

export function PdfButton({ result, narrative }: { result: NumerologyResult; narrative: Narrative | null }) {
  const { t, lang } = useApp();
  const hi = lang === 'hi';
  const [theme, setTheme] = React.useState<string>('royal-gold-maroon');
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState(false);

  React.useEffect(() => { const v = safeStorage().get('pdfTheme'); if (v && (THEME_IDS as readonly string[]).includes(v)) setTheme(v); }, []);

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

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        <Select aria-label={t.pdf.theme} value={theme} onChange={(e) => { setTheme(e.target.value); safeStorage().set('pdfTheme', e.target.value); }} className="h-10 w-44 text-xs">
          {THEME_IDS.map((id) => <option key={id} value={id}>{t.pdf.themes[id]}</option>)}
        </Select>
        <Button variant="gold" onClick={download} disabled={busy}><Download className={busy ? 'animate-bounce' : ''} /> {busy ? t.pdf.making : t.btn.pdf}</Button>
      </div>
      {msg && <p className="max-w-xs text-xs text-warning" role="alert">{msg}</p>}
      {preview && <p className="max-w-xs text-xs text-muted-foreground">{t.account.preview} <a href="/pricing" className="text-gold underline">{t.account.unlockFull}</a></p>}
    </div>
  );
}
