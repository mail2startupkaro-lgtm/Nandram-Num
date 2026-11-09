import Link from 'next/link';
import { Award, BadgeCheck, BookOpen, CheckCircle, Languages, Sparkles, Users } from 'lucide-react';

/** Call-to-action block used inside every blog post. `banner` is compact (mid-article); `big` closes the article. */
export function BlogCta({ city, variant = 'banner' }: { city: string; variant?: 'banner' | 'big' }) {
  const big = variant === 'big';
  return (
    <aside aria-label="Get your numerology reading" className={`relative overflow-hidden rounded-2xl border border-gold/50 bg-gradient-to-br from-gold/15 via-card/70 to-maroon/25 ${big ? 'p-7 sm:p-10' : 'p-5 sm:p-6'} shadow-[0_0_34px_hsl(var(--gold)/0.16)]`}>
      <span className="mk-spin pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border border-dashed border-gold/40" />
      <div className={`relative grid items-center gap-5 ${big ? 'md:grid-cols-[1fr_auto]' : 'sm:grid-cols-[1fr_auto]'}`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">{big ? `For ${city}` : 'Free to start'}</p>
          <h3 className={`font-cinzel mt-1 font-bold ${big ? 'text-2xl sm:text-3xl' : 'text-xl'}`}>Get Your Personal Numerology Reading from Acharya Nandram</h3>
          <p className="mt-2 text-sm text-muted-foreground">{big ? `Whether you are in ${city} or anywhere in India, your Moolank, Bhagyank, Lo Shu grid, name and mobile number are read together and explained in simple language, with remedies you can follow.` : `Online for ${city} and all of India. Start with the free calculators, then get your complete life report.`}</p>
          {big && <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">{['Date of birth, Moolank & Bhagyank analysis', 'Name and signature harmony', 'Mobile number compatibility score', 'Couple compatibility reading', 'Designed PDF in English, Hindi or Hinglish', 'Personal remedies and lucky details'].map((x) => <li key={x} className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />{x}</li>)}</ul>}
        </div>
        <div className="flex flex-col gap-2 sm:min-w-[210px]">
          <Link href="/reading" className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-gradient-to-r from-[hsl(43_75%_42%)] to-[hsl(43_85%_58%)] px-6 font-semibold text-[hsl(250_45%_10%)] hover:brightness-105"><Sparkles className="h-4 w-4" />Get My Reading</Link>
          <Link href="/pricing" className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-md border border-gold/50 px-5 text-sm hover:bg-gold/10">See Plans &amp; Pricing</Link>
          <Link href="/calculators" className="text-center text-xs text-gold hover:underline">Or try the free calculators →</Link>
        </div>
      </div>
    </aside>
  );
}

/** Full profile of the numerologist, shown at the end of every post. Facts are the ones already published on the home page. */
export function AcharyaProfile({ city }: { city?: string }) {
  const stats: [string, string][] = [['15+', 'Years of experience'], ['1000s', 'Individuals & families guided'], ['3', 'Report languages: EN, हिं, Hinglish'], ['6', 'Reading modules']];
  const skills = ['Vedic numerology (Moolank, Bhagyank, Kua)', 'Chaldean name and signature analysis', 'Lo Shu grid and missing-number remedies', 'Mobile and Aadhaar vibration (consent-based)', 'Couple and marriage compatibility', 'Personal remedies: colours, days, mantras and daan'];
  return (
    <section id="expert" aria-label="About Acharya Nandram" className="relative overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-card/90 via-card/75 to-card/90 p-6 shadow-[0_0_40px_hsl(var(--gold)/0.14)] sm:p-9">
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
      <div className="relative grid gap-7 md:grid-cols-[auto_1fr]">
        <div className="relative mx-auto h-36 w-36 shrink-0">
          <span className="mk-spin absolute inset-0 rounded-full border border-dashed border-gold/60" />
          <span className="mk-spin-rev absolute inset-3 rounded-full border border-gold/30" />
          <span className="mk-pulse absolute inset-5 flex items-center justify-center rounded-full bg-gradient-to-br from-[#2a0e1b] to-[#24130a]"><span className="gold-text font-cinzel text-4xl font-bold">AN</span></span>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">About the author · Lead numerologist &amp; guide</p>
          <h2 className="font-cinzel mt-1 text-3xl font-bold">Acharya Nandram</h2>
          <p className="mt-1 inline-flex items-center gap-2 rounded-md bg-gold/15 px-3 py-1 text-sm font-semibold text-gold"><Award className="h-4 w-4" />Experience: More than 15+ Years</p>
          <p className="mt-3 text-muted-foreground">With more than 15 years of dedicated practice in Vedic, Chaldean and Lo Shu grid numerology, Acharya Nandram has guided thousands of individuals and families toward clarity, success and prosperity through precise number vibrations and personalised remedies.{city ? ` Reports and consultations are delivered online, so people in ${city} and across India can use them from home.` : ''}</p>
        </div>
      </div>
      <div className="relative mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">{stats.map(([n, l]) => <div key={l} className="rounded-lg border border-gold/25 bg-background/40 p-3 text-center"><p className="gold-text font-serif text-3xl font-bold">{n}</p><p className="text-xs text-muted-foreground">{l}</p></div>)}</div>
      <div className="relative mt-6 grid gap-6 md:grid-cols-2">
        <div><h3 className="mb-2 flex items-center gap-2 font-serif text-lg font-semibold"><BookOpen className="h-4 w-4 text-gold" />Areas of expertise</h3><ul className="space-y-1.5 text-sm">{skills.map((s) => <li key={s} className="flex gap-2"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />{s}</li>)}</ul></div>
        <div><h3 className="mb-2 flex items-center gap-2 font-serif text-lg font-semibold"><Users className="h-4 w-4 text-gold" />His approach</h3>
          <ul className="space-y-1.5 text-sm text-muted-foreground"><li className="flex gap-2"><span className="text-gold">✦</span>Exact, traditional calculations so results are consistent every time.</li><li className="flex gap-2"><span className="text-gold">✦</span>Plain-language explanations you can read with your family.</li><li className="flex gap-2"><span className="text-gold">✦</span>Guidance, not fear: numerology supports decisions, it does not replace professional advice.</li><li className="flex gap-2"><Languages className="mt-0.5 h-4 w-4 shrink-0 text-gold" />Reports in English, Hindi and Hinglish.</li></ul></div>
      </div>
      <div className="relative mt-7 flex flex-wrap gap-3">
        <Link href="/reading" className="inline-flex h-11 items-center gap-2 rounded-md bg-gradient-to-r from-[hsl(43_75%_42%)] to-[hsl(43_85%_58%)] px-5 text-sm font-semibold text-[hsl(250_45%_10%)] hover:brightness-105"><Sparkles className="h-4 w-4" />Start my free reading</Link>
        <Link href="/pricing" className="inline-flex h-11 items-center rounded-md border border-gold/50 px-5 text-sm hover:bg-gold/10">Complete life report</Link>
        <Link href="/calculators" className="inline-flex h-11 items-center rounded-md px-3 text-sm text-gold hover:underline">Free calculators →</Link>
      </div>
    </section>
  );
}
