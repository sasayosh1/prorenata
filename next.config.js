/** @type {import('next').NextConfig} */
const nextConfig = {
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
  },
  // プリロードを無効化
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig