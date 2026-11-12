import { ServiceLanding, serviceMetadata } from '@/components/services/service-landing';

export const metadata = serviceMetadata('name-numerology');
export const revalidate = 300;

export default function Page() {
  return <ServiceLanding slug="name-numerology" />;
}
