import type { NextConfig } from 'next';

const apiUrl = process.env.API_URL || 'http://localhost:3001';

const config: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Song4Her', value: '🦋' },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [],
  },
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000', '*.trycloudflare.com'] },
  },
};

export default config;
