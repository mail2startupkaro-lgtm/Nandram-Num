/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverComponentsExternalPackages: ['playwright-core', 'pdfjs-dist', 'pdf-lib', 'qrcode', 'pg', 'papaparse'],
    outputFileTracingIncludes: { '/api/**/*': ['./node_modules/@fontsource/{playfair-display,poppins,noto-sans-devanagari}/files/*.woff2', './drizzle/**/*'] },
  },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'DENY' },
    ] }];
  },
};
export default nextConfig;
