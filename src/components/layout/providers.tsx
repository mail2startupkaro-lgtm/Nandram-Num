'use client';
import * as React from 'react';
import { DICT, type Dict, type Lang } from '@/lib/i18n/dictionary';
import { safeStorage } from '@/lib/utils';

type Theme = 'light' | 'dark';
export interface Me {
  user: { id: string; name: string | null; email: string | null; phone: string | null; role: 'super_admin' | 'expert' | 'customer'; billingState: string | null } | null;
  account?: { planCode: string | null; planName: string | null; proUntil: string | null; credits: number; isAdmin: boolean; features: { fullReports: boolean; whiteLabel: boolean; bulk: boolean; share: boolean; watermark: boolean; maxProfiles: number | null } };
  providers: { email: boolean; sms: boolean; google: boolean };
}
interface Ctx { lang: Lang; setLang: (l: Lang) => void; t: Dict; theme: Theme; setTheme: (t: Theme) => void; me: Me | null; refreshMe: () => Promise<void> }
const AppCtx = React.createContext<Ctx | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>('en');
  const [theme, setThemeState] = React.useState<Theme>('dark');
  const [me, setMe] = React.useState<Me | null>(null);
  const refreshMe = React.useCallback(async () => {
    try { const r = await fetch('/api/auth/me', { cache: 'no-store' }); setMe(r.ok ? await r.json() : { user: null, providers: { email: true, sms: true, google: false } }); }
    catch { setMe({ user: null, providers: { email: true, sms: true, google: false } }); }
  }, []);
  React.useEffect(() => { refreshMe(); }, [refreshMe]);

  React.useEffect(() => {
    const s = safeStorage();
    const l = s.get('lang');
    if (l === 'en' || l === 'hi') setLangState(l);
    const th = s.get('theme');
    if (th === 'light' || th === 'dark') setThemeState(th);
  }, []);

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.lang = lang;
  }, [theme, lang]);

  const value = React.useMemo<Ctx>(() => ({
    lang, t: DICT[lang], theme, me, refreshMe,
    setLang: (l) => { setLangState(l); safeStorage().set('lang', l); },
    setTheme: (t) => { setThemeState(t); safeStorage().set('theme', t); },
  }), [lang, theme, me, refreshMe]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const c = React.useContext(AppCtx);
  if (!c) throw new Error('useApp must be used inside <Providers>');
  return c;
}
