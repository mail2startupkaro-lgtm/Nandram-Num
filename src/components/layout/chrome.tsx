'use client';
import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Award, BookOpen, Calculator, CheckCircle, ChevronRight, FileText, Heart, HelpCircle, LifeBuoy, LogOut, Menu, Moon, Shield, ShieldCheck, Sparkles, Sun, UserRound, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useApp } from './providers';
import { Button } from '@/components/ui/button';
import { MulankMenu } from './mulank-menu';
import { BhagyankMenu } from './bhagyank-menu';
import { ServicesMenu } from './services-menu';
import { AngelMenu } from './angel-menu';
import { Bi } from '@/components/i18n/bi';

/** Slowly rotating sacred-geometry mandala behind every page. */
export function MandalaBackground() {
  const petals = Array.from({ length: 24 }, (_, i) => i * 15);
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--maroon)/0.25),transparent_60%),radial-gradient(ellipse_at_bottom_right,hsl(var(--gold)/0.12),transparent_55%)]" />
      <svg viewBox="-100 -100 200 200" className="absolute left-1/2 top-[38%] h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 animate-spin-slow opacity-[0.10] dark:opacity-[0.14]">
        <g fill="none" stroke="hsl(var(--gold))" strokeWidth="0.35">
          {[90, 75, 60, 45, 30, 15].map((r) => <circle key={r} r={r} />)}
          {petals.map((a) => (
            <g key={a} transform={`rotate(${a})`}>
              <ellipse cx="0" cy="-52" rx="9" ry="30" />
              <path d="M0 -90 L8 -75 L0 -60 L-8 -75 Z" />
            </g>
          ))}
          {Array.from({ length: 12 }, (_, i) => <line key={i} x1="0" y1="0" x2="0" y2="-90" transform={`rotate(${i * 30})`} />)}
          <polygon points="0,-30 26,15 -26,15" /><polygon points="0,30 26,-15 -26,-15" />
        </g>
      </svg>
    </div>
  );
}

/** Brand Logo: "myNumerologist.com" with sacred emblem and glowing gold styling. */
function BrandLogo() {
  return (
    <div className="group flex items-center gap-2 sm:gap-2.5 transition-transform duration-200 hover:scale-[1.02] shrink-0">
      {/* Sacred Emblem Icon */}
      <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500/30 via-maroon/40 to-amber-900/40 p-[1.5px] shadow-[0_0_12px_rgba(245,158,11,0.25)] border border-amber-400/40 backdrop-blur-sm group-hover:border-amber-300 transition-all duration-300">
        <div className="flex h-full w-full items-center justify-center rounded-[7px] sm:rounded-[10px] bg-gradient-to-br from-[#2a0e1b] via-[#1a0a14] to-[#24130a]">
          <span className="font-serif text-sm sm:text-base font-bold bg-gradient-to-b from-amber-100 via-amber-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            ॐ
          </span>
        </div>
      </div>

      {/* Brand Name Typography */}
      <div className="flex flex-col leading-none" aria-label="myNumerologist.com">
        <span className="flex items-baseline tracking-normal">
          <span className="font-serif italic font-normal text-foreground/85 text-[15px] sm:text-[18px] lg:text-[19px] select-none">
            my
          </span>
          <span className="font-cinzel font-bold bg-gradient-to-r from-amber-200 via-amber-300 to-amber-500 bg-clip-text text-transparent text-[16px] sm:text-[19px] lg:text-[20px] tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] select-none">
            Numerologist
          </span>
          <span className="hidden font-sans font-semibold text-[10px] sm:inline text-amber-400/90 tracking-wide select-none ml-0.5">
            .com
          </span>
        </span>
        <span className="mt-0.5 hidden text-[8px] uppercase tracking-[0.25em] font-medium text-gold/80 sm:block">
          <Bi en="Numbers · Destiny · Remedies" hi="अंक · भाग्य · उपाय" />
        </span>
      </div>
    </div>
  );
}

export function Header() {
  const { t, lang, setLang, theme, setTheme, me, refreshMe } = useApp();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [nav, setNav] = React.useState(false);
  const user = me?.user;
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setOpen(false); await refreshMe(); router.push('/');
  }

  const navLinkClass = "inline-flex h-8 items-center whitespace-nowrap rounded-md px-2 text-[12.5px] font-medium text-foreground/85 hover:text-gold hover:bg-gold/10 transition-colors";

  return (
    <header className="sticky top-0 z-40 border-b border-gold/20 bg-background/80 backdrop-blur-md">
      <div className="container flex h-14 sm:h-16 items-center justify-between gap-1 sm:gap-2 px-3 sm:px-4">
        <Link href="/" className="flex items-center shrink-0">
          <BrandLogo />
        </Link>
        <nav className="flex items-center gap-0.5 sm:gap-1 ml-auto">
          <Link href="/reading" className={`hidden md:inline-flex ${navLinkClass}`}>{t.nav.reading}</Link>
          <MulankMenu />
          <BhagyankMenu />
          <AngelMenu />
          <Link href="/calculators" className={`hidden md:inline-flex ${navLinkClass}`}>{t.nav.calculators}</Link>
          <ServicesMenu />
          <Link href="/pricing" className={`hidden lg:inline-flex ${navLinkClass}`}>{t.nav.pricing}</Link>
          <Link href="/blog" className={`hidden xl:inline-flex ${navLinkClass}`}>{t.nav.blog}</Link>
          <Link href="/about" className={`hidden 2xl:inline-flex ${navLinkClass}`}>{t.nav.about}</Link>
          <Link href="/contact" className={`hidden 2xl:inline-flex ${navLinkClass}`}>{t.nav.contact}</Link>

          {/* Free eBook Trigger Badge */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('mn-open-ebook-popup'))}
            className="hidden xl:inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/15 via-gold/20 to-amber-500/15 px-2.5 text-[11px] font-semibold text-gold hover:border-gold hover:bg-gold/20 transition-all shrink-0 ml-1"
            title={lang === 'hi' ? 'मुफ़्त अंक ज्योतिष ई-बुक प्राप्त करें' : 'Get Free Numerology eBook'}
          >
            <span className="text-amber-300 text-xs">🎁</span>
            <Bi en="Free eBook" hi="मुफ़्त ई-बुक" />
          </button>

          {user?.role === 'super_admin' && (
            <Link href="/admin" className="inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-md px-2 text-[12.5px] font-semibold text-gold hover:bg-gold/10">
              <Shield className="h-3.5 w-3.5" />{t.auth.admin}
            </Link>
          )}

          {user && (
            <Link href="/dashboard" className={`hidden sm:inline-flex ${navLinkClass}`}>
              {t.nav.dashboard}
            </Link>
          )}

          {/* Vertical Separator */}
          <span className="hidden md:inline-block h-4 w-px bg-gold/25 mx-0.5 sm:mx-1" />

          {/* Language Switcher */}
          <button
            type="button"
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            aria-label={lang === 'en' ? 'हिंदी में देखें' : 'View in English'}
            className="rounded-md border border-gold/40 px-2 py-1 text-xs md:hidden"
          >
            {lang === 'en' ? 'हिं' : 'EN'}
          </button>
          <div className="hidden rounded-md border border-gold/30 p-0.5 text-[11px] md:inline-flex items-center" role="group" aria-label={lang === 'hi' ? 'भाषा' : 'Language'}>
            {(['en', 'hi'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={`rounded px-1.5 py-0.5 transition-all ${lang === l ? 'bg-gold/25 font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {l === 'en' ? 'EN' : 'हिं'}
              </button>
            ))}
          </div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-foreground/80 hover:text-gold"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={lang === 'hi' ? 'डार्क मोड बदलें' : 'Toggle dark mode'}
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </Button>

          {/* Auth Button */}
          {me && !user && (
            <Link
              href="/login"
              className="inline-flex h-7 items-center whitespace-nowrap rounded-md border border-gold/40 px-2.5 text-xs font-semibold text-gold hover:bg-gold/15 transition-colors"
            >
              {t.auth.signin}
            </Link>
          )}

          {/* User Account Menu */}
          {user && (
            <div className="relative">
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t.auth.account} aria-expanded={open} onClick={() => setOpen(!open)}>
                <UserRound className="h-4 w-4" />
              </Button>
              {open && (
                <div className="glass absolute right-0 top-10 w-56 rounded-lg bg-background p-2 text-xs shadow-xl border border-gold/30" onMouseLeave={() => setOpen(false)}>
                  <p className="truncate px-2 py-1 text-[11px] text-muted-foreground">{user.name || user.email || user.phone}</p>
                  <Link href="/account" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-muted"><UserRound className="h-3.5 w-3.5" />{t.auth.account}</Link>
                  <Link href="/contact?topic=support" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-muted"><LifeBuoy className="h-3.5 w-3.5" />{lang === 'hi' ? 'सहायता' : 'Help & support'}</Link>
                  {user.role === 'super_admin' && <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-muted"><Shield className="h-3.5 w-3.5" />{t.auth.admin}</Link>}
                  <button onClick={logout} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-muted"><LogOut className="h-3.5 w-3.5" />{t.auth.logout}</button>
                </div>
              )}
            </div>
          )}

          {/* Mobile Hamburger Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden"
            aria-label={lang === 'hi' ? 'मेन्यू' : 'Menu'}
            aria-expanded={nav}
            aria-controls="mobile-nav"
            onClick={() => setNav(!nav)}
          >
            {nav ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </nav>
      </div>
      {nav && (
        <nav id="mobile-nav" aria-label={lang === 'hi' ? 'मुख्य मेन्यू' : 'Main'} className="border-t border-gold/20 bg-background/95 backdrop-blur-md md:hidden">
          <ul className="container grid grid-cols-2 gap-1 py-3 text-sm">
            <li className="col-span-2 mb-1">
              <button
                type="button"
                onClick={() => {
                  setNav(false);
                  window.dispatchEvent(new Event('mn-open-ebook-popup'));
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gold/50 bg-gradient-to-r from-amber-500/15 via-gold/20 to-amber-500/15 px-3 py-2 text-center text-sm font-bold text-gold hover:bg-gold/25"
              >
                <span>🎁</span>
                <Bi en="Free Guide eBook (PDF)" hi="मुफ़्त अंक ज्योतिष ई-बुक (PDF)" />
              </button>
            </li>
            {[['/reading', t.nav.reading], ['/angel-numbers', t.nav.angel], ['/mulank', t.nav.mulank], ['/bhagyank', t.nav.bhagyank], ['/calculators', t.nav.calculators], ['/angel-numbers/calculator', lang === 'hi' ? 'एंजेल नंबर कैलकुलेटर' : 'Angel number calculator'], ['/services', t.nav.services], ['/pricing', t.nav.pricing], ['/blog', t.nav.blog], ['/international-numerology', lang === 'hi' ? 'अंतरराष्ट्रीय क्लाइंट' : 'International clients'], ['/about', t.nav.about], ['/contact', t.nav.contact]].map(([href, label]) => (
              <li key={href}><Link href={href} onClick={() => setNav(false)} className="block rounded-md px-3 py-2.5 hover:bg-muted">{label}</Link></li>
            ))}
            <li><button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left hover:bg-muted">{theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}{lang === 'hi' ? 'थीम बदलें' : 'Switch theme'}</button></li>
          </ul>
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  const { t, lang } = useApp();
  const hi = lang === 'hi';
  return (
    <footer className="relative mt-20 border-t border-gold/25 bg-gradient-to-b from-card/40 via-card/85 to-background text-xs text-muted-foreground overflow-hidden">
      {/* Top Hairline Accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-gold/5 blur-3xl" />

      <div className="container max-w-7xl px-4 py-12 sm:py-16 space-y-12">
        {/* Top Section: Brand + Expert Card + Sacred Pillars */}
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center border-b border-gold/15 pb-10">
          {/* Brand & Expert Overview */}
          <div className="lg:col-span-5 space-y-4">
            <Link href="/" className="inline-block">
              <BrandLogo />
            </Link>
            <p className="max-w-md text-xs sm:text-[13px] leading-relaxed text-muted-foreground">
              {hi
                ? 'वैदिक, कैल्डियन और लो शू ग्रिड पद्धति पर आधारित प्रामाणिक अंक ज्योतिष मार्गदर्शन। जन्म तिथि, नाम और मोबाइल नंबर से सटीक विश्लेषण और व्यावहारिक उपाय।'
                : 'Authentic numerology platform guided by Vedic, Chaldean, and Lo Shu grid systems. Exact calculations, personalized remedies, and certified life reports.'}
            </p>

            {/* Expert Profile Micro-Card */}
            <Link
              href="/about"
              className="inline-flex items-center gap-3 rounded-xl border border-gold/30 bg-gold/5 p-2.5 pr-4 hover:bg-gold/10 hover:border-gold/50 transition-all group"
            >
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-gold/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                <Image
                  src="/images/acharya-nandram-512.png"
                  alt="Acharya Nandram"
                  width={44}
                  height={44}
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <div className="leading-tight">
                <span className="block font-cinzel text-xs font-bold text-foreground group-hover:text-gold transition-colors">
                  {hi ? 'आचार्य नंदराम' : 'Acharya Nandram'}
                </span>
                <span className="text-[10.5px] text-gold font-medium">
                  {hi ? 'अंक ज्योतिषी · 15+ वर्ष अनुभव' : 'Master Numerologist · 15+ Yrs Exp'}
                </span>
                <span className="block text-[10px] text-muted-foreground mt-0.5">
                  <Bi en="Vedic · Chaldean · Lo Shu" hi="वैदिक · कैल्डियन · लो शू" />
                </span>
              </div>
              <ChevronRight className="h-4 w-4 ml-auto text-gold/60 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* 4 Pillars of Trust */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-xl border border-gold/15 bg-background/50 p-3 sm:p-3.5 space-y-1">
              <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                <Calculator className="h-4 w-4 text-gold shrink-0" />
                <span>{hi ? 'सटीक पारंपरिक गणना' : 'Exact Calculations'}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                {hi ? 'वैदिक मूलांक-भाग्यांक, कैल्डियन नाम मान और लो शू ग्रिड।' : 'Vedic Moolank, Bhagyank, Chaldean name values & Lo Shu grid.'}
              </p>
            </div>

            <div className="rounded-xl border border-gold/15 bg-background/50 p-3 sm:p-3.5 space-y-1">
              <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                <ShieldCheck className="h-4 w-4 text-gold shrink-0" />
                <span>{hi ? 'सुरक्षित व गोपनीय' : '100% Private & Safe'}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                {hi ? 'DPDP अधिनियम 2023 के तहत सुरक्षित डेटा एन्क्रिप्शन।' : 'DPDP Act 2023 compliant, client data strictly private.'}
              </p>
            </div>

            <div className="rounded-xl border border-gold/15 bg-background/50 p-3 sm:p-3.5 space-y-1">
              <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                <Sparkles className="h-4 w-4 text-gold shrink-0" />
                <span>{hi ? 'व्यावहारिक मार्गदर्शन' : 'Practical Remedies'}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                {hi ? 'रंग, दिन, नाम सुधार और सरल उपाय बिना अंधविश्वास के।' : 'Colors, days, name harmony & easy remedies without fear.'}
              </p>
            </div>

            <div className="rounded-xl border border-gold/15 bg-background/50 p-3 sm:p-3.5 space-y-1">
              <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                <FileText className="h-4 w-4 text-gold shrink-0" />
                <span>{hi ? 'डिज़ाइन की हुई PDF रिपोर्ट' : 'Designed PDF Reports'}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                {hi ? 'अंग्रेज़ी, हिंदी व हिंग्लिश में विस्तृत जीवन रिपोर्ट।' : 'English, Hindi & Hinglish certified life reports in ~2 hrs.'}
              </p>
            </div>
          </div>
        </div>

        {/* 4-Column Navigation Links */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 md:grid-cols-4 lg:gap-10">
          {/* Column 1: Services */}
          <div className="space-y-3">
            <h4 className="font-cinzel text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-gold" />
              <Bi en="Personal Services" hi="व्यक्तिगत सेवाएँ" />
            </h4>
            <ul className="space-y-2 text-[12px]">
              <li><Link href="/pricing" className="hover:text-gold transition-colors font-medium text-foreground/90"><Bi en="Complete Life Report (PDF)" hi="संपूर्ण जीवन रिपोर्ट (PDF)" /></Link></li>
              <li><Link href="/personal-numerology-report" className="hover:text-gold transition-colors"><Bi en="Personal Reading" hi="व्यक्तिगत अंक विश्लेषण" /></Link></li>
              <li><Link href="/name-numerology" className="hover:text-gold transition-colors"><Bi en="Name Numerology Correction" hi="नाम व वर्तनी सुधार" /></Link></li>
              <li><Link href="/mobile-number-numerology" className="hover:text-gold transition-colors"><Bi en="Lucky Mobile Number" hi="शुभ मोबाइल नंबर" /></Link></li>
              <li><Link href="/couple-compatibility-report" className="hover:text-gold transition-colors"><Bi en="Couple Compatibility" hi="विवाह व जोड़ी अनुकूलता" /></Link></li>
              <li><Link href="/baby-name-numerology" className="hover:text-gold transition-colors"><Bi en="Baby Name Selection" hi="शिशु नामकरण संस्कार" /></Link></li>
              <li><Link href="/business-name-numerology" className="hover:text-gold transition-colors"><Bi en="Business Name Numerology" hi="व्यवसाय व कंपनी नाम" /></Link></li>
              <li><Link href="/personal-year-consultancy" className="hover:text-gold transition-colors"><Bi en="Personal Year Guidance" hi="व्यक्तिगत वर्ष फल" /></Link></li>
              <li><Link href="/international-numerology" className="hover:text-gold transition-colors text-amber-400/90"><Bi en="International Clients (USD)" hi="अंतरराष्ट्रीय सेवाएँ (USD)" /></Link></li>
            </ul>
          </div>

          {/* Column 2: Calculators */}
          <div className="space-y-3">
            <h4 className="font-cinzel text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
              <Calculator className="h-3.5 w-3.5 text-gold" />
              <Bi en="Free Calculators" hi="मुफ़्त कैलकुलेटर" />
            </h4>
            <ul className="space-y-2 text-[12px]">
              <li><Link href="/calculators" className="hover:text-gold transition-colors font-medium text-foreground/90"><Bi en="All Free Calculators" hi="सभी 9+ कैलकुलेटर" /></Link></li>
              <li><Link href="/calculators" className="hover:text-gold transition-colors"><Bi en="Moolank (Driver) Number" hi="मूलांक कैलकुलेटर" /></Link></li>
              <li><Link href="/calculators" className="hover:text-gold transition-colors"><Bi en="Bhagyank (Conductor) Number" hi="भाग्यांक कैलकुलेटर" /></Link></li>
              <li><Link href="/calculators" className="hover:text-gold transition-colors"><Bi en="Lo Shu Grid Chart" hi="लो शू ग्रिड चार्ट" /></Link></li>
              <li><Link href="/angel-numbers/calculator" className="hover:text-gold transition-colors"><Bi en="Angel Number Calculator" hi="एंजेल नंबर कैलकुलेटर" /></Link></li>
              <li><Link href="/calculators" className="hover:text-gold transition-colors"><Bi en="Mobile Vibration Score" hi="मोबाइल नंबर स्कोर" /></Link></li>
              <li><Link href="/calculators" className="hover:text-gold transition-colors"><Bi en="Kua Number (Feng Shui)" hi="कुआ नंबर कैलकुलेटर" /></Link></li>
              <li><Link href="/calculators" className="hover:text-gold transition-colors"><Bi en="Name Spelling Value" hi="नाम अंक मान (कैल्डियन)" /></Link></li>
              <li><Link href="/calculators" className="hover:text-gold transition-colors"><Bi en="Vehicle & House Number" hi="वाहन व मकान नंबर" /></Link></li>
            </ul>
          </div>

          {/* Column 3: Sacred Numbers & Guides */}
          <div className="space-y-3">
            <h4 className="font-cinzel text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-gold" />
              <Bi en="Sacred Guides" hi="मार्गदर्शिकाएँ" />
            </h4>
            <ul className="space-y-2 text-[12px]">
              <li><Link href="/mulank" className="hover:text-gold transition-colors font-medium text-foreground/90"><Bi en="Mulank Numbers 1 to 9" hi="मूलांक 1 से 9 संपूर्ण गाइड" /></Link></li>
              <li><Link href="/bhagyank" className="hover:text-gold transition-colors font-medium text-foreground/90"><Bi en="Bhagyank Numbers 1 to 9" hi="भाग्यांक 1 से 9 संपूर्ण गाइड" /></Link></li>
              <li><Link href="/angel-numbers" className="hover:text-gold transition-colors"><Bi en="Angel Numbers (111–9999)" hi="एंजेल नंबर्स का अर्थ" /></Link></li>
              <li><Link href="/reading" className="hover:text-gold transition-colors"><Bi en="Online Reading by DOB" hi="जन्म तिथि से तुरंत फल" /></Link></li>
              <li><Link href="/blog" className="hover:text-gold transition-colors"><Bi en="Numerology Articles & Blog" hi="अंक ज्योतिष ब्लॉग व लेख" /></Link></li>
              <li>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event('mn-open-ebook-popup'))}
                  className="hover:text-gold transition-colors text-gold font-semibold flex items-center gap-1 text-left"
                >
                  <span>🎁</span>
                  <Bi en="Free Guide eBook (21p PDF)" hi="मुफ़्त अंक ज्योतिष ई-बुक" />
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: About & Legal */}
          <div className="space-y-3">
            <h4 className="font-cinzel text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-gold" />
              <Bi en="About & Trust" hi="संस्थान व नीतियाँ" />
            </h4>
            <ul className="space-y-2 text-[12px]">
              <li><Link href="/about" className="hover:text-gold transition-colors font-medium text-foreground/90"><Bi en="About Acharya Nandram" hi="आचार्य नंदराम परिचय" /></Link></li>
              <li><Link href="/pricing" className="hover:text-gold transition-colors"><Bi en="Consultation Fees & Plans" hi="परामर्श शुल्क व प्लान" /></Link></li>
              <li><Link href="/contact" className="hover:text-gold transition-colors"><Bi en="Contact & Consultation" hi="संपर्क व अपॉइंटमेंट" /></Link></li>
              <li><Link href="/terms" className="hover:text-gold transition-colors"><Bi en="Terms of Service" hi="सेवा की शर्तें" /></Link></li>
              <li><Link href="/privacy" className="hover:text-gold transition-colors"><Bi en="Privacy & DPDP Policy" hi="गोपनीयता नीति" /></Link></li>
              <li><Link href="/refund" className="hover:text-gold transition-colors"><Bi en="Refund Policy" hi="रिफ़ंड नीति" /></Link></li>
              <li><Link href="/disclaimer" className="hover:text-gold transition-colors"><Bi en="Legal Disclaimer" hi="अस्वीकरण" /></Link></li>
            </ul>
          </div>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="rounded-xl border border-gold/15 bg-card/60 p-4 sm:p-5 text-[11px] leading-relaxed text-muted-foreground/80 space-y-2">
          <p className="font-semibold text-foreground/90">
            <Bi en="Traditional Numerology Guidance Disclaimer" hi="पारंपरिक अंक ज्योतिष मार्गदर्शन अस्वीकरण" />
          </p>
          <p>
            {t.disclaimer}{' '}
            <Link href="/disclaimer" className="underline underline-offset-2 hover:text-gold text-foreground/85">
              <Bi en="Read our complete disclaimer policy" hi="हमारी संपूर्ण अस्वीकरण नीति पढ़ें" />
            </Link>.
          </p>
        </div>

        {/* Bottom Bar: Copyright & Quick Links */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gold/15 text-[11.5px]">
          <p>© {new Date().getFullYear()} {t.brand}. <Bi en="All rights reserved." hi="सर्वाधिकार सुरक्षित।" /></p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link href="/terms" className="hover:text-gold transition-colors"><Bi en="Terms" hi="शर्तें" /></Link>
            <span className="text-gold/30">·</span>
            <Link href="/privacy" className="hover:text-gold transition-colors"><Bi en="Privacy" hi="गोपनीयता" /></Link>
            <span className="text-gold/30">·</span>
            <Link href="/refund" className="hover:text-gold transition-colors"><Bi en="Refunds" hi="रिफ़ंड" /></Link>
            <span className="text-gold/30">·</span>
            <Link href="/disclaimer" className="hover:text-gold transition-colors"><Bi en="Disclaimer" hi="अस्वीकरण" /></Link>
            <span className="text-gold/30">·</span>
            <Link href="/contact" className="hover:text-gold transition-colors"><Bi en="Support" hi="सहायता" /></Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
