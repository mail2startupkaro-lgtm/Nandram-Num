import type { Metadata } from 'next';
import { AffiliateDashboard } from '@/components/affiliate/affiliate-dashboard';

export const metadata: Metadata = { title: 'Affiliate dashboard', robots: { index: false, follow: false } };

export default function AffiliatePage() { return <AffiliateDashboard />; }
