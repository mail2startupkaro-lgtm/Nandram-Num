import { ServiceLanding, serviceMetadata } from '@/components/services/service-landing';

export const metadata = serviceMetadata('mobile-number-numerology');
export const revalidate = 300;

export default function Page() {
  return <ServiceLanding slug="mobile-number-numerology" />;
}
