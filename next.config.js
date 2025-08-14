const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // SEO最適化: Trailing Slashを無効化
  trailingSlash: false,
  
  // パフォーマンス最適化
  experimental: {
    staleTimes: {
      dynamic: 30, // 30秒
      static: 180, // 3分
    },
    optimizePackageImports: [
      '@portabletext/react', 
      'next-sanity', 
      'lucide-react',
      '@radix-ui/react-slot',
      '@radix-ui/react-toast',
      'framer-motion'
    ],
    // Webpack最適化
    webpackBuildWorker: true,
  },

  // Webpack設定の最適化
  webpack: (config, { isServer }) => {
    // クライアントサイドでのバンドルサイズ最適化
    if (!isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          chunks: 'all',
          maxSize: 244000,
        },
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
          chunks: 'all',
          maxSize: 244000,
        },
      }
    }
    
    return config
  },
  
  // 外部画像ホストの許可
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        port: '',
        pathname: '/images/**',
      },
    ],
    // 画像最適化の設定
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // SEO最適化: メタデータとセキュリティヘッダー
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
          // セキュリティヘッダー
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          // SEO: robots.txtの代替
          {
            key: 'X-Robots-Tag',
            value: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate'
          }
        ]
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  },
  
  // SEO最適化: リダイレクト設定
  async redirects() {
    return [
      // 古いURLパターンのリダイレクト
      {
        source: '/article/:slug*',
        destination: '/posts/:slug*',
        permanent: true,
      },
      {
        source: '/blog/:slug*',
        destination: '/posts/:slug*',
        permanent: true,
      },
    ]
  },
  
  // SEO最適化: 書き換え設定
  async rewrites() {
    return [
      // サイトマップ
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap',
      },
      // robots.txt
      {
        source: '/robots.txt',
        destination: '/api/robots',
      },
    ]
  },
}

module.exports = withBundleAnalyzer(nextConfig)