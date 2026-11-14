'use client';
/**
 * Pop-up Lead Capture Modal for the Free Numerology Beginner Guide eBook:
 * "अंक ज्योतिष आसान शुरुआत - NUMEROLOGY MADE EASY"
 * A Beginner's Guide to Understanding Your Own Numerology Report by Acharya Nandram.
 *
 * Collects contact number (WhatsApp) and name (with optional DOB for instant Moolank/Bhagyank),
 * records the lead into marketing_leads via /api/leads, and provides direct PDF download.
 */
import * as React from 'react';
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
  User,
  X,
} from 'lucide-react';
import { useApp } from './providers';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { api, ApiError } from '@/lib/client/api';
import { trackEvent } from '@/lib/client/analytics';
import { todayIST, toIso } from '@/lib/numerology';
import { cn } from '@/lib/utils';

const STORAGE_CLAIMED = 'mn_ebook_claimed';
const STORAGE_DISMISSED = 'mn_ebook_dismissed_until';
const EVENT_OPEN = 'mn-open-ebook-popup';
const PDF_URL = '/ebooks/numerology-made-easy-guide.pdf';
const PDF_FILENAME = 'Numerology-Made-Easy-Beginner-Guide-Acharya-Nandram.pdf';
const WHATSAPP_NUMBER = '918819999374';

const CONSENT_TEXT = {
  hi: 'मैं सहमत हूँ कि आचार्य नंदराम / myNumerologist.com मुझे WhatsApp पर ई-बुक, न्यूमरोलॉजी रिपोर्ट व परामर्श के संबंध में संदेश भेज सकते हैं।',
  en: 'I agree that Acharya Nandram / myNumerologist.com may message me on WhatsApp regarding the eBook, reports and guidance.',
};

const ONE_LINE_TRAITS: Record<number, { en: string; hi: string; planet: { en: string; hi: string } }> = {
  1: { planet: { en: 'Sun (Surya)', hi: 'सूर्य' }, en: 'Born leader, ambitious & independent.', hi: 'जन्मजात नेता, स्वतंत्र व आत्मविश्वासी।' },
  2: { planet: { en: 'Moon (Chandra)', hi: 'चंद्र' }, en: 'Caring, emotional & highly intuitive.', hi: 'संवेदनशील, स्नेही व शांतिप्रिय।' },
  3: { planet: { en: 'Jupiter (Guru)', hi: 'गुरु' }, en: 'Wise, creative & natural guide.', hi: 'ज्ञानी, अभिव्यक्तिशील व मार्गदर्शक।' },
  4: { planet: { en: 'Rahu', hi: 'राहु' }, en: 'Hard-working, practical & original thinker.', hi: 'कड़ी मेहनत, तकनीक व मौलिक सोच।' },
  5: { planet: { en: 'Mercury (Budh)', hi: 'बुध' }, en: 'Sharp mind, versatile & master communicator.', hi: 'तेज़ बुद्धि, व्यापार व उत्तम संवादक।' },
  6: { planet: { en: 'Venus (Shukra)', hi: 'शुक्र' }, en: 'Loving, artistic, luxury & family-focused.', hi: 'प्रेमपूर्ण, कलात्मक, सुख-समृद्धि व परिवार-प्रिय।' },
  7: { planet: { en: 'Ketu', hi: 'केतु' }, en: 'Deep thinker, spiritual & research-oriented.', hi: 'गहरे चिंतक, शोध व आध्यात्मिक प्रवृत्ति।' },
  8: { planet: { en: 'Saturn (Shani)', hi: 'शनि' }, en: 'Patient, disciplined & built for lasting success.', hi: 'धैर्यवान, अनुशासित व स्थायी सफलता के धनी।' },
  9: { planet: { en: 'Mars (Mangal)', hi: 'मंगल' }, en: 'Courageous, energetic, protective & bold.', hi: 'ऊर्जावान, साहसी व सेवाभावी योद्धा।' },
};

export function EbookLeadPopup() {
  const { lang, setLang } = useApp();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isClaimed, setIsClaimed] = React.useState(false);
  const [hasMounted, setHasMounted] = React.useState(false);

  // Form state
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [dob, setDob] = React.useState('');
  const [consent, setConsent] = React.useState(true);
  const [website, setWebsite] = React.useState(''); // honeypot

  // Submission state
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{
    moolank: number | null;
    bhagyank: number | null;
    downloadUrl?: string;
  } | null>(null);

  const hi = lang === 'hi';

  // Listen for programmatic open trigger
  React.useEffect(() => {
    setHasMounted(true);
    try {
      if (localStorage.getItem(STORAGE_CLAIMED) === '1') {
        setIsClaimed(true);
      }
    } catch {
      // storage unavailable
    }

    const handleCustomOpen = () => {
      setIsOpen(true);
    };

    window.addEventListener(EVENT_OPEN, handleCustomOpen);
    return () => window.removeEventListener(EVENT_OPEN, handleCustomOpen);
  }, []);

  // Automatic popup trigger for visitors (after 4 seconds)
  React.useEffect(() => {
    if (!hasMounted) return;
    if (/^\/(admin|login|account|settings)(\/|$)/.test(window.location.pathname)) return; // never interrupt admin / account screens

    try {
      const claimed = localStorage.getItem(STORAGE_CLAIMED) === '1';
      const dismissedUntil = Number(localStorage.getItem(STORAGE_DISMISSED) || '0');
      const now = Date.now();

      if (!claimed && now > dismissedUntil) {
        const timer = setTimeout(() => {
          setIsOpen(true);
          trackEvent('popup_impression', { popup: 'free_ebook' });
        }, 4000);
        return () => clearTimeout(timer);
      }
    } catch {
      // storage blocked
    }
  }, [hasMounted]);

  // Handle ESC key
  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    try {
      if (!isClaimed) {
        // Snooze for 24 hours on dismiss
        localStorage.setItem(STORAGE_DISMISSED, String(Date.now() + 24 * 60 * 60 * 1000));
      }
    } catch {
      // ignore
    }
  };

  const handleOpenManually = () => {
    setIsOpen(true);
    trackEvent('popup_manual_open', { popup: 'free_ebook' });
  };

  const isFormValid =
    name.trim().length >= 2 &&
    phone.replace(/\D/g, '').length >= 10 &&
    consent;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || busy) return;

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
          page: window.location.pathname,
          referrer: document.referrer || undefined,
        },
      });

      setResult({
        moolank: res.moolank,
        bhagyank: res.bhagyank,
        downloadUrl: res.downloadUrl || PDF_URL,
      });

      setIsClaimed(true);
      try {
        localStorage.setItem(STORAGE_CLAIMED, '1');
      } catch {
        // ignore
      }

      trackEvent('generate_lead', {
        lead_magnet: 'free-ebook',
        has_dob: Boolean(dob),
      });

      // Automatically trigger PDF download
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
        // browser suppressed automatic trigger
      }
    } catch (err2) {
      if (err2 instanceof ApiError) {
        const path = err2.body.issues?.[0]?.path;
        if (path === 'phone') {
          setErr(hi ? 'कृपया सही 10-अंकों का मोबाइल/WhatsApp नंबर दर्ज करें।' : 'Please enter a valid 10-digit mobile / WhatsApp number.');
        } else if (path === 'dob') {
          setErr(hi ? 'कृपया सही जन्म तिथि चुनें।' : 'Please select a valid date of birth.');
        } else if (err2.status === 429) {
          setErr(hi ? 'कृपया कुछ देर बाद पुनः प्रयास करें।' : 'Too many attempts. Please try again in a few minutes.');
        } else {
          setErr(hi ? 'कुछ गड़बड़ हुई। कृपया पुनः प्रयास करें या WhatsApp करें।' : 'Submission failed. Please try again or reach out on WhatsApp.');
        }
      } else {
        setErr(hi ? 'कनेक्शन में त्रुटि। कृपया पुनः प्रयास करें।' : 'Network error. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  // WhatsApp click handler for consultation
  const getWhatsAppChatUrl = () => {
    let msg = '';
    if (hi) {
      msg = `नमस्ते आचार्य जी, मैंने आपकी 'अंक ज्योतिष आसान शुरुआत' ई-बुक डाउनलोड की है।`;
      if (name.trim()) msg += ` मेरा नाम ${name.trim()} है।`;
      if (result?.moolank && result?.bhagyank) {
        msg += ` मेरा मूलांक ${result.moolank} और भाग्यांक ${result.bhagyank} है।`;
      }
      msg += ` मुझे अपनी न्यूमरोलॉजी रिपोर्ट और व्यक्तिगत परामर्श के बारे में जानकारी चाहिए।`;
    } else {
      msg = `Namaste Acharya ji, I have downloaded your 'Numerology Made Easy' eBook.`;
      if (name.trim()) msg += ` My name is ${name.trim()}.`;
      if (result?.moolank && result?.bhagyank) {
        msg += ` My Moolank is ${result.moolank} and Bhagyank is ${result.bhagyank}.`;
      }
      msg += ` I would like guidance on my personal numerology report and consultation.`;
    }
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <>
      {/* Floating launcher badge at bottom-left */}
      {!isOpen && (
        <aside aria-label="Free Numerology eBook">
          <button
            type="button"
            onClick={handleOpenManually}
            className="group fixed bottom-5 left-4 z-40 flex items-center gap-2.5 rounded-full border border-gold/60 bg-gradient-to-r from-[#20102b]/95 via-[#341630]/95 to-[#20102b]/95 px-4 py-2.5 text-xs font-semibold text-gold shadow-[0_4px_24px_rgba(217,119,6,0.35)] backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-gold hover:shadow-[0_4px_30px_rgba(217,119,6,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:bottom-6 sm:left-6 sm:text-sm"
          >
            <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold shadow-inner">
              <Gift className="h-3.5 w-3.5 animate-bounce text-amber-300" />
              <span className="absolute -inset-0.5 animate-ping rounded-full bg-gold/30 opacity-75" />
            </span>
            <span className="flex flex-col text-left leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                {hi ? 'मुफ़्त उपहार (PDF)' : 'Free Gift (PDF)'}
              </span>
              <span className="font-serif font-bold text-foreground">
                {isClaimed
                  ? hi ? '📖 अंक ज्योतिष ई-बुक' : '📖 Numerology eBook'
                  : hi ? 'अंक ज्योतिष आसान शुरुआत' : 'Numerology Made Easy'}
              </span>
            </span>
          </button>
        </aside>
      )}

      {/* Modal Overlay */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ebook-popup-title"
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/80 p-3 backdrop-blur-md transition-opacity duration-300 sm:p-4 md:p-6"
          onClick={handleClose}
        >
          {/* Modal Container */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative my-auto w-full max-w-4xl overflow-hidden rounded-2xl border-2 border-gold/50 bg-gradient-to-b from-[#180f2b] via-[#120a22] to-[#0d0718] text-foreground shadow-[0_0_60px_rgba(217,119,6,0.28)]"
          >
            {/* Top gold bar glow */}
            <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

            {/* Close button */}
            <button
              type="button"
              onClick={handleClose}
              aria-label={hi ? 'बंद करें' : 'Close'}
              className="absolute right-3.5 top-3.5 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-gold/30 bg-black/50 text-gold/80 transition-colors hover:bg-gold/20 hover:text-white sm:right-4 sm:top-4"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Inner Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12">
              {/* Left Column: Visual Book Mockup & What's Inside */}
              <div className="relative flex flex-col justify-between overflow-hidden border-b border-gold/20 bg-gradient-to-br from-[#1d1238]/90 via-[#261545]/80 to-[#140b29]/90 p-5 sm:p-7 md:col-span-5 md:border-b-0 md:border-r">
                {/* Decorative background glow */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-amber-500/15 blur-3xl"
                />

                <div className="relative z-10 space-y-4">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-300">
                    <Sparkles className="h-3 w-3 text-gold" />
                    <span>{hi ? '100% मुफ़्त ई-बुक गाइड (21 पेज)' : '100% FREE E-BOOK (21 Pages)'}</span>
                  </div>

                  {/* 3D Realistic Book Card */}
                  <div className="mx-auto max-w-[240px] transform rounded-xl border border-amber-400/40 bg-gradient-to-b from-[#1b214a] via-[#141838] to-[#0f122c] p-4 text-center shadow-[0_12px_32px_rgba(0,0,0,0.6)] transition-transform duration-300 hover:scale-[1.02]">
                    <div className="mb-2 text-[8px] font-semibold tracking-[0.25em] text-gold/80 uppercase">
                      myNumerologist.com
                    </div>

                    {/* Sacred Yantra Emblem */}
                    <div className="relative mx-auto my-2 flex h-20 w-20 items-center justify-center rounded-full border border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-maroon/20 to-amber-900/10 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                      <div className="text-xl font-bold text-amber-300">ॐ</div>
                      <span className="absolute text-[8px] font-bold text-amber-200/60 top-0.5">1</span>
                      <span className="absolute text-[8px] font-bold text-amber-200/60 right-1 top-4">2</span>
                      <span className="absolute text-[8px] font-bold text-amber-200/60 right-1 bottom-4">3</span>
                      <span className="absolute text-[8px] font-bold text-amber-200/60 bottom-0.5">5</span>
                      <span className="absolute text-[8px] font-bold text-amber-200/60 left-1 bottom-4">7</span>
                      <span className="absolute text-[8px] font-bold text-amber-200/60 left-1 top-4">9</span>
                    </div>

                    <h4 className="font-serif text-base font-bold text-amber-200 leading-snug">
                      अंक ज्योतिष
                    </h4>
                    <p className="text-[11px] font-semibold text-white/90">
                      आसान शुरुआत
                    </p>
                    <p className="font-cinzel text-[10px] tracking-wider text-gold font-bold mt-0.5">
                      NUMEROLOGY MADE EASY
                    </p>
                    <div className="my-1.5 h-[1px] w-16 mx-auto bg-amber-400/40" />
                    <p className="text-[9px] text-amber-100/70 italic">
                      अपनी न्यूमरोलॉजी रिपोर्ट खुद कैसे समझें
                    </p>
                    <p className="mt-2 text-[9px] font-medium text-amber-300">
                      आचार्य नंदराम · Acharya Nandram
                    </p>
                    <span className="mt-1 block text-[7.5px] uppercase tracking-wider text-muted-foreground">
                      Client Guide Book · PDF
                    </span>
                  </div>

                  {/* Feature Highlights */}
                  <div className="space-y-1.5 pt-1 text-xs">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gold/90">
                      {hi ? 'इस ई-बुक में आप क्या सीखेंगे:' : 'What you will discover:'}
                    </p>
                    <ul className="space-y-1.5 text-muted-foreground">
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                        <span>{hi ? 'मूलांक और भाग्यांक की आसान गणना व ग्रहों का स्वभाव' : 'Easy calculation of Moolank & Bhagyank (1 to 9)'}</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                        <span>{hi ? 'लो-शू ग्रिड (Lo Shu Grid) व पूर्ण रेखाओं (राजयोग) का रहस्य' : 'How to read Lo Shu Grid, planes & missing numbers'}</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                        <span>{hi ? 'कुआ नंबर (Kua Number) व वास्तु की शुभ दिशाएँ' : 'Your personal Kua number & lucky sleeping directions'}</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                        <span>{hi ? 'मोबाइल नंबर व नाम अंक की अनुकूलता (फ्रेंडशिप चार्ट)' : 'Mobile number & Name vibration friendship chart'}</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                        <span>{hi ? 'सरल 40-दिन के उपाय + प्रिंटेबल व्यक्तिगत वर्कशीट' : 'Simple 40-day remedies + printable personal worksheet'}</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Left footer note */}
                <div className="relative z-10 mt-4 border-t border-gold/15 pt-3 text-[11px] text-muted-foreground/80">
                  <p className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-gold" />
                    <span>{hi ? 'आचार्य नंदराम द्वारा प्रमाणित सरल मार्गदर्शिका' : 'Official guide book by Acharya Nandram'}</span>
                  </p>
                </div>
              </div>

              {/* Right Column: Lead Form or Success View */}
              <div className="p-5 sm:p-7 md:col-span-7 flex flex-col justify-center">
                {/* Language Switcher */}
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    {hi ? 'निःशुल्क डिजिटल संस्करण' : 'Free Digital Edition'}
                  </span>
                  <div className="flex rounded-md border border-gold/30 p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setLang('hi')}
                      className={cn(
                        'rounded px-2.5 py-0.5 transition-colors',
                        lang === 'hi' ? 'bg-gold/25 font-bold text-gold' : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      हिन्दी
                    </button>
                    <button
                      type="button"
                      onClick={() => setLang('en')}
                      className={cn(
                        'rounded px-2.5 py-0.5 transition-colors',
                        lang === 'en' ? 'bg-gold/25 font-bold text-gold' : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      English
                    </button>
                  </div>
                </div>

                {!result ? (
                  /* Form View */
                  <div className="space-y-4">
                    <div>
                      <h3
                        id="ebook-popup-title"
                        className="font-serif text-xl sm:text-2xl font-bold leading-tight bg-gradient-to-r from-amber-200 via-amber-300 to-amber-500 bg-clip-text text-transparent"
                      >
                        {hi
                          ? 'मुफ़्त अंक ज्योतिष ई-बुक प्राप्त करें'
                          : 'Get Your Free Numerology eBook'}
                      </h3>
                      <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                        {hi
                          ? 'अपनी न्यूमरोलॉजी रिपोर्ट को सरलता से समझने के लिए अपना संपर्क नंबर दर्ज करें और तत्काल PDF ई-बुक डाउनलोड करें।'
                          : 'Understand your own Numerology Report with ease. Enter your contact details for instant PDF download.'}
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
                      {/* Name Input */}
                      <Field
                        label={hi ? 'आपका पूरा नाम' : 'Your Full Name'}
                        htmlFor="ebk-name"
                        required
                      >
                        <div className="relative">
                          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="ebk-name"
                            className="pl-9"
                            autoComplete="name"
                            placeholder={hi ? 'उदा. राहुल शर्मा' : 'e.g. Rahul Sharma'}
                            maxLength={100}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                          />
                        </div>
                      </Field>

                      {/* Phone / Contact Number Input */}
                      <Field
                        label={hi ? 'संपर्क नंबर (WhatsApp)' : 'Contact Number (WhatsApp)'}
                        htmlFor="ebk-phone"
                        required
                      >
                        <div className="relative">
                          <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="ebk-phone"
                            type="tel"
                            inputMode="tel"
                            className="pl-9"
                            autoComplete="tel"
                            placeholder={hi ? '98765 43210 (10 अंक)' : '98765 43210'}
                            maxLength={18}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {hi
                            ? 'ई-बुक PDF लिंक और महत्वपूर्ण अपडेट के लिए।'
                            : 'For immediate PDF access and WhatsApp updates.'}
                        </p>
                      </Field>

                      {/* Date of Birth (Optional) */}
                      <Field
                        label={
                          hi
                            ? 'जन्म तिथि (वैकल्पिक - अंक तुरंत जानने हेतु)'
                            : 'Date of Birth (Optional - reveals your numbers)'
                        }
                        htmlFor="ebk-dob"
                      >
                        <Input
                          id="ebk-dob"
                          type="date"
                          min="1900-01-01"
                          max={toIso(todayIST())}
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                        />
                        <p className="mt-1 text-[11px] text-amber-300/80">
                          {hi
                            ? '💡 यदि आप जन्म तिथि भरते हैं, तो ई-बुक के साथ आपके मूलांक व भाग्यांक तुरंत स्क्रीन पर दिखाई देंगे।'
                            : '💡 If entered, your Moolank & Bhagyank will be calculated and shown on screen instantly.'}
                        </p>
                      </Field>

                      {/* Bot Honeypot */}
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

                      {/* Consent Checkbox */}
                      <label className="flex items-start gap-2.5 text-[11px] text-muted-foreground cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 shrink-0 accent-amber-500 rounded cursor-pointer"
                          checked={consent}
                          onChange={(e) => setConsent(e.target.checked)}
                        />
                        <span>{CONSENT_TEXT[lang]}</span>
                      </label>

                      {/* Error Alert */}
                      {err && (
                        <div
                          role="alert"
                          className="rounded-lg border border-danger/40 bg-danger/10 p-2.5 text-xs text-danger"
                        >
                          {err}
                        </div>
                      )}

                      {/* Submit CTA */}
                      <Button
                        type="submit"
                        variant="gold"
                        size="lg"
                        disabled={busy || !isFormValid}
                        className="w-full text-base font-semibold shadow-lg hover:shadow-amber-500/30"
                      >
                        <Download className="h-4 w-4" />
                        {busy
                          ? hi
                            ? 'तैयार किया जा रहा है…'
                            : 'Generating Access…'
                          : hi
                          ? 'मुफ़्त ई-बुक (PDF) अभी प्राप्त करें'
                          : 'Get Free eBook (PDF) Now'}
                      </Button>

                      <div className="flex items-center justify-center gap-3 text-[11px] text-muted-foreground pt-1">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5 text-success" />
                          {hi ? 'सुरक्षित व गोपनीय' : '100% Confidential'}
                        </span>
                        <span>·</span>
                        <span>{hi ? 'तत्काल डाउनलोड' : 'Instant PDF Access'}</span>
                        <span>·</span>
                        <span>{hi ? 'कोई स्पैम नहीं' : 'No Spam Ever'}</span>
                      </div>
                    </form>
                  </div>
                ) : (
                  /* Success View */
                  <div className="space-y-5 text-center py-2" role="status">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/20 text-success border border-success/40 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>

                    <div>
                      <h3 className="font-serif text-2xl font-bold text-amber-200">
                        {hi
                          ? `बधाई हो, ${name.trim()}!`
                          : `Congratulations, ${name.trim()}!`}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {hi
                          ? 'आपकी मुफ़्त ई-बुक गाइड "अंक ज्योतिष आसान शुरुआत" तैयार है।'
                          : 'Your free guide book "Numerology Made Easy" is ready.'}
                      </p>
                    </div>

                    {/* If DOB was provided, show their Moolank & Bhagyank results! */}
                    {result.moolank && result.bhagyank ? (
                      <div className="rounded-xl border border-gold/40 bg-gold/5 p-3.5 text-left space-y-2">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gold text-center">
                          {hi ? 'आपके व्यक्तिगत अंक (Your Core Numbers)' : 'Your Core Numbers'}
                        </p>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="rounded-lg border border-gold/30 bg-background/60 p-2.5 text-center">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                              {hi ? 'मूलांक (Root No.)' : 'Moolank (Root)'}
                            </span>
                            <span className="font-cinzel text-3xl font-bold text-amber-300">
                              {result.moolank}
                            </span>
                            <span className="mt-0.5 block text-[11px] font-medium text-amber-200/90">
                              {ONE_LINE_TRAITS[result.moolank]?.planet[lang]}
                            </span>
                          </div>

                          <div className="rounded-lg border border-gold/30 bg-background/60 p-2.5 text-center">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                              {hi ? 'भाग्यांक (Destiny No.)' : 'Bhagyank (Destiny)'}
                            </span>
                            <span className="font-cinzel text-3xl font-bold text-amber-300">
                              {result.bhagyank}
                            </span>
                            <span className="mt-0.5 block text-[11px] font-medium text-amber-200/90">
                              {ONE_LINE_TRAITS[result.bhagyank]?.planet[lang]}
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-center text-muted-foreground">
                          {hi
                            ? 'ई-बुक के पेज 5 और 6 पर अपने इन अंकों का पूरा विश्लेषण और उपाय विस्तार से पढ़ें!'
                            : 'See pages 5 & 6 of your eBook to understand your numbers in complete detail!'}
                        </p>
                      </div>
                    ) : null}

                    {/* Action Buttons */}
                    <div className="space-y-2.5">
                      <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 p-2.5 text-xs text-amber-200 text-center font-medium">
                        {hi
                          ? '📥 डाउनलोड अपने-आप शुरू हो गया है। यदि फाइल डाउनलोड न हुई हो, तो नीचे बटन पर क्लिक करें:'
                          : '📥 Download has started automatically. If it did not start, please click the button below:'}
                      </div>

                      {/* Direct Download Button */}
                      <a
                        href={result.downloadUrl || PDF_URL}
                        download={PDF_FILENAME}
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 px-6 font-semibold text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.45)] hover:brightness-110 transition-all text-base animate-pulse"
                        onClick={() => trackEvent('download_ebook_click', { source: 'popup_success' })}
                      >
                        <Download className="h-5 w-5" />
                        <span>{hi ? '📥 ई-बुक (PDF) डाउनलोड करें' : '📥 Download eBook (PDF)'}</span>
                      </a>

                      {/* Read Online Button */}
                      <a
                        href={result.downloadUrl || PDF_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-gold/50 bg-background/50 px-4 text-xs sm:text-sm font-medium text-gold hover:bg-gold/10 transition-all"
                      >
                        <BookOpen className="h-4 w-4" />
                        <span>{hi ? 'ब्राउज़र में ऑनलाइन पढ़ें' : 'Read Online in Browser'}</span>
                        <ExternalLink className="h-3 w-3 opacity-70" />
                      </a>

                      {/* Chat with Acharya Nandram WhatsApp button */}
                      <a
                        href={getWhatsAppChatUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackEvent('whatsapp_click', { source: 'ebook_success' })}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-success px-5 text-sm font-semibold text-white hover:brightness-110 transition-all"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>{hi ? 'आचार्य नंदराम जी से WhatsApp पर बात करें' : 'Chat with Acharya Nandram on WhatsApp'}</span>
                      </a>
                    </div>

                    <button
                      type="button"
                      onClick={handleClose}
                      className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                    >
                      {hi ? 'खिड़की बंद करें' : 'Close window'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
