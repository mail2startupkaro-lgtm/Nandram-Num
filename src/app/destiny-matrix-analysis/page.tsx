import { Bi } from '@/components/i18n/bi';
import { DestinyMatrixFree } from '@/components/services/destiny-free';
import { ServiceLanding, serviceMetadata } from '@/components/services/service-landing';
import { funnelWhatsapp } from '@/lib/funnel/offer';

export const metadata = serviceMetadata('destiny-matrix-analysis');
export const revalidate = 300;

export default function Page() {
  return (
    <ServiceLanding slug="destiny-matrix-analysis">
      <section id="free-matrix" aria-labelledby="dmf-h" className="scroll-mt-24 space-y-4">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold"><Bi en="Free · instant · no sign-up" hi="मुफ़्त · तुरंत · बिना साइन-अप" /></p>
          <h2 id="dmf-h" className="font-cinzel text-2xl font-bold sm:text-3xl"><Bi en="See Your Destiny Matrix Chart" hi="अपना डेस्टिनी मैट्रिक्स चार्ट देखें" /></h2>
          <p className="mx-auto mt-1 max-w-2xl text-muted-foreground"><Bi en="Enter your date of birth to draw your full 22-arcana chart, with your personality, centre, talents and current life period." hi="अपनी जन्म तिथि डालें और पूरा 22-आर्काना चार्ट देखें – आपका व्यक्तित्व, केंद्र, प्रतिभा और जीवन की वर्तमान अवधि।" /></p>
        </div>
        <DestinyMatrixFree whatsapp={funnelWhatsapp()} />
      </section>
    </ServiceLanding>
  );
}
