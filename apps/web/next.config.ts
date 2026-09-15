import type { NextConfig } from 'next';

const apiUrl = process.env.API_URL || 'http://127.0.0.1:3001';

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
          // Allow range requests to pass through for audio streaming
          { key: 'Access-Control-Allow-Headers', value: 'Range' },
          { key: 'Access-Control-Expose-Headers', value: 'Content-Range, Accept-Ranges, Content-Length' },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [],
  },
  experimental: {
    // Allow server actions from any origin (tunnel URLs, local IPs, etc.)
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        '127.0.0.1:3000',
        '*.trycloudflare.com',
        '*.cloudflare.com',
        // Allow any local network IP (192.168.x.x, 10.x.x.x)
        '192.168.*',
        '10.*',
        '172.*',
      ],
    },
  },
};

export default config;
