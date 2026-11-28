const isProd = process.env.NODE_ENV === 'production';
/**
 * Content Security Policy: only our own code plus the payment gateways (Cashfree for India, Razorpay for international
 * clients), Google Tag Manager and the Meta Pixel may run; no framing of our pages, no plugins.
 */
const RZP = 'https://checkout.razorpay.com https://api.razorpay.com';
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://*.cashfree.com https://checkout.razorpay.com https://www.googletagmanager.com https://*.googletagmanager.com https://connect.facebook.net${isProd ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' https://*.cashfree.com ${RZP} https://lumberjack.razorpay.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://www.facebook.com https://connect.facebook.net${isProd ? '' : ' ws: wss:'}`,
  `frame-src 'self' https://*.cashfree.com ${RZP} https://www.googletagmanager.com`,
  "worker-src 'self' blob:",
  "media-src 'self' blob: data:",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  `form-action 'self' https://*.cashfree.com ${RZP} https://accounts.google.com`,
  ...(isProd ? ['upgrade-insecure-requests'] : []),
].join('; ');

/** Production only: send mynumerologist.com and *.vercel.app visitors to the single canonical host (APP_URL). */
const canonical = (() => { try { return process.env.VERCEL_ENV === 'production' ? new URL(process.env.APP_URL || '') : null; } catch { return null; } })();
const hostRedirects = () => {
  if (!canonical) return [];
  const others = [canonical.host.startsWith('www.') ? canonical.host.slice(4) : `www.${canonical.host}`, process.env.VERCEL_PROJECT_PRODUCTION_URL, 'numerology-saas.vercel.app']
    .filter((h) => h && h !== canonical.host);
  return [...new Set(others)].flatMap((h) => [
    { source: '/', has: [{ type: 'host', value: h }], destination: `${canonical.origin}/`, permanent: true },
    { source: '/:path((?!api/).+)', has: [{ type: 'host', value: h }], destination: `${canonical.origin}/:path`, permanent: true },
  ]);
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  compress: true,
  images: { formats: ['image/avif', 'image/webp'] },
  experimental: {
    workerThreads: false,
    cpus: 2,
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts'],
  },
  serverExternalPackages: ['playwright-core', '@sparticuz/chromium-min', 'pdfjs-dist', 'pdf-lib', 'qrcode', 'pg', 'papaparse'],
  outputFileTracingIncludes: { '/api/**/*': ['./node_modules/@fontsource/{playfair-display,poppins,noto-sans-devanagari}/files/*.woff2', './drizzle/**/*', './node_modules/pdfjs-dist/**/*'] },
  async redirects() { return hostRedirects(); },
  async headers() {
    return [
      { source: '/:path*', headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), usb=()' },
        { key: 'Content-Security-Policy', value: CSP },
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
        { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
      ] },
      // Personal pages, share links and API responses: never indexed.
      { source: '/:area(api|dashboard|admin|account|settings|s|login)/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/:area(dashboard|admin|account|settings|login)', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      // Public, non-personal files: let browsers and CDNs cache them.
      { source: '/:file(.*\\.(?:png|jpg|jpeg|webp|avif|svg|ico|woff2))', headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' }] },
    ];
  },
};
export default nextConfig;
