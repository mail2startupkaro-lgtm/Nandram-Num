import { ServiceLanding, serviceMetadata } from '@/components/services/service-landing';

export const metadata = serviceMetadata('business-numerology-report');
export const revalidate = 300;

export default function Page() {
  return <ServiceLanding slug="business-numerology-report" />;
}
