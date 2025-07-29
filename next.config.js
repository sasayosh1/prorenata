/** @type {import('next').NextConfig} */
const nextConfig = {
  // キャッシュを無効化してVercelで即座に反映
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
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