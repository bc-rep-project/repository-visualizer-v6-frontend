/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
      },
  images: {
    domains: ['fonts.gstatic.com', 'fonts.googleapis.com'],
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
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
              font-src 'self' https://fonts.gstatic.com;
              img-src 'self' data: blob: https://fonts.gstatic.com;
              connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL || 'https://repository-visualizer-v6-backend.onrender.com'} http://localhost:8000;
            `.replace(/\s+/g, ' ').trim()
          }
        ]
      }
    ];
  },
  reactStrictMode: true
}

module.exports = nextConfig