import type { Metadata, Viewport } from 'next';
import './globals.css';
import './cosmic.css';
import { Providers } from '@/components/layout/providers';
import { Footer, Header } from '@/components/layout/chrome';
import { CosmicBackground } from '@/components/layout/cosmic-bg';
import { fontVariables } from './fonts';
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, EXPERT, SITE_NAME, SITE_URL, jsonLd, orgLd } from '@/lib/seo/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: DEFAULT_TITLE, template: '%s | myNumerologist' },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: EXPERT.name, url: SITE_URL }],
  creator: EXPERT.name,
  publisher: SITE_NAME,
  keywords: ['numerology', 'numerologist', 'best numerologist in India', 'online numerology reading', 'numerology calculator', 'moolank', 'bhagyank', 'lo shu grid', 'name numerology', 'mobile number numerology', 'angel numbers', 'Acharya Nandram'],
  openGraph: { type: 'website', siteName: SITE_NAME, locale: 'en_IN', title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION },
  twitter: { card: 'summary_large_image', title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
  formatDetection: { telephone: false },
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION || 'google0e19ae8949867d4f', other: process.env.BING_SITE_VERIFICATION ? { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } : undefined },
  category: 'Spirituality',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#140f2b' };

// Applies the saved theme before first paint (avoids a light/dark flash).
const themeScript = `try{var t=localStorage.getItem('theme');if(t!=='light'){document.documentElement.classList.add('dark')}}catch(e){document.documentElement.classList.add('dark')}`;
// Applies the saved language (or ?lang=hi) before first paint: both languages are in the HTML and CSS shows one.
const langScript = `try{var d=document.documentElement,q=new URLSearchParams(location.search).get('lang'),l=q==='hi'||q==='en'?q:localStorage.getItem('lang');if(q==='hi'||q==='en')localStorage.setItem('lang',q);if(l==='hi'){d.setAttribute('data-lang','hi');d.lang='hi-IN'}else{d.setAttribute('data-lang','en')}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: langScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(orgLd()) }} />
      </head>
      <body>
        <Providers>
          <CosmicBackground />
          <Header />
          <main className="min-h-[70vh]">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
