'use client';
import * as React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  CheckCircle2,
  Download,
  ExternalLink,
  Gift,
  HelpCircle,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  User,
} from 'lucide-react';
import { useApp } from '@/components/layout/providers';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { api, ApiError } from '@/lib/client/api';
import { trackEvent } from '@/lib/client/analytics';
import { todayIST, toIso } from '@/lib/numerology';
import { Bi } from '@/components/i18n/bi';

const PDF_URL = '/ebooks/numerology-made-easy-guide.pdf';
const PDF_FILENAME = 'Numerology-Made-Easy-Beginner-Guide-Acharya-Nandram.pdf';
const WHATSAPP_NUMBER = '918819999374';

const CHAPTERS = [
  { no: 1, hi: 'अंक ज्योतिष क्या है?', en: 'What is numerology?', page: 3 },
  { no: 2, hi: 'आपकी रिपोर्ट का नक्शा', en: 'Map of your report', page: 4 },
  { no: 3, hi: 'मूलांक (Root number)', en: 'Moolank (Root number)', page: 5 },
  { no: 4, hi: 'भाग्यांक (Destiny number)', en: 'Bhagyank (Destiny number)', page: 6 },
  { no: 5, hi: 'अंक 1 से 9 का स्वभाव', en: 'Nature of numbers 1 to 9', page: 7 },
  { no: 6, hi: 'लो-शू ग्रिड (Lo Shu grid)', en: 'Lo Shu grid & rajyogs', page: 9 },
  { no: 7, hi: 'कुआ नंबर और दिशाएँ', en: 'Kua number & lucky directions', page: 11 },
  { no: 8, hi: 'नाम का अंक (Name number)', en: 'Name number (Chaldean)', page: 12 },
  { no: 9, hi: 'मोबाइल नंबर का रहस्य', en: 'Mobile number total & pairs', page: 13 },
  { no: 10, hi: 'मित्र और शत्रु अंक चार्ट', en: 'Friendly & challenging numbers', page: 14 },
  { no: 11, hi: 'व्यक्तिगत वर्ष (Personal year)', en: 'Personal year 9-year cycle', page: 15 },
  { no: 12, hi: 'शुभ तत्व, रत्न और सरल उपाय', en: 'Lucky elements, gems & remedies', page: 16 },
  { no: 13, hi: '10 मिनट में अपनी रिपोर्ट पढ़ें', en: 'Read your report in 10 minutes', page: 17 },
  { no: 14, hi: 'मेरी अंक वर्कशीट (प्रिंटेबल)', en: 'My Numerology Worksheet (Printable)', page: 18 },
  { no: 15, hi: 'भ्रम और सच · सामान्य प्रश्नोत्तर', en: 'Myths vs facts · Common FAQ', page: 19 },
  { no: 16, hi: 'अंक ज्योतिष शब्दकोश (Glossary)', en: 'Numerology Glossary', page: 20 },
];

export function EbookLandingContent() {
  const { lang, setLang } = useApp();
  const hi = lang === 'hi';

  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [dob, setDob] = React.useState('');
  const [consent, setConsent] = React.useState(true);
  const [website, setWebsite] = React.useState('');

  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{
    moolank: number | null;
    bhagyank: number | null;
    downloadUrl?: string;
  } | null>(null);

  const isValid = name.trim().length >= 2 && phone.replace(/\D/g, '').length >= 10 && consent;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || busy) return;

    setBusy(true);
    setErr(null);

    try {
      const res = await api<{
        ok: boolean;
        moolank: number | null;
        bhagyank: number | null;
        downloadUrl?: string;
      }>('/api/leads', {
        method: 'POST',
        json: {
          name: name.trim(),
          phone: phone.trim(),
          dob: dob || undefined,
          magnet: 'free-ebook',
          language: lang,
          consent: true,
          website,
          page: '/ebook',
          referrer: document.referrer || undefined,
        },
      });

      setResult({
        moolank: res.moolank,
        bhagyank: res.bhagyank,
        downloadUrl: res.downloadUrl || PDF_URL,
      });

      try {
        localStorage.setItem('mn_ebook_claimed', '1');
      } catch {
        // ignore
      }

      trackEvent('generate_lead', { lead_magnet: 'free-ebook', page: 'ebook_landing' });

      // Trigger automatic download
      const targetUrl = res.downloadUrl || PDF_URL;
      try {
        const link = document.createElement('a');
        link.href = targetUrl;
        link.setAttribute('download', PDF_FILENAME);
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch {
        // browser suppressed
      }
    } catch (err2) {
      if (err2 instanceof ApiError) {
        setErr(
          err2.body.issues?.[0]?.path === 'phone'
            ? hi
              ? 'कृपया सही 10-अंकों का मोबाइल/WhatsApp नंबर लिखें।'
              : 'Please enter a valid 10-digit mobile number.'
            : hi
            ? 'कुछ गड़बड़ हुई। कृपया पुनः प्रयास करें।'
            : 'Submission failed. Please try again.'
        );
      } else {
        setErr(hi ? 'कनेक्शन में त्रुटि।' : 'Network error.');
      }
    } finally {
      setBusy(false);
    }
  };

  const getWhatsAppChatUrl = () => {
    const text = hi
      ? `नमस्ते आचार्य जी, मैंने आपकी 'अंक ज्योतिष आसान शुरुआत' ई-बुक डाउनलोड की है। मेरा नाम ${name.trim() || ''} है।`
      : `Namaste Acharya ji, I have downloaded your 'Numerology Made Easy' eBook. My name is ${name.trim() || ''}.`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="container py-10 md:py-16">
      {/* Hero Section */}
      <div className="mx-auto max-w-4xl text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/50 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-300">
          <Gift className="h-4 w-4 text-gold" />
          <span>{hi ? 'मुफ़्त डिजिटल उपहार · 21-पेज संपूर्ण गाइड बुक' : 'Free Gift · 21-Page Complete Guide Book'}</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-amber-200 via-amber-300 to-amber-500 bg-clip-text text-transparent">
          {hi ? 'अंक ज्योतिष आसान शुरुआत' : 'Numerology Made Easy'}
        </h1>

        <p className="font-cinzel text-base sm:text-lg font-semibold tracking-wider text-gold/90 uppercase">
          A Beginner&apos;s Guide to Understanding Your Own Numerology Report
        </p>

        <p className="mx-auto max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
          {hi
            ? 'आचार्य नंदराम द्वारा रचित सरल, सचित्र मार्गदर्शिका। इसमें मूलांक, भाग्यांक, लो-शू ग्रिड, कुआ नंबर, मोबाइल नंबर और सरल उपायों को उदाहरण सहित समझाया गया है।'
            : 'Authored by Acharya Nandram. Learn the meaning of your Moolank, Bhagyank, Lo Shu Grid, Kua number, mobile number, and simple 40-day remedies with real examples.'}
        </p>
      </div>

      {/* Main Form & Preview Card */}
      <div className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-2xl border-2 border-gold/50 bg-gradient-to-b from-[#180f2b] via-[#120a22] to-[#0d0718] p-6 sm:p-10 shadow-[0_0_50px_rgba(217,119,6,0.25)]">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-center">
          {/* Left Book Preview */}
          <div className="md:col-span-5 text-center">
            <div className="relative mx-auto max-w-[220px] rounded-xl border border-amber-400/40 bg-gradient-to-b from-[#1b214a] via-[#141838] to-[#0f122c] p-5 shadow-[0_12px_32px_rgba(0,0,0,0.6)]">
              <span className="text-[8px] uppercase tracking-[0.25em] text-gold/80 block">myNumerologist.com</span>
              <div className="mx-auto my-3 flex h-16 w-16 items-center justify-center rounded-full border border-amber-400/30 bg-amber-500/10 text-xl font-bold text-amber-300">
                ॐ
              </div>
              <p className="font-serif text-lg font-bold text-amber-200">अंक ज्योतिष</p>
              <p className="text-xs font-semibold text-white">आसान शुरुआत</p>
              <p className="font-cinzel text-[10px] tracking-wider text-gold font-bold mt-1">NUMEROLOGY MADE EASY</p>
              <div className="my-2 h-[1px] w-16 mx-auto bg-amber-400/40" />
              <p className="text-[9px] text-amber-100/70 italic">अपनी न्यूमरोलॉजी रिपोर्ट खुद कैसे समझें</p>
              <p className="mt-3 text-[10px] font-semibold text-amber-300">आचार्य नंदराम · Acharya Nandram</p>
              <span className="mt-1 block text-[8px] text-muted-foreground uppercase">हिन्दी + English · 21 Pages PDF</span>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-amber-300">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span>4.9/5 · 10,000+ पाठकों द्वारा अनुशंसित</span>
            </div>
          </div>

          {/* Right Lead Capture / Download */}
          <div className="md:col-span-7">
            {!result ? (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <h3 className="font-serif text-2xl font-bold text-amber-200">
                    {hi ? 'मुफ़्त ई-बुक तुरंत डाउनलोड करें' : 'Download Free eBook Now'}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {hi
                      ? 'अपना नाम और संपर्क नंबर भरें और तुरंत PDF प्राप्त करें।'
                      : 'Enter your details below for instant PDF access.'}
                  </p>
                </div>

                <Field label={hi ? 'आपका नाम' : 'Your Name'} htmlFor="ebk-landing-name" required>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="ebk-landing-name"
                      className="pl-9"
                      placeholder={hi ? 'राहुल शर्मा' : 'Rahul Sharma'}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </Field>

                <Field label={hi ? 'संपर्क नंबर (WhatsApp)' : 'Contact Number (WhatsApp)'} htmlFor="ebk-landing-phone" required>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="ebk-landing-phone"
                      type="tel"
                      className="pl-9"
                      placeholder="98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </Field>

                <Field
                  label={
                    hi
                      ? 'जन्म तिथि (वैकल्पिक - मूलांक/भाग्यांक तुरंत देखने के लिए)'
                      : 'Date of Birth (Optional - reveals your numbers)'
                  }
                  htmlFor="ebk-landing-dob"
                >
                  <Input
                    id="ebk-landing-dob"
                    type="date"
                    min="1900-01-01"
                    max={toIso(todayIST())}
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                </Field>

                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="absolute left-[-9999px] h-0 w-0 opacity-0"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />

                <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 accent-amber-500 rounded cursor-pointer"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  <span>
                    {hi
                      ? 'मैं सहमत हूँ कि आचार्य नंदराम / myNumerologist.com मुझे WhatsApp पर ई-बुक और न्यूमरोलॉजी अपडेट भेज सकते हैं।'
                      : 'I agree that Acharya Nandram / myNumerologist.com may contact me on WhatsApp about my reading.'}
                  </span>
                </label>

                {err && <p className="text-xs text-danger">{err}</p>}

                <Button
                  type="submit"
                  variant="gold"
                  size="lg"
                  disabled={busy || !isValid}
                  className="w-full text-base font-semibold"
                >
                  <Download className="h-4 w-4" />
                  {busy ? (hi ? 'तैयार किया जा रहा है…' : 'Generating…') : (hi ? 'मुफ़्त ई-बुक (PDF) प्राप्त करें' : 'Get Free eBook (PDF)')}
                </Button>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/20 text-success border border-success/40">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-amber-200">
                  {hi ? `बधाई हो, ${name.trim()}!` : `Congratulations, ${name.trim()}!`}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {hi ? 'आपकी ई-बुक डाउनलोड शुरू हो चुकी है।' : 'Your free eBook download has started.'}
                </p>

                {result.moolank && result.bhagyank && (
                  <div className="rounded-xl border border-gold/40 bg-gold/5 p-4 text-center space-y-2">
                    <p className="text-xs uppercase tracking-wider text-gold font-bold">
                      {hi ? 'आपके अंक (Your Numbers)' : 'Your Numbers'}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-gold/30 bg-background/60 p-2">
                        <span className="text-xs text-muted-foreground">{hi ? 'मूलांक' : 'Moolank'}</span>
                        <span className="font-cinzel text-3xl font-bold text-amber-300 block">{result.moolank}</span>
                      </div>
                      <div className="rounded-lg border border-gold/30 bg-background/60 p-2">
                        <span className="text-xs text-muted-foreground">{hi ? 'भाग्यांक' : 'Bhagyank'}</span>
                        <span className="font-cinzel text-3xl font-bold text-amber-300 block">{result.bhagyank}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2.5">
                  <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 p-2 text-xs text-amber-200">
                    {hi
                      ? '📥 यदि फाइल डाउनलोड न हुई हो, तो नीचे बटन पर क्लिक करें:'
                      : '📥 If the file did not download automatically, click below:'}
                  </div>

                  <a
                    href={result.downloadUrl || PDF_URL}
                    download={PDF_FILENAME}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 px-6 font-semibold text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:brightness-110"
                  >
                    <Download className="h-5 w-5" />
                    <span>{hi ? '📥 ई-बुक (PDF) डाउनलोड करें' : '📥 Download eBook (PDF)'}</span>
                  </a>

                  <a
                    href={getWhatsAppChatUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-success px-5 font-semibold text-white hover:brightness-110"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>{hi ? 'WhatsApp पर आचार्य नंदराम से बात करें' : 'Chat with Acharya Nandram on WhatsApp'}</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chapters Index Table */}
      <div className="mx-auto mt-16 max-w-4xl space-y-6">
        <div className="text-center">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
            {hi ? 'ई-बुक की विषय सूची (21 पृष्ठ)' : 'Book Contents (21 Pages)'}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {hi
              ? 'इस ई-बुक में न्यूमरोलॉजी रिपोर्ट के हर हिस्से को सरल शब्दों में समझाया गया है।'
              : 'Every single component of a numerology report explained in plain language.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CHAPTERS.map((ch) => (
            <div
              key={ch.no}
              className="flex items-center justify-between rounded-xl border border-gold/25 bg-background/50 p-3.5 hover:border-gold/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-gold/40 bg-gold/10 font-cinzel text-xs font-bold text-gold">
                  {ch.no}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{hi ? ch.hi : ch.en}</p>
                  <p className="text-[11px] text-muted-foreground">{hi ? ch.en : ch.hi}</p>
                </div>
              </div>
              <span className="text-xs font-mono text-gold/80">
                {hi ? `पृष्ठ ${ch.page}` : `p. ${ch.page}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
