/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    },
    images: {
        domains: ['fonts.gstatic.com', 'fonts.googleapis.com'],
        unoptimized: true,
    },
    reactStrictMode: true,
    // Remove static export configuration
}

module.exports = nextConfig