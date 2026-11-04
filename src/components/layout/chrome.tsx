'use client';
import * as React from 'react';
import Link from 'next/link';
import { LogOut, Moon, Shield, Sun, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useApp } from './providers';
import { Button } from '@/components/ui/button';

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

/** Brand wordmark: "my" italic, main name in a gold gradient, ".com" small and muted. */
function Wordmark({ brand }: { brand: string }) {
  const m = /^(my)(.+?)(\.[a-z]{2,})$/i.exec(brand);
  if (!m) return <span className="hidden font-serif text-lg font-semibold sm:inline">{brand}</span>;
  return (
    <span className="hidden flex-col leading-none sm:flex" aria-label={brand}>
      <span className="font-serif text-xl tracking-wide">
        <span className="italic font-light text-foreground/70">{m[1]}</span>
        <span className="bg-gradient-to-r from-gold via-amber-300 to-gold bg-clip-text font-bold text-transparent">{m[2]}</span>
        <span className="ml-0.5 align-baseline text-xs font-medium tracking-widest text-muted-foreground">{m[3]}</span>
      </span>
      <span className="mt-1 text-[9px] uppercase tracking-[0.3em] text-gold/80">Numbers · Destiny · Clarity</span>
    </span>
  );
}

export function Header() {
  const { t, lang, setLang, theme, setTheme, me, refreshMe } = useApp();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const user = me?.user;
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setOpen(false); await refreshMe(); router.push('/');
  }
  return (
    <header className="sticky top-0 z-40 border-b border-gold/20 bg-background/70 backdrop-blur-md">
      <div className="container flex h-16 items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-maroon to-gold font-serif text-lg font-bold text-white">ॐ</span>
          <Wordmark brand={t.brand} />
        </Link>
        <nav className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <Link href="/reading" className="hidden whitespace-nowrap rounded-md px-3 py-2 text-sm hover:bg-muted lg:inline-block">{t.nav.reading}</Link>
          <Link href="/calculators" className="hidden whitespace-nowrap rounded-md px-3 py-2 text-sm hover:bg-muted md:inline-block">{t.nav.calculators}</Link>
          <Link href="/pricing" className="hidden whitespace-nowrap rounded-md px-3 py-2 text-sm hover:bg-muted sm:inline-block">{t.nav.pricing}</Link>
          {user && <Link href="/dashboard" className="whitespace-nowrap rounded-md px-2 py-2 text-sm hover:bg-muted sm:px-3">{t.nav.dashboard}</Link>}
          <div className="flex rounded-md border border-gold/40 p-0.5 text-xs" role="group" aria-label="Language">
            {(['en', 'hi'] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l}
                className={`rounded px-2 py-1 ${lang === l ? 'bg-gold/25 font-semibold' : 'text-muted-foreground'}`}>{l === 'en' ? 'EN' : 'हिं'}</button>
            ))}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle dark mode">
            {theme === 'dark' ? <Sun /> : <Moon />}
          </Button>
          {me && !user && <Link href="/login" className="whitespace-nowrap rounded-md border border-gold/50 px-3 py-1.5 text-sm hover:bg-gold/10">{t.auth.signin}</Link>}
          {user && (
            <div className="relative">
              <Button variant="ghost" size="icon" aria-label={t.auth.account} aria-expanded={open} onClick={() => setOpen(!open)}><UserRound /></Button>
              {open && (
                <div className="glass absolute right-0 top-11 w-56 rounded-lg bg-background p-2 text-sm shadow-xl" onMouseLeave={() => setOpen(false)}>
                  <p className="truncate px-2 py-1 text-xs text-muted-foreground">{user.name || user.email || user.phone}</p>
                  <Link href="/account" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-muted"><UserRound className="h-4 w-4" />{t.auth.account}</Link>
                  {user.role === 'super_admin' && <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-muted"><Shield className="h-4 w-4" />{t.auth.admin}</Link>}
                  <button onClick={logout} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-muted"><LogOut className="h-4 w-4" />{t.auth.logout}</button>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  const { t } = useApp();
  return (
    <footer className="mt-16 border-t border-gold/20 py-8 text-center text-xs text-muted-foreground">
      <div className="container space-y-2">
        <p className="mx-auto max-w-2xl">{t.disclaimer}</p>
        <p className="flex flex-wrap justify-center gap-x-4 gap-y-1"><Link href="/terms" className="hover:text-foreground">Terms of Service</Link><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link><Link href="/refund" className="hover:text-foreground">Refund Policy</Link><Link href="/pricing" className="hover:text-foreground">{t.nav.pricing}</Link><Link href="/calculators" className="hover:text-foreground">{t.nav.calculators}</Link></p>
        <p>© {new Date().getFullYear()} {t.brand}</p>
      </div>
    </footer>
  );
}
