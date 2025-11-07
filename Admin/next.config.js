// See https://nextjs.org/docs/app/api-reference/config/next-config
// for more information.
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static optimization for API routes
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Ensure API calls go to backend, not Next.js
  async rewrites() {
    return [];
  },
}

module.exports = nextConfig

