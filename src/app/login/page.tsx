'use client';
import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, LogIn, Shield, UserPlus } from 'lucide-react';
import { useApp } from '@/components/layout/providers';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { Tabs } from '@/components/ui/misc';
import { api, ApiError } from '@/lib/client/api';

function PasswordInput({ id, value, onChange, autoComplete, show, setShow }: {
  id: string; value: string; onChange: (v: string) => void; autoComplete: string; show: boolean; setShow: (v: boolean) => void;
}) {
  const { lang } = useApp();
  const hi = lang === 'hi';
  return (
    <div className="relative">
      <Input id={id} type={show ? 'text' : 'password'} autoComplete={autoComplete} value={value} onChange={(e) => onChange(e.target.value)} className="pr-10" required />
      <button type="button" onClick={() => setShow(!show)} aria-label={show ? (hi ? 'पासवर्ड छिपाएँ' : 'Hide password') : (hi ? 'पासवर्ड दिखाएँ' : 'Show password')}
        className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function LoginInner() {
  const { t, me, refreshMe } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const rawNext = params.get('next') ?? '';
  const next = /^\/(?![/\\])/.test(rawNext) ? rawNext : '/dashboard'; // same-site paths only (blocks //evil.com)
  const adminMode = next.startsWith('/admin');
  const [mode, setMode] = React.useState<'signin' | 'signup' | 'forgot'>(params.get('mode') === 'signup' && !adminMode ? 'signup' : 'signin');
  const [identifier, setIdentifier] = React.useState('');
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [mobile, setMobile] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [show, setShow] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(params.get('error'));
  const [success, setSuccess] = React.useState<string | null>(null);

  // Forgot password states
  const [forgotStep, setForgotStep] = React.useState<'request' | 'reset'>('request');
  const [otpCode, setOtpCode] = React.useState('');
  const [devOtp, setDevOtp] = React.useState<string | null>(null);

  const errText = (code: string) => t.auth.errors[code] ?? code;
  const msg = (e: unknown) => (e instanceof ApiError ? (e.body.error === 'VALIDATION' ? t.auth.errors.VALIDATION : e.body.error ?? e.message) : 'INTERNAL');

  React.useEffect(() => { if (me?.user) router.replace(next); }, [me, next, router]);

  async function signin() {
    setBusy(true); setError(null); setSuccess(null);
    try {
      await api('/api/auth/login', { method: 'POST', json: { identifier, password } });
      await refreshMe(); router.replace(next);
    } catch (e) { setError(msg(e)); } finally { setBusy(false); }
  }

  async function signup() {
    if (password.length < 8) return setError('WEAK_PASSWORD');
    if (password !== confirm) return setError('PASSWORD_MISMATCH');
    setBusy(true); setError(null); setSuccess(null);
    try {
      await api('/api/auth/signup', { method: 'POST', json: { name, email, mobile, password } });
      await refreshMe(); router.replace(next);
    } catch (e) { setError(msg(e)); } finally { setBusy(false); }
  }

  async function requestResetOtp() {
    if (identifier.trim().length < 3) return;
    setBusy(true); setError(null); setSuccess(null);
    try {
      const channel = identifier.includes('@') ? 'email' : 'sms';
      const res = await api<{ devCode?: string }>('/api/auth/otp/request', { method: 'POST', json: { channel, identifier } });
      if (res.devCode) setDevOtp(res.devCode);
      setForgotStep('reset');
    } catch (e) { setError(msg(e)); } finally { setBusy(false); }
  }

  async function resetPassword() {
    if (password.length < 8) return setError('WEAK_PASSWORD');
    if (password !== confirm) return setError('PASSWORD_MISMATCH');
    setBusy(true); setError(null);
    try {
      await api('/api/auth/reset-password', { method: 'POST', json: { identifier, code: otpCode.trim(), newPassword: password } });
      setSuccess(t.auth.resetSuccess);
      setMode('signin');
      setForgotStep('request');
      setPassword('');
      setConfirm('');
      setOtpCode('');
      setDevOtp(null);
    } catch (e) { setError(msg(e)); } finally { setBusy(false); }
  }

  return (
    <div className="container flex justify-center py-12 sm:py-20">
      <div className="glass w-full max-w-md rounded-lg p-6 sm:p-8">
        {adminMode && <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-gold/40 px-3 py-1 text-xs text-gold"><Shield className="h-3.5 w-3.5" />{t.auth.adminLogin}</p>}
        
        {mode === 'forgot' ? (
          <div>
            <button type="button" onClick={() => { setMode('signin'); setError(null); setSuccess(null); }} className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> {t.auth.backToSignin}
            </button>
            <h1 className="text-3xl font-bold">{t.auth.resetTitle}</h1>
            <p className="mb-6 mt-1 text-sm text-muted-foreground">{t.auth.resetSub}</p>

            {forgotStep === 'request' ? (
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); requestResetOtp(); }}>
                <Field label={t.auth.identLabel} htmlFor="forgot-ident">
                  <Input id="forgot-ident" autoFocus placeholder={t.auth.identPlaceholder} value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
                </Field>
                <Button type="submit" variant="gold" className="w-full" disabled={busy || identifier.trim().length < 3}>
                  <KeyRound className="h-4 w-4" /> {t.auth.sendCode}
                </Button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); resetPassword(); }}>
                <Field label={t.auth.code} htmlFor="otp-code">
                  <Input id="otp-code" autoFocus inputMode="numeric" maxLength={6} placeholder="123456" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} required />
                </Field>
                {devOtp && <p className="text-xs text-gold bg-gold/10 p-2 rounded">{t.auth.devCode}: <b>{devOtp}</b></p>}
                <Field label={t.auth.newPassword} htmlFor="new-pw" hint={t.auth.passwordHint} required>
                  <PasswordInput id="new-pw" value={password} onChange={setPassword} autoComplete="new-password" show={show} setShow={setShow} />
                </Field>
                <Field label={t.auth.confirmPassword} htmlFor="confirm-pw" required>
                  <PasswordInput id="confirm-pw" value={confirm} onChange={setConfirm} autoComplete="new-password" show={show} setShow={setShow} />
                </Field>
                <Button type="submit" variant="gold" className="w-full" disabled={busy || otpCode.length !== 6 || password.length < 8}>
                  <CheckCircle2 className="h-4 w-4" /> {t.auth.resetPassword}
                </Button>
              </form>
            )}
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold">{mode === 'signin' ? t.auth.title : t.auth.signupTitle}</h1>
            <p className="mb-6 mt-1 text-sm text-muted-foreground">{mode === 'signin' ? t.auth.sub : t.auth.signupSub}</p>
            {!adminMode && (
              <Tabs className="mb-5" tabs={[{ value: 'signin', label: t.auth.signin }, { value: 'signup', label: t.auth.signup }]} value={mode}
                onChange={(v) => { setMode(v as 'signin' | 'signup'); setError(null); setSuccess(null); setPassword(''); setConfirm(''); }} />
            )}
            {me?.providers.google && !adminMode && (
              <>
                <a href={`/api/auth/google?next=${encodeURIComponent(next)}`} className="flex h-11 w-full items-center justify-center gap-3 rounded-md border border-border bg-white text-sm font-medium text-[#1f1f1f] hover:bg-gray-50">
                  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
                  {t.auth.google}
                </a>
                <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />{t.auth.or}<span className="h-px flex-1 bg-border" /></div>
              </>
            )}
            {mode === 'signin' ? (
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); signin(); }}>
                <Field label={t.auth.identLabel} htmlFor="ident">
                  <Input id="ident" autoFocus autoComplete="username" placeholder={t.auth.identPlaceholder} value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
                </Field>
                <div>
                  <Field label={t.auth.password} htmlFor="pw">
                    <PasswordInput id="pw" value={password} onChange={setPassword} autoComplete="current-password" show={show} setShow={setShow} />
                  </Field>
                  <div className="mt-1.5 flex justify-end">
                    <button type="button" onClick={() => { setMode('forgot'); setError(null); setSuccess(null); }} className="text-xs text-gold hover:underline">
                      {t.auth.forgotPassword}
                    </button>
                  </div>
                </div>
                <Button type="submit" variant="gold" className="w-full" disabled={busy || identifier.length < 3 || !password}><LogIn /> {t.auth.verify}</Button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); signup(); }}>
                <Field label={t.auth.fullName} htmlFor="nm" required><Input id="nm" autoFocus autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required /></Field>
                <Field label={t.auth.emailLabel} htmlFor="em" required><Input id="em" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
                <Field label={t.auth.mobileLabel} htmlFor="mb" required><Input id="mb" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="98765 43210" value={mobile} onChange={(e) => setMobile(e.target.value)} required /></Field>
                <Field label={t.auth.password} htmlFor="pw1" hint={t.auth.passwordHint} required>
                  <PasswordInput id="pw1" value={password} onChange={setPassword} autoComplete="new-password" show={show} setShow={setShow} />
                </Field>
                <Field label={t.auth.confirmPassword} htmlFor="pw2" required>
                  <PasswordInput id="pw2" value={confirm} onChange={setConfirm} autoComplete="new-password" show={show} setShow={setShow} />
                </Field>
                <Button type="submit" variant="gold" className="w-full" disabled={busy || name.trim().length < 2 || !email || mobile.length < 10 || !password}><UserPlus /> {t.auth.createAccount}</Button>
              </form>
            )}
          </>
        )}

        {success && <p className="mt-4 rounded-md bg-success/15 p-3 text-sm text-success" role="status">{success}</p>}
        {error && <p className="mt-4 rounded-md bg-danger/10 p-3 text-sm text-danger" role="alert">{errText(error)}</p>}
        {!adminMode && (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            <a href="/login?next=%2Fadmin" className="inline-flex items-center gap-1 hover:text-foreground"><Shield className="h-3 w-3" />{t.auth.adminLogin}</a>
          </p>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() { return <React.Suspense fallback={null}><LoginInner /></React.Suspense>; }
