/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '/add-signature' : '',
  basePath: process.env.NODE_ENV === 'production' ? '/add-signature' : '',
  trailingSlash: true,
  // Fix CSS loading in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Ensure CSS is properly loaded
  transpilePackages: ['@fontsource'],
  // Ensure proper static file serving
  distDir: 'dist',
  cleanDistDir: true,
}

module.exports = nextConfig 