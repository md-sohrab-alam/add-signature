/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  assetPrefix: '/add-signature',
  basePath: '/add-signature',
  trailingSlash: true,
}

module.exports = nextConfig 