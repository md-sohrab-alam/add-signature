/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '',
  images: {
    unoptimized: true,
  },
  assetPrefix: '',
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
  // Handle canvas module
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
      };
    }
    config.module.rules.push({
      test: /node_modules\/canvas/,
      use: 'null-loader'
    });
    return config;
  },
}

module.exports = nextConfig 