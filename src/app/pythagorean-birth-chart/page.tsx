import { Bi } from '@/components/i18n/bi';
import { PythagorasFree } from '@/components/services/pythagoras-free';
import { ServiceLanding, serviceMetadata } from '@/components/services/service-landing';
import { funnelWhatsapp } from '@/lib/funnel/offer';

export const metadata = serviceMetadata('pythagorean-birth-chart');
export const revalidate = 300;

export default function Page() {
  return (
    <ServiceLanding slug="pythagorean-birth-chart">
      <section id="free-square" aria-labelledby="pmf-h" className="scroll-mt-24 space-y-4">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold"><Bi en="Free · instant · no sign-up" hi="मुफ़्त · तुरंत · बिना साइन-अप" /></p>
          <h2 id="pmf-h" className="font-cinzel text-2xl font-bold sm:text-3xl"><Bi en="Build Your Pythagoras Square" hi="अपना पाइथागोरस वर्ग बनाएँ" /></h2>
          <p className="mx-auto mt-1 max-w-2xl text-muted-foreground"><Bi en="Enter your date of birth to see your square, your four working numbers and what your character, energy and logic cells say." hi="अपनी जन्म तिथि डालें और अपना वर्ग, चार कार्य-अंक और चरित्र, ऊर्जा व तर्क के खाने क्या कहते हैं, देखें।" /></p>
        </div>
        <PythagorasFree whatsapp={funnelWhatsapp()} />
      </section>
    </ServiceLanding>
  );
}
