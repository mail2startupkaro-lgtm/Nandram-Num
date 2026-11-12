'use client';
import * as React from 'react';
import Link from 'next/link';
import { Crown, Download, Palette } from 'lucide-react';
import { useApp } from '@/components/layout/providers';
import { buttonVariants, Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/misc';
import { api, download } from '@/lib/client/api';
import { SecurityPanel } from '@/components/account/security-panel';

interface Data {
  user: { name: string | null; email: string | null; phone: string | null; role: string; hasPassword?: boolean };
  account: { planCode?: string | null; planName: string | null; proUntil: string | null; credits: number; features: { whiteLabel: boolean } };
  payments: { id: string; planCode: string; amountPaise: number; status: string; invoiceNumber: string | null; createdAt: string }[];
  ledger: { id: string; delta: number; reason: string; createdAt: string }[];
  serviceOrders?: { id: string; serviceCode: string; status: string; createdAt: string; deliveredAt: string | null; invoiceNumber: string | null }[];
}
const SVC_STATUS: Record<string, [string, string]> = { paid: ['Received – in queue', 'प्राप्त – क्रम में'], in_progress: ['In progress', 'प्रगति पर'], delivered: ['Delivered', 'डिलीवर हो गया'], cancelled: ['Cancelled', 'रद्द'] };
const inr = (p: number) => `₹${(p / 100).toLocaleString('en-IN', { minimumFractionDigits: p % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

const HI_WORDS: Record<string, string> = {
  paid: 'भुगतान हुआ', failed: 'विफल', pending: 'लंबित', created: 'बनाया गया', refunded: 'रिफ़ंड हुआ',
  purchase: 'खरीद', unlock: 'रिपोर्ट अनलॉक', admin: 'एडमिन द्वारा', refund: 'रिफ़ंड',
  SINGLE: 'एकल रिपोर्ट', PACK5: '5 रिपोर्ट क्रेडिट', PRO_MONTHLY: 'प्रो मासिक', PRO_YEARLY: 'प्रो वार्षिक',
};
const PLAN_EN: Record<string, string> = { SINGLE: 'Single Report', PACK5: '5 Report Credits', PRO_MONTHLY: 'Pro Monthly', PRO_YEARLY: 'Pro Yearly' };

export default function AccountPage() {
  const { t, lang } = useApp();
  const hi = lang === 'hi';
  const W = (x: string) => (hi ? HI_WORDS[x] ?? x : x);
  const [d, setD] = React.useState<Data | null>(null);
  React.useEffect(() => { api<Data>('/api/account').then(setD).catch(() => setD(null)); }, []);
  if (!d) return <div className="container py-12"><div className="h-40 animate-pulse rounded-lg bg-muted" /></div>;
  return (
    <div className="container max-w-4xl space-y-6 py-8 sm:py-12">
      <h1 className="text-3xl font-bold sm:text-4xl">{t.account.title}</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass rounded-lg p-5"><p className="text-xs uppercase tracking-wider text-muted-foreground">{t.account.plan}</p><p className="mt-1 flex items-center gap-2 font-serif text-2xl font-semibold">{d.account.planName && <Crown className="h-5 w-5 text-gold" />}{d.account.planName ? (hi && d.account.planCode && PLAN_EN[d.account.planCode] === d.account.planName ? W(d.account.planCode) : d.account.planName) : t.account.freePlan}</p>{d.account.proUntil && <p className="text-xs text-muted-foreground">{t.account.until} {new Date(d.account.proUntil).toLocaleDateString('en-IN')}</p>}</div>
        <div className="glass rounded-lg p-5"><p className="text-xs uppercase tracking-wider text-muted-foreground">{t.account.credits}</p><p className="mt-1 font-serif text-4xl font-bold text-gold">{d.account.credits}</p></div>
        <div className="glass flex flex-col gap-2 rounded-lg p-5">
          <p className="truncate text-sm">{d.user.name}<br /><span className="text-muted-foreground">{d.user.email ?? d.user.phone}</span></p>
          <Link href="/pricing" className={buttonVariants({ variant: 'gold', size: 'sm' })}>{t.account.upgrade}</Link>
          {d.account.features.whiteLabel && <Link href="/settings/branding" className={buttonVariants({ variant: 'outline', size: 'sm' })}><Palette /> {t.account.branding}</Link>}
        </div>
      </div>
      <section className="glass rounded-lg p-5">
        <h2 className="mb-3 text-xl font-semibold">{t.account.payments}</h2>
        {d.payments.length === 0 ? <p className="text-sm text-muted-foreground">—</p> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-sm"><tbody>
            {d.payments.map((p) => (
              <tr key={p.id} className="border-b border-border/50">
                <td className="py-2">{new Date(p.createdAt).toLocaleDateString('en-IN')}</td><td>{hi ? W(p.planCode) : p.planCode}</td><td>{inr(p.amountPaise)}</td>
                <td><Badge tone={p.status === 'paid' ? 'good' : p.status === 'failed' ? 'bad' : 'default'}>{W(p.status)}</Badge></td>
                <td className="text-right">{p.invoiceNumber && <Button size="sm" variant="ghost" onClick={() => download(`/api/billing/invoices/${p.id}`)}><Download /> {p.invoiceNumber}</Button>}</td>
              </tr>
            ))}
          </tbody></table></div>
        )}
      </section>
      {d.ledger.length > 0 && (
        <section className="glass rounded-lg p-5">
          <h2 className="mb-3 text-xl font-semibold">{t.account.creditHistory}</h2>
          <ul className="space-y-1 text-sm">{d.ledger.map((l) => <li key={l.id} className="flex justify-between border-b border-border/40 py-1"><span>{new Date(l.createdAt).toLocaleDateString('en-IN')} · {W(l.reason)}</span><span className={l.delta > 0 ? 'text-success' : 'text-muted-foreground'}>{l.delta > 0 ? '+' : ''}{l.delta}</span></li>)}</ul>
        </section>
      )}
      {(d.serviceOrders?.length ?? 0) > 0 && (
        <section className="glass rounded-lg p-5">
          <h2 className="mb-3 text-xl font-semibold">{hi ? 'मेरी सेवाएँ' : 'My services'}</h2>
          <ul className="space-y-2 text-sm">{d.serviceOrders!.map((o) => <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 py-1.5"><span>{new Date(o.createdAt).toLocaleDateString('en-IN')} · {o.serviceCode.replace(/^SVC_/, '').replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase())}{o.invoiceNumber ? ` · ${o.invoiceNumber}` : ''}</span><Badge tone={o.status === 'delivered' ? 'good' : o.status === 'cancelled' ? 'bad' : 'gold'}>{(SVC_STATUS[o.status] ?? [o.status, o.status])[hi ? 1 : 0]}</Badge></li>)}</ul>
        </section>
      )}
      <SecurityPanel hasPassword={d.user.hasPassword !== false} isAdmin={d.user.role === 'super_admin'} />
    </div>
  );
}
