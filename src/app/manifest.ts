import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'myNumerologist.com – Numerology by Acharya Nandram', short_name: 'myNumerologist', start_url: '/', display: 'standalone',
    background_color: '#140f2b', theme_color: '#140f2b', icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
