import { Bi } from '@/components/i18n/bi';
import { BusinessDirectory, BusinessQuickCheck } from '@/components/services/business-tools';
import { ServiceLanding, serviceMetadata } from '@/components/services/service-landing';
import { BUSINESS_COUNT } from '@/lib/business/catalogue';
import { funnelWhatsapp } from '@/lib/funnel/offer';

export const metadata = serviceMetadata('business-compatibility-numerology');
export const revalidate = 300;

const n = BUSINESS_COUNT.toLocaleString('en-IN');

export default function Page() {
  return (
    <ServiceLanding slug="business-compatibility-numerology">
      <section aria-labelledby="bqc-h" className="space-y-4">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold"><Bi en="Free · instant" hi="मुफ़्त · तुरंत" /></p>
          <h2 id="bqc-h" className="font-cinzel text-2xl font-bold sm:text-3xl"><Bi en="Which business suits your date of birth?" hi="आपकी जन्म तिथि के लिए कौन-सा व्यवसाय शुभ है?" /></h2>
          <p className="mx-auto mt-1 max-w-2xl text-muted-foreground"><Bi en="See your strongest sectors, your top 3 matches and a verdict on one business you are considering." hi="अपने सबसे मज़बूत क्षेत्र, शीर्ष 3 मेल और अपने विचाराधीन एक व्यवसाय पर निर्णय देखें।" /></p>
        </div>
        <BusinessQuickCheck whatsapp={funnelWhatsapp()} />
      </section>

      <section aria-labelledby="dir-h" className="space-y-4">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold"><Bi en={`${n} categories · 10 sectors`} hi={`${n} श्रेणियाँ · 10 क्षेत्र`} /></p>
          <h2 id="dir-h" className="font-cinzel text-2xl font-bold sm:text-3xl"><Bi en="Business Categories Covered in the Report" hi="रिपोर्ट में शामिल व्यवसाय श्रेणियाँ" /></h2>
          <p className="mx-auto mt-1 max-w-2xl text-muted-foreground"><Bi en="Every category below is scored for you and ranked in your report. Search for yours." hi="नीचे की हर श्रेणी को आपके लिए अंक दिए जाते हैं और रिपोर्ट में क्रमबद्ध किया जाता है। अपना व्यवसाय खोजें।" /></p>
        </div>
        <BusinessDirectory />
      </section>
    </ServiceLanding>
  );
}
