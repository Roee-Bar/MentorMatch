/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // Reduce Fast Refresh aggressiveness during E2E tests
  webpack: (config, { dev, isServer }) => {
    if (dev && process.env.E2E_TEST) {
      // Increase HMR poll interval to avoid conflicts during tests
      config.watchOptions = {
        ...config.watchOptions,
        poll: 5000, // Check for changes every 5 seconds instead of instantly
        aggregateTimeout: 1000,
      };
    }
    return config;
  },
};

module.exports = nextConfig;

