import type { Metadata, Viewport } from 'next';
import './globals.css';
import './cosmic.css';
import { Providers } from '@/components/layout/providers';
import { Footer, Header } from '@/components/layout/chrome';
import { CosmicBackground } from '@/components/layout/cosmic-bg';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || 'http://localhost:3000'),
  title: { default: '[Brand Name] – Numerology Reading', template: '%s · [Brand Name]' },
  description: 'Moolank, Bhagyank, Lo Shu Grid, name, mobile and marriage compatibility numerology with practical remedies.',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#140f2b' };

// Applies the saved theme before first paint (avoids a light/dark flash).
const themeScript = `try{var t=localStorage.getItem('theme');if(t!=='light'){document.documentElement.classList.add('dark')}}catch(e){document.documentElement.classList.add('dark')}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Cormorant+Garamond:wght@500;600&family=Playfair+Display:wght@500;600;700&family=Poppins:wght@300;400;500;600&family=Noto+Sans+Devanagari:wght@400;500;600&display=swap" rel="stylesheet" />
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
