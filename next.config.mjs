/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: { formats: ['image/avif', 'image/webp'] },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts'],
    serverComponentsExternalPackages: ['playwright-core', 'pdfjs-dist', 'pdf-lib', 'qrcode', 'pg', 'papaparse'],
    outputFileTracingIncludes: { '/api/**/*': ['./node_modules/@fontsource/{playfair-display,poppins,noto-sans-devanagari}/files/*.woff2', './drizzle/**/*'] },
  },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ] }, {
      // Public, non-personal files: let browsers and CDNs cache them.
      source: '/:file(.*\\.(?:png|jpg|jpeg|webp|avif|svg|ico|woff2))',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' }],
    }];
  },
};
export default nextConfig;
