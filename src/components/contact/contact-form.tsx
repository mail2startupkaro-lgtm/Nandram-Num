'use client';
import * as React from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, HelpCircle, Mail, MessageCircle, Phone, Send, Sparkles, Wrench } from 'lucide-react';
import { useApp } from '@/components/layout/providers';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { api, ApiError } from '@/lib/client/api';
import { CONTACT_SUBJECTS, type ContactTopic } from '@/lib/contact-options';
import { cn } from '@/lib/utils';
import { useDisplayCurrency, useTimeZone } from '@/lib/client/currency';
import { istHourIn, isIST } from '@/lib/client/working-hours';

const T = {
  en: {
    formTitle: 'Send us a message', formSub: 'Fields marked * are required. Your details are kept private and used only to reply to you.',
    topics: { service: ['Services enquiry', 'Reports, consultation, name & number guidance'], support: ['Support', 'Payment, report, login or website help'], other: ['Anything else', 'Feedback, partnership or a general question'] },
    name: 'Your name', phone: 'Mobile number', phoneHint: '10-digit Indian mobile, or +country code for outside India', email: 'Email (optional)', emailHint: 'Add it if you would like a reply by email',
    subject: { service: 'Which service?', support: 'What do you need help with?', other: 'Subject' }, choose: 'Choose…', message: 'Your message', messagePh: 'Tell us how we can help. For a reading, you can mention your date of birth and the question you have.',
    count: (n: number) => `${n}/3000`, send: 'Send message', sending: 'Sending…', privacy: 'Please do not share Aadhaar, bank or card numbers in this form.',
    okTitle: 'Thank you! Your message has been received.', okText: (r: string) => `Reference: ${r}. Our team will contact you on your mobile number within 24 hours (Monday–Saturday).`, another: 'Send another message', reading: 'Meanwhile, get your free reading',
    errors: { PHONE_INVALID: 'Please enter a valid mobile number.', name: 'Please enter your name (at least 2 letters).', email: 'Please enter a valid email or leave it empty.', message: 'Please write a short message (at least 5 characters).', subject: 'Please choose an option.', TOO_MANY: 'Too many messages from this connection. Please try again later.', generic: 'Could not send your message. Please try again or contact us on WhatsApp.' },
    other: 'Other ways to reach us', wa: 'Chat on WhatsApp', waSub: 'Quickest reply', mail: 'Email', call: 'Phone', hours: 'Hours', hoursText: 'Monday–Saturday, 10 am – 7 pm IST', faqs: 'Quick answers',
    faq: [['How soon will I get a reply?', 'Usually within a few hours and always within 24 hours on working days.'], ['Can I get my report in Hindi?', 'Yes. Every report is available in English, Hindi or Hinglish.'], ['I paid but my plan is not active.', 'UPI payments can take a few minutes. If it is still not active after 30 minutes, choose Support → Payment and send us your order details.']] as [string, string][],
    free: 'Try the free calculators', freeSub: 'Moolank, Bhagyank, Lo Shu grid, name and mobile number – instant and free.',
  },
  hi: {
    formTitle: 'हमें संदेश भेजें', formSub: '* वाले फ़ील्ड आवश्यक हैं। आपकी जानकारी गोपनीय रखी जाती है और केवल आपको उत्तर देने के लिए उपयोग होती है।',
    topics: { service: ['सेवा संबंधी पूछताछ', 'रिपोर्ट, परामर्श, नाम और अंक मार्गदर्शन'], support: ['सहायता', 'भुगतान, रिपोर्ट, लॉगिन या वेबसाइट से जुड़ी मदद'], other: ['अन्य', 'प्रतिक्रिया, साझेदारी या सामान्य प्रश्न'] },
    name: 'आपका नाम', phone: 'मोबाइल नंबर', phoneHint: '10 अंकों का भारतीय मोबाइल, या भारत से बाहर के लिए +देश कोड', email: 'ईमेल (वैकल्पिक)', emailHint: 'यदि आप ईमेल पर उत्तर चाहते हैं तो लिखें',
    subject: { service: 'कौन-सी सेवा?', support: 'किस बात में मदद चाहिए?', other: 'विषय' }, choose: 'चुनें…', message: 'आपका संदेश', messagePh: 'बताएँ हम आपकी कैसे मदद कर सकते हैं। रीडिंग के लिए आप अपनी जन्म तिथि और अपना प्रश्न लिख सकते हैं।',
    count: (n: number) => `${n}/3000`, send: 'संदेश भेजें', sending: 'भेजा जा रहा है…', privacy: 'कृपया इस फ़ॉर्म में आधार, बैंक या कार्ड नंबर न लिखें।',
    okTitle: 'धन्यवाद! आपका संदेश हमें मिल गया है।', okText: (r: string) => `संदर्भ: ${r}। हमारी टीम 24 घंटे के भीतर (सोमवार–शनिवार) आपके मोबाइल नंबर पर संपर्क करेगी।`, another: 'एक और संदेश भेजें', reading: 'तब तक अपनी मुफ़्त रीडिंग पाएँ',
    errors: { PHONE_INVALID: 'कृपया मान्य मोबाइल नंबर दर्ज करें।', name: 'कृपया अपना नाम लिखें (कम से कम 2 अक्षर)।', email: 'कृपया मान्य ईमेल लिखें या इसे ख़ाली छोड़ दें।', message: 'कृपया छोटा-सा संदेश लिखें (कम से कम 5 अक्षर)।', subject: 'कृपया एक विकल्प चुनें।', TOO_MANY: 'इस कनेक्शन से बहुत अधिक संदेश भेजे गए हैं। कृपया कुछ देर बाद प्रयास करें।', generic: 'संदेश नहीं भेजा जा सका। कृपया फिर प्रयास करें या WhatsApp पर संपर्क करें।' },
    other: 'संपर्क के अन्य तरीक़े', wa: 'WhatsApp पर बात करें', waSub: 'सबसे जल्दी उत्तर', mail: 'ईमेल', call: 'फ़ोन', hours: 'समय', hoursText: 'सोमवार–शनिवार, सुबह 10 – शाम 7 बजे (IST)', faqs: 'त्वरित उत्तर',
    faq: [['उत्तर कितनी जल्दी मिलेगा?', 'आमतौर पर कुछ घंटों में, और कार्य-दिवसों पर हमेशा 24 घंटे के भीतर।'], ['क्या मेरी रिपोर्ट हिंदी में मिल सकती है?', 'हाँ। हर रिपोर्ट अंग्रेज़ी, हिंदी या हिंग्लिश में उपलब्ध है।'], ['भुगतान हो गया पर प्लान सक्रिय नहीं हुआ।', 'UPI भुगतान में कुछ मिनट लग सकते हैं। 30 मिनट बाद भी सक्रिय न हो तो सहायता → भुगतान चुनकर अपने ऑर्डर का विवरण भेजें।']] as [string, string][],
    free: 'मुफ़्त कैलकुलेटर आज़माएँ', freeSub: 'मूलांक, भाग्यांक, लो शू ग्रिड, नाम और मोबाइल नंबर – तुरंत और मुफ़्त।',
  },
};
const ICON = { service: Sparkles, support: Wrench, other: HelpCircle } as const;

export function ContactForm({ whatsapp, email, phone }: { whatsapp: string | null; email: string | null; phone: string | null }) {
  const abroad = useDisplayCurrency() === 'USD';
  const tz = useTimeZone();
  const { lang, me } = useApp();
  const t = T[lang];
  const [topic, setTopic] = React.useState<ContactTopic>('service');
  const [subject, setSubject] = React.useState('');
  const [f, setF] = React.useState({ name: '', phone: '', email: '', message: '', website: '' });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState<string | null>(null);
  const [fail, setFail] = React.useState<string | null>(null);

  React.useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const tp = q.get('topic') as ContactTopic | null;
    if (tp && tp in CONTACT_SUBJECTS) { setTopic(tp); const s = q.get('subject'); if (s && CONTACT_SUBJECTS[tp].some((x) => x.id === s)) setSubject(s); }
  }, []);
  React.useEffect(() => {
    const u = me?.user; if (!u) return;
    setF((x) => ({ ...x, name: x.name || u.name || '', phone: x.phone || (u.phone ?? '').replace(/^\+91/, ''), email: x.email || u.email || '' }));
  }, [me?.user]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setF({ ...f, [k]: e.target.value }); setErrors((x) => ({ ...x, [k]: '' })); };

  function validate() {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = t.errors.name;
    const d = f.phone.replace(/\D/g, '');
    if (!(/^(?:\+?91|0)?[6-9]\d{9}$/.test(f.phone.replace(/[\s-]/g, '')) || (f.phone.trim().startsWith('+') && d.length >= 8 && d.length <= 15))) e.phone = t.errors.PHONE_INVALID;
    if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = t.errors.email;
    if (!subject) e.subject = t.errors.subject;
    if (f.message.trim().length < 5) e.message = t.errors.message;
    setErrors(e); return Object.keys(e).length === 0;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault(); setFail(null);
    if (!validate()) return;
    setBusy(true);
    try {
      const r = await api<{ ok: boolean; id?: string }>('/api/contact', { method: 'POST', json: { ...f, topic, subject, language: lang, page: document.referrer ? new URL(document.referrer).pathname : '/contact' } });
      setDone((r.id ?? '').slice(0, 8).toUpperCase() || 'OK');
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) setFail(t.errors.TOO_MANY);
      else if (e instanceof ApiError && e.body.error === 'VALIDATION') {
        const issues = (e.body as { issues?: { path: string; message: string }[] }).issues ?? [];
        const map: Record<string, string> = {};
        for (const i of issues) map[i.path] = i.path === 'phone' ? t.errors.PHONE_INVALID : i.path === 'email' ? t.errors.email : i.path === 'name' ? t.errors.name : i.path === 'message' ? t.errors.message : t.errors.subject;
        setErrors(map); if (!issues.length) setFail(t.errors.generic);
      } else setFail(t.errors.generic);
    } finally { setBusy(false); }
  }

  const waText = encodeURIComponent(lang === 'hi' ? 'नमस्ते, मुझे अंक ज्योतिष के बारे में जानकारी चाहिए।' : 'Hello, I would like to know about your numerology services.');

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <section className="glass rounded-2xl border border-gold/30 p-5 sm:p-8">
        {done ? (
          <div className="space-y-4 py-6 text-center" role="status">
            <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
            <h2 className="font-cinzel text-2xl font-bold">{t.okTitle}</h2>
            <p className="text-muted-foreground">{t.okText(done)}</p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button variant="outline" onClick={() => { setDone(null); setF((x) => ({ ...x, message: '' })); setSubject(''); }}>{t.another}</Button>
              <Link href="/reading" className="inline-flex h-10 items-center rounded-md bg-gradient-to-r from-[hsl(43_75%_42%)] to-[hsl(43_85%_58%)] px-4 text-sm font-semibold text-[hsl(250_45%_10%)]">{t.reading}</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-5">
            <div><h2 className="font-cinzel text-2xl font-bold">{t.formTitle}</h2><p className="mt-1 text-sm text-muted-foreground">{t.formSub}</p></div>
            <fieldset>
              <legend className="sr-only">{lang === 'hi' ? 'संदेश का प्रकार' : 'Type of message'}</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {(Object.keys(CONTACT_SUBJECTS) as ContactTopic[]).map((k) => { const I = ICON[k]; const on = topic === k; return (
                  <button key={k} type="button" aria-pressed={on} onClick={() => { setTopic(k); setSubject(''); setErrors((x) => ({ ...x, subject: '' })); }}
                    className={cn('rounded-xl border p-3 text-left transition', on ? 'border-gold bg-gold/15 shadow-[0_0_18px_hsl(var(--gold)/0.25)]' : 'border-gold/25 hover:border-gold/60')}>
                    <span className="flex items-center gap-2 font-semibold"><I className="h-4 w-4 text-gold" />{t.topics[k][0]}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{t.topics[k][1]}</span>
                  </button>
                ); })}
              </div>
            </fieldset>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.name} htmlFor="c-name" required error={errors.name}><Input id="c-name" autoComplete="name" value={f.name} onChange={set('name')} maxLength={120} /></Field>
              <Field label={t.phone} htmlFor="c-phone" required hint={t.phoneHint} error={errors.phone}><Input id="c-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder={abroad ? '+1 415 555 0123' : '98765 43210'} value={f.phone} onChange={set('phone')} maxLength={20} /></Field>
              <Field label={t.email} htmlFor="c-email" hint={t.emailHint} error={errors.email}><Input id="c-email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={f.email} onChange={set('email')} maxLength={320} /></Field>
              <Field label={t.subject[topic]} htmlFor="c-subject" required error={errors.subject}>
                <Select id="c-subject" value={subject} onChange={(e) => { setSubject(e.target.value); setErrors((x) => ({ ...x, subject: '' })); }}>
                  <option value="">{t.choose}</option>
                  {CONTACT_SUBJECTS[topic].map((s) => <option key={s.id} value={s.id}>{s[lang]}</option>)}
                </Select>
              </Field>
            </div>
            <Field label={t.message} htmlFor="c-msg" required error={errors.message}>
              <textarea id="c-msg" rows={6} maxLength={3000} value={f.message} onChange={set('message')} placeholder={t.messagePh}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              <span className="mt-1 block text-right text-[11px] text-muted-foreground">{t.count(f.message.length)}</span>
            </Field>
            {/* honeypot: hidden from people and screen readers */}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={set('website')} className="absolute left-[-9999px] h-0 w-0 opacity-0" />
            <p className="text-xs text-muted-foreground">{t.privacy}</p>
            {fail && <p className="text-sm text-danger" role="alert">{fail}</p>}
            <Button type="submit" variant="gold" size="lg" disabled={busy} className="w-full sm:w-auto"><Send className="h-4 w-4" />{busy ? t.sending : t.send}</Button>
          </form>
        )}
      </section>

      <aside className="space-y-4">
        <div className="glass rounded-2xl border border-gold/25 p-5">
          <h2 className="mb-3 font-serif text-lg font-semibold">{t.other}</h2>
          <ul className="space-y-3 text-sm">
            {whatsapp && <li><a href={`https://wa.me/${whatsapp}?text=${waText}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg border border-success/40 bg-success/10 p-3 hover:brightness-110"><MessageCircle className="h-5 w-5 text-success" /><span><b>{t.wa}</b><span className="block text-xs text-muted-foreground">{t.waSub}</span></span></a></li>}
            {email && <li className="flex items-center gap-3"><Mail className="h-4 w-4 text-gold" /><span><span className="block text-xs text-muted-foreground">{t.mail}</span><a href={`mailto:${email}`} className="hover:text-gold">{email}</a></span></li>}
            {phone && <li className="flex items-center gap-3"><Phone className="h-4 w-4 text-gold" /><span><span className="block text-xs text-muted-foreground">{t.call}</span><a href={`tel:${phone.replace(/[^\d+]/g, '')}`} className="hover:text-gold">{phone}</a></span></li>}
            <li className="flex items-center gap-3"><Clock className="h-4 w-4 text-gold" /><span><span className="block text-xs text-muted-foreground">{t.hours}</span>{t.hoursText}{!isIST(tz) && <span className="block text-xs text-muted-foreground">{lang === 'hi' ? `आपके समय में: ${istHourIn(tz, 10, 'hi')} – ${istHourIn(tz, 19, 'hi')}` : `Your time: ${istHourIn(tz, 10)} – ${istHourIn(tz, 19)}`}</span>}</span></li>
          </ul>
        </div>
        <div className="glass rounded-2xl border border-gold/25 p-5">
          <h2 className="mb-3 font-serif text-lg font-semibold">{t.faqs}</h2>
          <div className="space-y-2">{t.faq.map(([q, a]) => <details key={q} className="rounded-lg border border-border/60 p-3 text-sm"><summary className="cursor-pointer font-medium">{q}</summary><p className="mt-1 text-muted-foreground">{a}</p></details>)}</div>
        </div>
        <Link href="/calculators" className="mk-card block rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/15 to-maroon/20 p-5">
          <p className="font-serif text-lg font-semibold">{t.free} →</p><p className="mt-1 text-xs text-muted-foreground">{t.freeSub}</p>
        </Link>
      </aside>
    </div>
  );
}
