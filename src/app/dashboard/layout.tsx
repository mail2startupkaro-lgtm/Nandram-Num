import type { Metadata } from 'next';

/** Private or utility area: keep it out of search results. */
export const metadata: Metadata = { title: 'My Reports', robots: { index: false, follow: false, nocache: true } };

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
