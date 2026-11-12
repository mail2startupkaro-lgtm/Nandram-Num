import Link from 'next/link';
import { Info } from 'lucide-react';
import { Bi } from '@/components/i18n/bi';
import { DISCLAIMER } from '@/lib/disclaimer';
import { cn } from '@/lib/utils';

/** Short numerology disclaimer with a link to /disclaimer. `agree` adds the "by continuing you agree" line (checkout). */
export function DisclaimerNote({ className, agree = false }: { className?: string; agree?: boolean }) {
  const { en, hi } = DISCLAIMER;
  return (
    <aside role="note" aria-label="Disclaimer" className={cn('flex gap-2 rounded-md border border-gold/25 bg-gold/5 p-3 text-xs leading-relaxed text-muted-foreground', className)}>
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
      <p>
        <b className="text-foreground/80"><Bi en={en.heading} hi={hi.heading} />:</b>{' '}
        {agree ? <Bi en={en.agree} hi={hi.agree} /> : <Bi en={en.short} hi={hi.short} />}{' '}
        <Link href="/disclaimer" className="text-gold underline-offset-2 hover:underline"><Bi en={en.readMore} hi={hi.readMore} /></Link>
      </p>
    </aside>
  );
}
