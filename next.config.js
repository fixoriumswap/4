/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Improve error handling and security
  poweredByHeader: false,
  compress: true,
  // Reduce bundle size and improve performance
  experimental: {
    optimizeCss: true,
  },
  // Add headers for better security and error handling
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0'
          }
        ]
      }
    ]
  },
  ...(process.env.NODE_ENV === 'production' && {
    output: 'export',
    trailingSlash: true,
    images: {
      unoptimized: true
    }
  })
}

module.exports = nextConfig
