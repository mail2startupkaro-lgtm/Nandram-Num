import type { Metadata, Viewport } from 'next';
import './globals.css';
import './cosmic.css';
import { Providers } from '@/components/layout/providers';
import { Footer, Header } from '@/components/layout/chrome';
import { CosmicBackground } from '@/components/layout/cosmic-bg';
import { fontVariables } from './fonts';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || 'http://localhost:3000'),
  title: { default: 'myNumerologist.com – Numerology Reading', template: '%s · myNumerologist.com' },
  description: 'Moolank, Bhagyank, Lo Shu Grid, name, mobile and marriage compatibility numerology with practical remedies.',
  verification: {
    google: 'google0e19ae8949867d4f',
  },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#140f2b' };

// Applies the saved theme before first paint (avoids a light/dark flash).
const themeScript = `try{var t=localStorage.getItem('theme');if(t!=='light'){document.documentElement.classList.add('dark')}}catch(e){document.documentElement.classList.add('dark')}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
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
