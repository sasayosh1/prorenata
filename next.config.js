/** @type {import('next').NextConfig} */
const nextConfig = {
  // SEO最適化: Trailing Slashを無効化
  trailingSlash: false,
  
  // キャッシュを無効化してVercelで即座に反映
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
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
            value: 'no-cache, no-store, must-revalidate, max-age=0',
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

module.exports = nextConfig