'use client';
import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, Mail, Smartphone } from 'lucide-react';
import { useApp } from '@/components/layout/providers';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { Tabs } from '@/components/ui/misc';
import { api, ApiError } from '@/lib/client/api';

function LoginInner() {
  const { t, me, refreshMe } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next')?.startsWith('/') ? params.get('next')! : '/dashboard';
  const [channel, setChannel] = React.useState<'email' | 'sms'>('email');
  const [identifier, setIdentifier] = React.useState('');
  const [name, setName] = React.useState('');
  const [code, setCode] = React.useState('');
  const [step, setStep] = React.useState<'ask' | 'code'>('ask');
  const [devCode, setDevCode] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(params.get('error'));
  const msg = (e: unknown) => (e instanceof ApiError ? t.auth.errors[e.body.error ?? ''] ?? e.message : t.err.server);

  React.useEffect(() => { if (me?.user) router.replace(next); }, [me, next, router]);

  async function send() {
    setBusy(true); setError(null);
    try {
      const r = await api<{ identifier: string; devCode?: string }>('/api/auth/otp/request', { method: 'POST', json: { channel, identifier } });
      setIdentifier(r.identifier); setDevCode(r.devCode ?? null); setStep('code'); setCode('');
    } catch (e) { setError(msg(e)); } finally { setBusy(false); }
  }
  async function verify() {
    setBusy(true); setError(null);
    try {
      await api('/api/auth/otp/verify', { method: 'POST', json: { channel, identifier, code, name: name || undefined } });
      await refreshMe(); router.replace(next);
    } catch (e) { setError(msg(e)); } finally { setBusy(false); }
  }

  return (
    <div className="container flex justify-center py-12 sm:py-20">
      <div className="glass w-full max-w-md rounded-lg p-6 sm:p-8">
        <h1 className="text-3xl font-bold">{t.auth.title}</h1>
        <p className="mb-6 mt-1 text-sm text-muted-foreground">{t.auth.sub}</p>
        {me?.providers.google && (
          <>
            <a href={`/api/auth/google?next=${encodeURIComponent(next)}`} className="flex h-11 w-full items-center justify-center gap-3 rounded-md border border-border bg-white text-sm font-medium text-[#1f1f1f] hover:bg-gray-50">
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
              {t.auth.google}
            </a>
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />{t.auth.or}<span className="h-px flex-1 bg-border" /></div>
          </>
        )}
        {step === 'ask' ? (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); send(); }}>
            <Tabs tabs={[{ value: 'email', label: t.auth.email }, { value: 'sms', label: t.auth.mobile }]} value={channel} onChange={(v) => { setChannel(v as 'email'); setIdentifier(''); setError(null); }} />
            <Field label={channel === 'email' ? t.auth.emailLabel : t.auth.mobileLabel} htmlFor="ident">
              <Input id="ident" autoFocus type={channel === 'email' ? 'email' : 'tel'} inputMode={channel === 'email' ? 'email' : 'numeric'} autoComplete={channel === 'email' ? 'email' : 'tel-national'}
                placeholder={channel === 'email' ? 'you@example.com' : '98765 43210'} value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
            </Field>
            <Button type="submit" variant="gold" className="w-full" disabled={busy || identifier.length < 3}>{channel === 'email' ? <Mail /> : <Smartphone />} {t.auth.sendCode}</Button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); verify(); }}>
            <p className="text-sm">{t.auth.sentTo} <b>{identifier}</b> · <button type="button" className="text-gold underline" onClick={() => setStep('ask')}>{t.auth.change}</button></p>
            {devCode && <p className="rounded-md border border-warning/40 bg-warning/10 p-2 text-xs">{t.auth.devCode} <b className="font-mono text-base">{devCode}</b></p>}
            <Field label={t.auth.code} htmlFor="code">
              <Input id="code" autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="\d{6}" className="text-center font-mono text-2xl tracking-[0.5em]" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
            </Field>
            <Field label={t.auth.name} htmlFor="nm"><Input id="nm" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Button type="submit" variant="gold" className="w-full" disabled={busy || code.length !== 6}><KeyRound /> {t.auth.verify}</Button>
            <button type="button" className="w-full text-center text-xs text-muted-foreground underline" onClick={send} disabled={busy}>{t.auth.resend}</button>
          </form>
        )}
        {error && <p className="mt-4 rounded-md bg-danger/10 p-3 text-sm text-danger" role="alert">{t.auth.errors[error] ?? error}</p>}
      </div>
    </div>
  );
}

export default function LoginPage() { return <React.Suspense fallback={null}><LoginInner /></React.Suspense>; }
