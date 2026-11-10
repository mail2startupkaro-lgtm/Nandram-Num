'use client';
import * as React from 'react';
import { ImageUp, Save } from 'lucide-react';
import { useApp } from '@/components/layout/providers';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { api, ApiError } from '@/lib/client/api';

interface B { brandName: string; expertName: string; expertTitle?: string | null; contactLine?: string | null; website?: string | null; bookingUrl?: string | null; logo?: string | null; photo?: string | null; signature?: string | null; colours?: { primary?: string; accent?: string; border?: string } | null; defaultTheme?: string | null }
const EMPTY: B = { brandName: '', expertName: '', expertTitle: '', contactLine: '', website: '', bookingUrl: '', logo: null, photo: null, signature: null, colours: {}, defaultTheme: 'royal-gold-maroon' };

function readImage(file: File, hi: boolean): Promise<string> {
  return new Promise((res, rej) => {
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return rej(new Error(hi ? 'PNG, JPEG या WebP इमेज का उपयोग करें।' : 'Use a PNG, JPEG or WebP image.'));
    if (file.size > 400 * 1024) return rej(new Error(hi ? 'इमेज 400 KB से छोटी होनी चाहिए।' : 'Image must be under 400 KB.'));
    const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(new Error(hi ? 'इमेज पढ़ी नहीं जा सकी' : 'Could not read the image')); r.readAsDataURL(file);
  });
}

export default function BrandingPage() {
  const { t, me, lang } = useApp();
  const hi = lang === 'hi';
  const L = (en: string, h: string) => (hi ? h : en);
  const [b, setB] = React.useState<B>(EMPTY);
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  React.useEffect(() => { api<{ branding: B | null }>('/api/branding').then((r) => r.branding && setB({ ...EMPTY, ...r.branding })).catch(() => {}); }, []);
  const set = (k: keyof B, v: unknown) => setB({ ...b, [k]: v });
  const img = (k: 'logo' | 'photo' | 'signature', label: string) => (
    <Field label={label}>
      <div className="flex items-center gap-3">
        <div className="grid h-16 w-24 place-items-center overflow-hidden rounded-md border border-border bg-white">{b[k] ? <img src={b[k]!} alt="" className="max-h-full max-w-full object-contain" /> : <ImageUp className="h-5 w-5 text-gray-400" />}</div>
        <input type="file" accept="image/png,image/jpeg,image/webp" className="text-xs" onChange={async (e) => { const f = e.target.files?.[0]; if (f) try { set(k, await readImage(f, hi)); } catch (err) { setMsg({ ok: false, text: (err as Error).message }); } }} />
        {b[k] && <Button size="sm" variant="ghost" onClick={() => set(k, null)}>✕</Button>}
      </div>
    </Field>
  );
  if (me?.account && !me.account.features.whiteLabel) return <div className="container py-12"><p className="glass rounded-lg p-6">{L('White-label branding is part of the Pro plan.', 'व्हाइट-लेबल ब्रांडिंग प्रो प्लान का हिस्सा है।')} <a className="text-gold underline" href="/pricing">{t.account.upgrade}</a></p></div>;
  return (
    <div className="container max-w-3xl space-y-6 py-8 sm:py-12">
      <h1 className="text-3xl font-bold">{t.account.branding}</h1>
      <div className="glass grid gap-4 rounded-lg p-5 sm:grid-cols-2">
        <Field label={L('Brand name', 'ब्रांड का नाम')} htmlFor="bn" required><Input id="bn" value={b.brandName} onChange={(e) => set('brandName', e.target.value)} /></Field>
        <Field label={L('Expert name', 'विशेषज्ञ का नाम')} htmlFor="en" required><Input id="en" value={b.expertName} onChange={(e) => set('expertName', e.target.value)} /></Field>
        <Field label={L('Title / tagline', 'पद / टैगलाइन')} htmlFor="et"><Input id="et" value={b.expertTitle ?? ''} onChange={(e) => set('expertTitle', e.target.value)} /></Field>
        <Field label={L('Contact line (phone · email · city)', 'संपर्क पंक्ति (फ़ोन · ईमेल · शहर)')} htmlFor="cl"><Input id="cl" value={b.contactLine ?? ''} onChange={(e) => set('contactLine', e.target.value)} /></Field>
        <Field label={L('Website', 'वेबसाइट')} htmlFor="ws"><Input id="ws" type="url" placeholder="https://" value={b.website ?? ''} onChange={(e) => set('website', e.target.value)} /></Field>
        <Field label={L('Booking link (Calendly / Google Calendar)', 'बुकिंग लिंक (Calendly / Google Calendar)')} htmlFor="bk" hint={L('Printed as a QR code on the last page', 'अंतिम पृष्ठ पर QR कोड के रूप में छपेगा')}><Input id="bk" type="url" placeholder="https://calendly.com/…" value={b.bookingUrl ?? ''} onChange={(e) => set('bookingUrl', e.target.value)} /></Field>
        {img('logo', L('Logo', 'लोगो'))}{img('photo', L('Expert photo', 'विशेषज्ञ की फ़ोटो'))}{img('signature', L('Signature (transparent PNG works best)', 'हस्ताक्षर (पारदर्शी PNG सबसे अच्छा)'))}
        <Field label={L('Default PDF theme', 'डिफ़ॉल्ट PDF थीम')} htmlFor="dt"><Select id="dt" value={b.defaultTheme ?? 'royal-gold-maroon'} onChange={(e) => set('defaultTheme', e.target.value)}>{Object.entries(t.pdf.themes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
        <div className="flex gap-4 sm:col-span-2">{(['primary', 'accent', 'border'] as const).map((c) => (
          <label key={c} className="flex items-center gap-2 text-sm capitalize"><input type="color" value={b.colours?.[c] ?? (c === 'primary' ? '#7a1e2c' : c === 'accent' ? '#b8892b' : '#b8892b')} onChange={(e) => set('colours', { ...(b.colours ?? {}), [c]: e.target.value })} />{hi ? ({ primary: 'मुख्य रंग', accent: 'उभार रंग', border: 'बॉर्डर रंग' })[c] : c}</label>
        ))}</div>
      </div>
      <Button variant="gold" onClick={async () => { setMsg(null); try { await api('/api/branding', { method: 'PUT', json: b }); setMsg({ ok: true, text: t.dash.updated }); } catch (e) { setMsg({ ok: false, text: e instanceof ApiError ? e.message : t.err.server }); } }}><Save /> {t.btn.save}</Button>
      {msg && <p className={`text-sm ${msg.ok ? 'text-success' : 'text-danger'}`}>{msg.text}</p>}
    </div>
  );
}
