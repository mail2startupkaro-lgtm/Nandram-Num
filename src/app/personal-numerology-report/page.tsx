import { ServiceLanding, serviceMetadata } from '@/components/services/service-landing';

export const metadata = serviceMetadata('personal-numerology-report');
export const revalidate = 300;

export default function Page() {
  return <ServiceLanding slug="personal-numerology-report" />;
}
