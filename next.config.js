/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '/add-signature' : '',
  basePath: process.env.NODE_ENV === 'production' ? '/add-signature' : '',
  trailingSlash: true,
}

module.exports = nextConfig 