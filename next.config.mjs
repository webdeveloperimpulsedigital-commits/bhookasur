/** @type {import('next').NextConfig} */
const basePath = (
  process.env.NEXT_PUBLIC_BASE_PATH !== undefined
    ? process.env.NEXT_PUBLIC_BASE_PATH
    : '/bhookasur_ka_food_tour'
).replace(/\/+$/, '');

const nextConfig = {
  basePath: basePath || undefined,
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['mysql2', 'sharp'],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'commondatastorage.googleapis.com',
      }
    ],
  },
  allowedDevOrigins: ['192.168.31.211', 'localhost:3000', '192.168.31.211:3000', '127.0.0.1:3000'],
  async rewrites() {
    return [];
  },
  async redirects() {
    if (!basePath) return [];
    return [
      {
        source: '/',
        destination: basePath,
        basePath: false,
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/ai/dish-image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=2592000',
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        dns: false,
        child_process: false,
        buffer: false,
        diagnostics_channel: false,
      };
    }
    return config;
  },
};

export default nextConfig;
