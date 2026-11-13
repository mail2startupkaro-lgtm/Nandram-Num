'use client';
import * as React from 'react';
import Link from 'next/link';
import { LifeBuoy, LogOut, Menu, Moon, Shield, Sun, UserRound, X } from 'lucide-react';
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
    <div className="group flex items-center gap-2 sm:gap-2.5 transition-transform duration-200 hover:scale-[1.02]">
      {/* Sacred Emblem Icon */}
      <div className="relative flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/30 via-maroon/40 to-amber-900/40 p-[1.5px] shadow-[0_0_14px_rgba(245,158,11,0.25)] border border-amber-400/40 backdrop-blur-sm group-hover:border-amber-300 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all duration-300">
        <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-gradient-to-br from-[#2a0e1b] via-[#1a0a14] to-[#24130a]">
          <span className="font-serif text-base sm:text-lg font-bold bg-gradient-to-b from-amber-100 via-amber-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            ॐ
          </span>
        </div>
        {/* Subtle decorative gold sparkle ring */}
        <span className="absolute -inset-0.5 -z-10 rounded-xl bg-gradient-to-r from-gold/30 via-amber-300/20 to-gold/30 opacity-0 blur-sm group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Brand Name Typography */}
      <div className="flex flex-col leading-none" aria-label="myNumerologist.com">
        <span className="flex items-baseline tracking-normal">
          <span className="font-serif italic font-normal text-foreground/85 text-[16px] min-[400px]:text-[18px] sm:text-[21px] select-none">
            my
          </span>
          <span className="font-cinzel font-bold bg-gradient-to-r from-amber-200 via-amber-300 to-amber-500 bg-clip-text text-transparent text-[17px] min-[400px]:text-[19px] sm:text-[22px] tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] select-none">
            Numerologist
          </span>
          <span className="hidden font-sans font-semibold text-[11px] sm:inline sm:text-[12px] text-amber-400/90 tracking-wide select-none ml-0.5">
            .com
          </span>
        </span>
        <span className="mt-0.5 hidden text-[8.5px] uppercase tracking-[0.28em] font-medium text-gold/80 sm:block">
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
  return (
    <header className="sticky top-0 z-40 border-b border-gold/20 bg-background/70 backdrop-blur-md">
      <div className="container flex h-16 items-center gap-2">
        <Link href="/" className="flex items-center">
          <BrandLogo />
        </Link>
        <nav className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <Link href="/reading" className="hidden whitespace-nowrap rounded-md px-3 py-2 text-sm hover:bg-muted 2xl:inline-block">{t.nav.reading}</Link>
          <MulankMenu />
          <BhagyankMenu />
          <AngelMenu />
          <Link href="/calculators" className="hidden whitespace-nowrap rounded-md px-2.5 py-2 text-sm hover:bg-muted xl:inline-block">{t.nav.calculators}</Link>
          <ServicesMenu />
          <Link href="/blog" className="hidden whitespace-nowrap rounded-md px-2.5 py-2 text-sm hover:bg-muted lg:inline-block">{t.nav.blog}</Link>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('mn-open-ebook-popup'))}
            className="hidden items-center gap-1.5 whitespace-nowrap rounded-full border border-amber-400/50 bg-gradient-to-r from-amber-500/15 via-gold/20 to-amber-500/15 px-2.5 py-1 text-xs font-semibold text-gold hover:border-gold hover:bg-gold/20 xl:inline-flex transition-all"
            title={lang === 'hi' ? 'मुफ़्त अंक ज्योतिष ई-बुक प्राप्त करें' : 'Get Free Numerology eBook'}
          >
            <span className="text-amber-300">🎁</span>
            <Bi en="Free eBook" hi="मुफ़्त ई-बुक" />
          </button>
          <Link href="/contact" className="hidden whitespace-nowrap rounded-md px-2.5 py-2 text-sm hover:bg-muted 2xl:inline-block">{t.nav.contact}</Link>
          {user?.role === 'super_admin' && <Link href="/admin" className="inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-2 text-sm text-gold hover:bg-muted sm:px-3"><Shield className="h-4 w-4" />{t.auth.admin}</Link>}
          {user && <Link href="/dashboard" className="whitespace-nowrap rounded-md px-2 py-2 text-sm hover:bg-muted sm:px-3">{t.nav.dashboard}</Link>}
          <button type="button" onClick={() => setLang(lang === 'en' ? 'hi' : 'en')} aria-label={lang === 'en' ? 'हिंदी में देखें' : 'View in English'} className="rounded-md border border-gold/40 px-2 py-1 text-xs lg:hidden">{lang === 'en' ? 'हिं' : 'EN'}</button>
          <div className="hidden rounded-md border border-gold/40 p-0.5 text-xs lg:flex" role="group" aria-label={lang === 'hi' ? 'भाषा' : 'Language'}>
            {(['en', 'hi'] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l}
                className={`rounded px-2 py-1 ${lang === l ? 'bg-gold/25 font-semibold' : 'text-muted-foreground'}`}>{l === 'en' ? 'EN' : 'हिं'}</button>
            ))}
          </div>
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex md:hidden lg:inline-flex" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={lang === 'hi' ? 'डार्क मोड बदलें' : 'Toggle dark mode'}>
            {theme === 'dark' ? <Sun /> : <Moon />}
          </Button>
          {me && !user && <Link href="/login" className="whitespace-nowrap rounded-md border border-gold/50 px-2.5 py-1.5 text-sm hover:bg-gold/10 sm:px-3">{t.auth.signin}</Link>}
          <Button variant="ghost" size="icon" className="md:hidden" aria-label={lang === 'hi' ? 'मेन्यू' : 'Menu'} aria-expanded={nav} aria-controls="mobile-nav" onClick={() => setNav(!nav)}>{nav ? <X /> : <Menu />}</Button>
          {user && (
            <div className="relative">
              <Button variant="ghost" size="icon" aria-label={t.auth.account} aria-expanded={open} onClick={() => setOpen(!open)}><UserRound /></Button>
              {open && (
                <div className="glass absolute right-0 top-11 w-56 rounded-lg bg-background p-2 text-sm shadow-xl" onMouseLeave={() => setOpen(false)}>
                  <p className="truncate px-2 py-1 text-xs text-muted-foreground">{user.name || user.email || user.phone}</p>
                  <Link href="/account" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-muted"><UserRound className="h-4 w-4" />{t.auth.account}</Link>
                  <Link href="/contact?topic=support" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-muted"><LifeBuoy className="h-4 w-4" />{lang === 'hi' ? 'सहायता' : 'Help & support'}</Link>
                  {user.role === 'super_admin' && <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-muted"><Shield className="h-4 w-4" />{t.auth.admin}</Link>}
                  <button onClick={logout} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-muted"><LogOut className="h-4 w-4" />{t.auth.logout}</button>
                </div>
              )}
            </div>
          )}
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
  const { t } = useApp();
  return (
    <footer className="mt-16 border-t border-gold/20 py-8 text-center text-xs text-muted-foreground">
      <div className="container space-y-2">
        <p className="mx-auto max-w-2xl">{t.disclaimer} <Link href="/disclaimer" className="underline underline-offset-2 hover:text-foreground"><Bi en="Read the full disclaimer" hi="पूरा अस्वीकरण पढ़ें" /></Link></p>
        <p className="flex flex-wrap justify-center gap-x-4 gap-y-1"><Link href="/terms" className="hover:text-foreground"><Bi en="Terms of Service" hi="सेवा की शर्तें" /></Link><Link href="/privacy" className="hover:text-foreground"><Bi en="Privacy Policy" hi="गोपनीयता नीति" /></Link><Link href="/refund" className="hover:text-foreground"><Bi en="Refund Policy" hi="रिफ़ंड नीति" /></Link><Link href="/disclaimer" className="hover:text-foreground"><Bi en="Disclaimer" hi="अस्वीकरण" /></Link><button type="button" onClick={() => window.dispatchEvent(new Event('mn-open-ebook-popup'))} className="hover:text-gold font-medium text-gold"><Bi en="🎁 Free Guide eBook" hi="🎁 मुफ़्त ई-बुक" /></button><Link href="/mulank" className="hover:text-foreground">{t.nav.mulank}</Link><Link href="/bhagyank" className="hover:text-foreground">{t.nav.bhagyank}</Link><Link href="/angel-numbers" className="hover:text-foreground">{t.nav.angel}</Link><Link href="/angel-numbers/calculator" className="hover:text-foreground"><Bi en="Angel Number Calculator" hi="एंजेल नंबर कैलकुलेटर" /></Link><Link href="/blog" className="hover:text-foreground">{t.nav.blog}</Link><Link href="/pricing" className="hover:text-foreground">{t.nav.pricing}</Link><Link href="/calculators" className="hover:text-foreground">{t.nav.calculators}</Link><Link href="/services" className="hover:text-foreground">{t.nav.services}</Link><Link href="/international-numerology" className="hover:text-foreground"><Bi en="International clients" hi="अंतरराष्ट्रीय क्लाइंट" /></Link><Link href="/about" className="hover:text-foreground">{t.nav.about}</Link><Link href="/contact" className="hover:text-foreground">{t.nav.contact}</Link></p>
        <p>© {new Date().getFullYear()} {t.brand}</p>
      </div>
    </footer>
  );
}
