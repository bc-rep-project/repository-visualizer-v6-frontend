/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
      },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline';
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: blob:;
              font-src 'self';
              connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL || 'https://repository-visualizer-v6-backend.onrender.com'};
            `.replace(/\s+/g, ' ').trim()
          }
        ]
      }
    ];
  },
  reactStrictMode: true,
}

module.exports = nextConfig