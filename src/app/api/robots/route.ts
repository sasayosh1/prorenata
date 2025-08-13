// robots.txt API route

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://prorenata.vercel.app'
  
  const robotsTxt = `# ProReNata - 看護助手向け情報サイト
# robots.txt

User-agent: *
Allow: /

# 重要なページを優先
Allow: /nursing-assistant
Allow: /posts/
Allow: /categories/
Allow: /articles

# 管理・開発用ページの除外
Disallow: /api/
Disallow: /admin/
Disallow: /_next/
Disallow: /studio/

# 重複コンテンツの除外
Disallow: /*?*
Disallow: /*#*

# サイトマップの場所
Sitemap: ${baseUrl}/sitemap.xml

# 主要検索エンジンのクロール頻度
Crawl-delay: 1

# Google
User-agent: Googlebot
Allow: /
Crawl-delay: 1

# Bing
User-agent: Bingbot
Allow: /
Crawl-delay: 1

# Yahoo
User-agent: Slurp
Allow: /
Crawl-delay: 1

# 悪意のあるボットの制限
User-agent: AhrefsBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: DotBot
Disallow: /
`

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200'
    }
  })
}