/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@bodyweight/shared'],
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig
