/** @type {import('next').NextConfig} */
const nextConfig = {
  // 基本的な最適化と互換性設定
  trailingSlash: false,
  experimental: {
    optimizePackageImports: ['lucide-react', '@sanity/client', '@portabletext/react'],
  },

  // Legacy asset path compatibility (keep old URLs working)
  async rewrites() {
    return [
      // Diagrams moved under /images/diagrams
      { source: '/diagrams/:path*', destination: '/images/diagrams/:path*' },
      // Stickers moved under /images/linestamp
      { source: '/LINEstamp/:path*', destination: '/images/linestamp/:path*' },
      // Sera assets moved under /images/sera
      { source: '/sera/:path*', destination: '/images/sera/:path*' },
      // Drawing assets moved under /images/drawing
      { source: '/drawing/:path*', destination: '/images/drawing/:path*' },
    ]
  },

  // Custom short URLs for X
  async redirects() {
    return [
      {
        source: '/x/:slug',
        destination: '/posts/:slug',
        permanent: true,
      },
    ]
  },

  // 外部画像ホストの許可（next/image のエラー対策）
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        port: '',
        pathname: '/images/**',
      },
    ],
    // Allowlisting CDN hostnames here makes intent explicit (Next.js will still use remotePatterns).
    domains: ['cdn.sanity.io'],
    // Recommended image optimization options to enable modern formats
    // and sensible default size sets so next/image can pick efficient sizes.
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [320, 420, 640, 768, 1024, 1280, 1600],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

module.exports = nextConfig;
