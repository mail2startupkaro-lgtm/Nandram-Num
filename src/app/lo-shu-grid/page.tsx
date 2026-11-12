import { ServiceLanding, serviceMetadata } from '@/components/services/service-landing';

export const metadata = serviceMetadata('lo-shu-grid');
export const revalidate = 300;

export default function Page() {
  return <ServiceLanding slug="lo-shu-grid" />;
}
