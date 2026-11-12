import { ServiceLanding, serviceMetadata } from '@/components/services/service-landing';

export const metadata = serviceMetadata('couple-compatibility-report');
export const revalidate = 300;

export default function Page() {
  return <ServiceLanding slug="couple-compatibility-report" />;
}
