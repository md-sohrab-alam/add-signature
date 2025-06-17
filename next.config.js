/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/add-signature',
  images: {
    unoptimized: true,
  },
  assetPrefix: '/add-signature/',
  trailingSlash: true,
  distDir: 'out',
  // Fix CSS loading in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Ensure CSS is properly loaded
  transpilePackages: ['@fontsource'],
  // Ensure proper static file serving
  poweredByHeader: false,
  reactStrictMode: true,
}

module.exports = nextConfig 