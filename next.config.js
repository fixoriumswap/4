/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: false
  },
  trailingSlash: false,
  output: 'standalone'
}

module.exports = nextConfig
