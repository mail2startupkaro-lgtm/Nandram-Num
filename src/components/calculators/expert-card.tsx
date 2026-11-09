'use client';
import Link from 'next/link';
import { Award, CheckCircle, Sparkles } from 'lucide-react';
import { useApp } from '@/components/layout/providers';

/** "Your numerologist" card shown on every calculator page: Acharya Nandram, 15+ years, what he offers. */
export function ExpertCard({ compact = false }: { compact?: boolean }) {
  const { lang } = useApp();
  const hi = lang === 'hi';
  const skills = hi
    ? ['जन्म तिथि व मूलांक-भाग्यांक', 'नाम व हस्ताक्षर सुधार', 'मोबाइल व आधार वाइब्रेशन', 'विवाह व जोड़ी अनुकूलता', 'व्यक्तिगत उपाय']
    : ['Date of Birth & Moolank analysis', 'Name & signature harmony', 'Mobile & Aadhaar vibration', 'Couple compatibility', 'Personal remedies'];
  return (
    <section aria-label={hi ? 'आचार्य नंदराम' : 'Acharya Nandram'} className="relative overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-card/90 via-card/75 to-card/90 p-6 shadow-[0_0_40px_rgba(245,158,11,0.14)] sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
      <div className="grid items-center gap-6 md:grid-cols-[auto_1fr_auto]">
        <div className="relative mx-auto h-28 w-28 shrink-0">
          <span className="mk-spin absolute inset-0 rounded-full border border-dashed border-gold/60" />
          <span className="mk-spin-rev absolute inset-2 rounded-full border border-gold/30" />
          <span className="mk-pulse absolute inset-4 flex items-center justify-center rounded-full bg-gradient-to-br from-[#2a0e1b] to-[#24130a]"><span className="gold-text font-cinzel text-3xl font-bold">{hi ? 'आ' : 'AN'}</span></span>
        </div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">{hi ? 'आपके अंक ज्योतिषी' : 'Your numerologist'}</span>
          <h2 className="font-cinzel mt-1 text-2xl font-bold sm:text-3xl">{hi ? 'आचार्य नंदराम' : 'Acharya Nandram'}</h2>
          <div className="mt-2 inline-flex items-center gap-2 rounded-md bg-gold/15 px-3 py-1 text-sm font-semibold text-gold"><Award className="h-4 w-4" />{hi ? 'अनुभव: 15+ वर्ष से अधिक' : 'Experience: More than 15+ Years'}</div>
          {!compact && <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">{hi
            ? 'वैदिक अंक ज्योतिष, कैल्डियन पद्धति और लो शू ग्रिड में 15+ वर्षों की साधना के साथ, आचार्य नंदराम ने हज़ारों लोगों और परिवारों को सटीक अंक विश्लेषण और व्यक्तिगत उपायों से स्पष्टता और सफलता की राह दिखाई है।'
            : 'With more than 15 years of dedicated practice in Vedic, Chaldean and Lo Shu grid systems, Acharya Nandram has guided thousands of individuals and families toward clarity and success through precise number analysis and personal remedies. Every calculator here follows his traditional rules.'}</p>}
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-foreground/85">{skills.map((s) => <span key={s} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1"><CheckCircle className="h-3.5 w-3.5 text-gold" />{s}</span>)}</div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
          <Link href="/reading" className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-gradient-to-r from-[hsl(43_75%_42%)] to-[hsl(43_85%_58%)] px-5 text-sm font-semibold text-[hsl(250_45%_10%)] hover:brightness-105"><Sparkles className="h-4 w-4" />{hi ? 'मेरी पूरी रीडिंग पाएं' : 'Get my full reading'}</Link>
          <Link href="/pricing" className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-md border border-gold/50 px-5 text-sm hover:bg-gold/10">{hi ? 'संपूर्ण जीवन रिपोर्ट' : 'Complete life report'}</Link>
        </div>
      </div>
    </section>
  );
}
