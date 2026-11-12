import { ServiceLanding, serviceMetadata } from '@/components/services/service-landing';

export const metadata = serviceMetadata('baby-name-numerology');
export const revalidate = 300;

export default function Page() {
  return <ServiceLanding slug="baby-name-numerology" />;
}
