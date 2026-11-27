'use client';
import * as React from 'react';
import { PurchasedServices } from '@/components/account/purchased-services';
import Link from 'next/link';
import { Download, Palette } from 'lucide-react';
import { useApp } from '@/components/layout/providers';
import { buttonVariants, Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/misc';
import { api, download, ApiError } from '@/lib/client/api';
import { SecurityPanel } from '@/components/account/security-panel';
import { FamilyPanel } from '@/components/account/family-panel';
import { formatMoney } from '@/lib/billing/currency';

interface Data {
  user: { name: string | null; email: string | null; phone: string | null; role: string; hasPassword?: boolean };
  account: { planCode?: string | null; planName: string | null; proUntil: string | null; credits: number; features: { whiteLabel: boolean } };
  payments: { id: string; planCode: string; amountPaise: number; currency?: 'INR' | 'USD'; status: string; invoiceNumber: string | null; createdAt: string }[];
  ledger: { id: string; delta: number; reason: string; createdAt: string }[];
  serviceOrders?: { id: string; serviceCode: string; status: string; createdAt: string; deliveredAt: string | null; invoiceNumber: string | null }[];
}
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
  const [err, setErr] = React.useState<'unauth' | 'error' | null>(null);
  React.useEffect(() => {
    api<Data>('/api/account')
      .then((res) => { setD(res); setErr(null); })
      .catch((e) => {
        setD(null);
        setErr(e instanceof ApiError && e.status === 401 ? 'unauth' : 'error');
      });
  }, []);
  if (err === 'unauth') {
    return (
      <div className="container max-w-md py-16 text-center space-y-4">
        <h1 className="font-serif text-2xl font-bold">{t.account.title}</h1>
        <p className="text-sm text-muted-foreground">{hi ? 'अपना खाता देखने के लिए कृपया साइन इन करें।' : 'Please sign in to view your account.'}</p>
        <Link href="/login" className={buttonVariants({ variant: 'gold' })}>{hi ? 'साइन इन करें' : 'Sign in'}</Link>
      </div>
    );
  }
  if (err === 'error') {
    return (
      <div className="container max-w-md py-16 text-center space-y-4">
        <h1 className="font-serif text-2xl font-bold">{t.account.title}</h1>
        <p className="text-sm text-danger">{t.err.server}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>{hi ? 'पुनः प्रयास करें' : 'Try again'}</Button>
      </div>
    );
  }
  if (!d) return <div className="container py-12"><div className="h-40 animate-pulse rounded-lg bg-muted" /></div>;
  return (
    <div className="container max-w-4xl space-y-6 py-8 sm:py-12">
      <h1 className="text-3xl font-bold sm:text-4xl">{t.account.title}</h1>
      <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-lg p-5">
        <div className="min-w-0">
          <p className="truncate font-serif text-xl font-semibold">{d.user.name}</p>
          <p className="truncate text-sm text-muted-foreground">{d.user.email ?? d.user.phone}</p>
        </div>
        {d.account.features.whiteLabel && <Link href="/settings/branding" className={buttonVariants({ variant: 'outline', size: 'sm' })}><Palette /> {t.account.branding}</Link>}
      </div>
      <FamilyPanel />
      <section className="glass rounded-lg p-5">
        <h2 className="mb-3 text-xl font-semibold">{t.account.payments}</h2>
        {d.payments.length === 0 ? <p className="text-sm text-muted-foreground">—</p> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-sm"><tbody>
            {d.payments.map((p) => (
              <tr key={p.id} className="border-b border-border/50">
                <td className="py-2">{new Date(p.createdAt).toLocaleDateString('en-IN')}</td><td>{hi ? W(p.planCode) : p.planCode}</td><td>{formatMoney(p.amountPaise, p.currency ?? 'INR')}</td>
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
      <PurchasedServices compact />
      <SecurityPanel hasPassword={d.user.hasPassword !== false} isAdmin={d.user.role === 'super_admin'} />
    </div>
  );
}
