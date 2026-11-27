import { isPayable, listServices } from '@/lib/billing/services';
import { serviceUsd } from '@/lib/billing/currency';
import type { PublicService } from '@/components/services/book-service';
import { ReadingClient } from '@/components/reading/reading-client';

// Cached and refreshed every 5 minutes (prices edited in Admin appear within 5 min) – the page opens instantly instead of waiting for the database.
export const revalidate = 300;

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
