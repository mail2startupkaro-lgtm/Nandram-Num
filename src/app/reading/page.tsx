import { isPayable, listServices } from '@/lib/billing/services';
import { serviceUsd } from '@/lib/billing/currency';
import type { PublicService } from '@/components/services/book-service';
import { ReadingClient } from '@/components/reading/reading-client';

export const dynamic = 'force-dynamic';

export default async function ReadingPage() {
  let initialServices: PublicService[] = [];
  try {
    const list = await listServices();
    initialServices = list.map((s) => ({
      code: s.code,
      en: s.en,
      hi: s.hi,
      intake: s.intake,
      payable: isPayable(s),
      pricePaise: isPayable(s) ? s.pricePaise : null,
      mrpPaise: isPayable(s) ? s.mrpPaise : null,
      usdCents: isPayable(s) ? serviceUsd(s).usd : null,
      usdMrpCents: isPayable(s) ? serviceUsd(s).usdMrp : null,
    }));
  } catch {
    // Fallback to client fetch if DB is temporarily unreachable during SSR.
  }
  return <ReadingClient initialServices={initialServices} />;
}
