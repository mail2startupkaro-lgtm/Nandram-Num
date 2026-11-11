'use client';
import * as React from 'react';
import { KeyRound, LogOut, ShieldCheck, Trash2 } from 'lucide-react';
import { useApp } from '@/components/layout/providers';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { api, ApiError } from '@/lib/client/api';

const T = {
  en: { title: 'Security & privacy', sub: 'Your saved readings are encrypted. You control your password, your devices and your data.',
    pw: 'Change password', setPw: 'Set a password', cur: 'Current password', next: 'New password (at least 8 characters)', again: 'Repeat new password', save: 'Update password',
    pwOk: (n: number) => `Password updated.${n ? ` Signed out of ${n} other device${n > 1 ? 's' : ''}.` : ''}`, mismatch: 'The two new passwords do not match.',
    devices: 'Other devices', devicesP: 'Sign out everywhere except this device, for example if you used a shared computer.', signOut: 'Sign out other devices', devOk: (n: number) => (n ? `Signed out of ${n} other device${n > 1 ? 's' : ''}.` : 'No other devices were signed in.'),
    del: 'Delete my account and data', delP: 'This permanently deletes your saved readings, reports, share links and branding. If you have paid orders, invoices are kept as the law requires but your name, email and mobile are removed from the account. This cannot be undone.',
    delOpen: 'Delete my account…', type: 'Type DELETE to confirm', password: 'Your password', delBtn: 'Permanently delete', cancel: 'Cancel',
    errors: { INVALID_CREDENTIALS: 'The password is not correct.', WEAK_PASSWORD: 'Password must be at least 8 characters.', SAME_PASSWORD: 'The new password must be different from the current one.', ADMIN_CANNOT_SELF_DELETE: 'The admin account cannot be deleted here.', generic: 'Something went wrong. Please try again.' } as Record<string, string> },
  hi: { title: 'सुरक्षा और गोपनीयता', sub: 'आपकी सहेजी गई रीडिंग एन्क्रिप्टेड हैं। पासवर्ड, डिवाइस और डेटा पर आपका पूरा नियंत्रण है।',
    pw: 'पासवर्ड बदलें', setPw: 'पासवर्ड सेट करें', cur: 'वर्तमान पासवर्ड', next: 'नया पासवर्ड (कम से कम 8 अक्षर)', again: 'नया पासवर्ड दोबारा लिखें', save: 'पासवर्ड अपडेट करें',
    pwOk: (n: number) => `पासवर्ड अपडेट हो गया।${n ? ` ${n} अन्य डिवाइस से साइन आउट किया गया।` : ''}`, mismatch: 'दोनों नए पासवर्ड मेल नहीं खाते।',
    devices: 'अन्य डिवाइस', devicesP: 'इस डिवाइस को छोड़कर हर जगह से साइन आउट करें, जैसे यदि आपने किसी साझा कंप्यूटर का उपयोग किया हो।', signOut: 'अन्य डिवाइस से साइन आउट करें', devOk: (n: number) => (n ? `${n} अन्य डिवाइस से साइन आउट किया गया।` : 'कोई अन्य डिवाइस साइन इन नहीं था।'),
    del: 'मेरा खाता और डेटा हटाएँ', delP: 'इससे आपकी सहेजी गई रीडिंग, रिपोर्ट, शेयर लिंक और ब्रांडिंग स्थायी रूप से हट जाएँगी। यदि आपके सशुल्क ऑर्डर हैं तो क़ानून के अनुसार इनवॉइस रखे जाते हैं, पर खाते से आपका नाम, ईमेल और मोबाइल हटा दिए जाते हैं। इसे वापस नहीं किया जा सकता।',
    delOpen: 'मेरा खाता हटाएँ…', type: 'पुष्टि के लिए DELETE लिखें', password: 'आपका पासवर्ड', delBtn: 'स्थायी रूप से हटाएँ', cancel: 'रद्द करें',
    errors: { INVALID_CREDENTIALS: 'पासवर्ड सही नहीं है।', WEAK_PASSWORD: 'पासवर्ड कम से कम 8 अक्षरों का होना चाहिए।', SAME_PASSWORD: 'नया पासवर्ड वर्तमान पासवर्ड से अलग होना चाहिए।', ADMIN_CANNOT_SELF_DELETE: 'एडमिन खाता यहाँ से नहीं हटाया जा सकता।', generic: 'कुछ गड़बड़ हुई। कृपया फिर प्रयास करें।' } as Record<string, string> },
};

export function SecurityPanel({ hasPassword, isAdmin }: { hasPassword: boolean; isAdmin: boolean }) {
  const { lang } = useApp();
  const t = T[lang];
  const [pw, setPw] = React.useState({ current: '', next: '', again: '' });
  const [msg, setMsg] = React.useState<{ where: 'pw' | 'dev' | 'del'; ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [del, setDel] = React.useState<{ open: boolean; confirm: string; password: string }>({ open: false, confirm: '', password: '' });
  const [hasPw, setHasPw] = React.useState(hasPassword);
  const err = (e: unknown) => (e instanceof ApiError ? t.errors[e.body.error ?? ''] ?? t.errors.generic : t.errors.generic);
  const note = (where: 'pw' | 'dev' | 'del') => msg?.where === where ? <p className={`text-sm ${msg.ok ? 'text-success' : 'text-danger'}`} role="status">{msg.text}</p> : null;

  async function changePw(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    if (pw.next !== pw.again) return setMsg({ where: 'pw', ok: false, text: t.mismatch });
    if (pw.next.length < 8) return setMsg({ where: 'pw', ok: false, text: t.errors.WEAK_PASSWORD });
    setBusy(true);
    try { const r = await api<{ sessionsEnded: number }>('/api/account/password', { method: 'POST', json: { current: pw.current, next: pw.next } }); setPw({ current: '', next: '', again: '' }); setHasPw(true); setMsg({ where: 'pw', ok: true, text: t.pwOk(r.sessionsEnded) }); }
    catch (e2) { setMsg({ where: 'pw', ok: false, text: err(e2) }); } finally { setBusy(false); }
  }
  async function signOutOthers() {
    setBusy(true); setMsg(null);
    try { const r = await api<{ sessionsEnded: number }>('/api/account/sessions', { method: 'DELETE' }); setMsg({ where: 'dev', ok: true, text: t.devOk(r.sessionsEnded) }); }
    catch (e2) { setMsg({ where: 'dev', ok: false, text: err(e2) }); } finally { setBusy(false); }
  }
  async function erase() {
    setBusy(true); setMsg(null);
    try { await api('/api/account', { method: 'DELETE', json: { password: del.password, confirm: 'DELETE' } }); window.location.replace('/'); }
    catch (e2) { setMsg({ where: 'del', ok: false, text: err(e2) }); setBusy(false); }
  }

  return (
    <section className="glass space-y-6 rounded-lg p-5">
      <div><h2 className="flex items-center gap-2 text-xl font-semibold"><ShieldCheck className="h-5 w-5 text-gold" />{t.title}</h2><p className="mt-1 text-sm text-muted-foreground">{t.sub}</p></div>
      <form onSubmit={changePw} className="space-y-3">
        <h3 className="flex items-center gap-2 font-semibold"><KeyRound className="h-4 w-4 text-gold" />{hasPw ? t.pw : t.setPw}</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {hasPw && <Field label={t.cur} htmlFor="pw-cur"><Input id="pw-cur" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required /></Field>}
          <Field label={t.next} htmlFor="pw-next"><Input id="pw-next" type="password" autoComplete="new-password" minLength={8} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required /></Field>
          <Field label={t.again} htmlFor="pw-again"><Input id="pw-again" type="password" autoComplete="new-password" minLength={8} value={pw.again} onChange={(e) => setPw({ ...pw, again: e.target.value })} required /></Field>
        </div>
        <Button type="submit" variant="outline" size="sm" disabled={busy}>{t.save}</Button>{note('pw')}
      </form>
      <div className="space-y-2 border-t border-border/50 pt-4">
        <h3 className="flex items-center gap-2 font-semibold"><LogOut className="h-4 w-4 text-gold" />{t.devices}</h3>
        <p className="text-sm text-muted-foreground">{t.devicesP}</p>
        <Button variant="outline" size="sm" disabled={busy} onClick={signOutOthers}>{t.signOut}</Button>{note('dev')}
      </div>
      {!isAdmin && (
        <div className="space-y-2 border-t border-border/50 pt-4">
          <h3 className="flex items-center gap-2 font-semibold text-danger"><Trash2 className="h-4 w-4" />{t.del}</h3>
          <p className="text-sm text-muted-foreground">{t.delP}</p>
          {!del.open ? <Button variant="ghost" size="sm" className="text-danger" onClick={() => setDel({ ...del, open: true })}>{t.delOpen}</Button> : (
            <div className="grid max-w-md gap-3 rounded-md border border-danger/40 p-3">
              {hasPw && <Field label={t.password} htmlFor="del-pw"><Input id="del-pw" type="password" autoComplete="current-password" value={del.password} onChange={(e) => setDel({ ...del, password: e.target.value })} /></Field>}
              <Field label={t.type} htmlFor="del-c"><Input id="del-c" value={del.confirm} onChange={(e) => setDel({ ...del, confirm: e.target.value })} autoComplete="off" /></Field>
              <div className="flex gap-2"><Button size="sm" disabled={busy || del.confirm !== 'DELETE' || (hasPw && !del.password)} onClick={erase} className="bg-danger text-white hover:bg-danger/90">{t.delBtn}</Button><Button size="sm" variant="ghost" onClick={() => setDel({ open: false, confirm: '', password: '' })}>{t.cancel}</Button></div>
              {note('del')}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
