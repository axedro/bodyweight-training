/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  transpilePackages: ['@bodyweight/shared'],
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig
