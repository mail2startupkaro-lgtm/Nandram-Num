import Link from 'next/link';
import { CheckCircle, Sparkles } from 'lucide-react';
import { ForLang } from '@/components/i18n/bi';

const GOLD_BTN = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-gradient-to-r from-[hsl(43_75%_42%)] to-[hsl(43_85%_58%)] font-semibold text-[hsl(250_45%_10%)] hover:brightness-105';

/** Animated angel-number medallion (spinning rings, glowing core). */
export function AngelOrb({ n, size = 'lg' }: { n: string; size?: 'sm' | 'lg' }) {
  const big = size === 'lg';
  const text = n.length <= 2 ? (big ? 'text-6xl' : 'text-3xl') : n.length === 3 ? (big ? 'text-5xl' : 'text-2xl') : n.length === 4 ? (big ? 'text-4xl' : 'text-xl') : big ? 'text-3xl' : 'text-lg';
  return (
    <div className={`relative shrink-0 ${big ? 'h-44 w-44 sm:h-52 sm:w-52' : 'h-20 w-20'}`} aria-hidden>
      <span className="mk-spin absolute inset-0 rounded-full border border-dashed border-gold/60" />
      <span className="mk-spin-rev absolute inset-[10%] rounded-full border border-gold/30" />
      <span className="absolute inset-[18%] rounded-full bg-gold/20 blur-xl" />
      <span className="mk-pulse absolute inset-[20%] flex items-center justify-center rounded-full border border-gold/40 bg-gradient-to-br from-[#2a0e1b] to-[#24130a] shadow-[0_0_30px_hsl(var(--gold)/0.35)]">
        <span className={`gold-text font-cinzel font-bold tracking-tight ${text}`}>{n}</span>
      </span>
      {big && ['top-0 left-1/2', 'bottom-2 left-3', 'bottom-2 right-3'].map((p) => <span key={p} className={`mk-pulse absolute ${p} h-2 w-2 rounded-full bg-gold`} />)}
    </div>
  );
}

/** Call to action for angel-number pages. */
export function AngelCta({ n, variant = 'banner' }: { n?: string; variant?: 'banner' | 'big' }) {
  return <ForLang>{(l) => <AngelCtaView n={n} variant={variant} lang={l} />}</ForLang>;
}

const CTA = {
  en: { aria: 'Get personal angel number guidance', bigK: 'Personal angel number guidance', smallK: 'Free check', h: (n?: string) => (n ? `What Does ${n} Mean for You?` : 'What Is Your Angel Number Telling You?'),
    bigP: 'An angel number means most when it is read with your own date of birth and name. Acharya Nandram connects the numbers you keep seeing with your Moolank, Bhagyank and Lo Shu grid and gives clear, practical guidance.',
    smallP: (n?: string) => `Check ${n ?? 'any angel number'} against your date of birth in seconds, then get a complete reading from Acharya Nandram.`,
    list: ['Your personal angel numbers from your DOB', 'Compatibility of the number you keep seeing', 'Moolank, Bhagyank & Lo Shu grid reading', 'Love, career and money guidance', 'Remedies, lucky days and colours', 'Report in English, Hindi or Hinglish'],
    get: 'Get My Reading', check: 'Check with My Date of Birth', plans: 'See plans & pricing →' },
  hi: { aria: 'व्यक्तिगत एंजेल नंबर मार्गदर्शन पाएँ', bigK: 'व्यक्तिगत एंजेल नंबर मार्गदर्शन', smallK: 'मुफ़्त जाँच', h: (n?: string) => (n ? `${n} का आपके लिए क्या अर्थ है?` : 'आपका एंजेल नंबर आपसे क्या कह रहा है?'),
    bigP: 'एंजेल नंबर का अर्थ तब सबसे सार्थक होता है जब उसे आपकी अपनी जन्म तिथि और नाम के साथ पढ़ा जाए। आचार्य नंदराम आपको बार-बार दिखने वाले अंकों को आपके मूलांक, भाग्यांक और लो शू ग्रिड से जोड़कर स्पष्ट, व्यावहारिक मार्गदर्शन देते हैं।',
    smallP: (n?: string) => `${n ?? 'किसी भी एंजेल नंबर'} को कुछ ही सेकंड में अपनी जन्म तिथि से मिलाएँ, फिर आचार्य नंदराम से पूरी रीडिंग पाएँ।`,
    list: ['आपकी जन्म तिथि से आपके व्यक्तिगत एंजेल नंबर', 'बार-बार दिखने वाले अंक की अनुकूलता', 'मूलांक, भाग्यांक और लो शू ग्रिड रीडिंग', 'प्रेम, करियर और धन का मार्गदर्शन', 'उपाय, शुभ दिन और रंग', 'अंग्रेज़ी, हिंदी या हिंग्लिश में रिपोर्ट'],
    get: 'मेरी रीडिंग पाएँ', check: 'अपनी जन्म तिथि से जाँचें', plans: 'प्लान और मूल्य देखें →' },
};

function AngelCtaView({ n, variant, lang }: { n?: string; variant: 'banner' | 'big'; lang: 'en' | 'hi' }) {
  const t = CTA[lang];
  const big = variant === 'big';
  return (
    <aside aria-label={t.aria} className={`relative overflow-hidden rounded-2xl border border-gold/50 bg-gradient-to-br from-gold/15 via-card/70 to-maroon/25 ${big ? 'p-7 sm:p-10' : 'p-5 sm:p-6'} shadow-[0_0_34px_hsl(var(--gold)/0.16)]`}>
      <span className="mk-spin pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border border-dashed border-gold/40" />
      <div className={`relative grid items-center gap-5 ${big ? 'md:grid-cols-[1fr_auto]' : 'sm:grid-cols-[1fr_auto]'}`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">{big ? t.bigK : t.smallK}</p>
          <h3 className={`font-cinzel mt-1 font-bold ${big ? 'text-2xl sm:text-3xl' : 'text-xl'}`}>{t.h(n)}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{big ? t.bigP : t.smallP(n)}</p>
          {big && <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">{t.list.map((x) => <li key={x} className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />{x}</li>)}</ul>}
        </div>
        <div className="flex flex-col gap-2 sm:min-w-[220px]">
          <Link href="/reading" className={`${GOLD_BTN} h-12 px-6`}><Sparkles className="h-4 w-4" />{t.get}</Link>
          <Link href={n ? `/angel-numbers/calculator?n=${n}` : '/angel-numbers/calculator'} className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-md border border-gold/50 px-5 text-sm hover:bg-gold/10">{t.check}</Link>
          <Link href="/pricing" className="text-center text-xs text-gold hover:underline">{t.plans}</Link>
        </div>
      </div>
    </aside>
  );
}

export { GOLD_BTN };
