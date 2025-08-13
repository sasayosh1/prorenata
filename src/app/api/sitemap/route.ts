import { getAllPosts, getAllCategories } from '@/lib/sanity'

export async function GET() {
  try {
    // 基本URL（本番環境では実際のドメインを使用）
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://prorenata.vercel.app'
    
    // 現在の日時
    const currentDate = new Date().toISOString()
    
    // 静的ページ
    const staticPages = [
      {
        url: `${baseUrl}`,
        lastmod: currentDate,
        changefreq: 'daily',
        priority: 1.0
      },
      {
        url: `${baseUrl}/nursing-assistant`,
        lastmod: currentDate,
        changefreq: 'weekly',
        priority: 0.9
      },
      {
        url: `${baseUrl}/articles`,
        lastmod: currentDate,
        changefreq: 'daily',
        priority: 0.8
      },
      {
        url: `${baseUrl}/categories`,
        lastmod: currentDate,
        changefreq: 'weekly',
        priority: 0.7
      },
      {
        url: `${baseUrl}/about`,
        lastmod: currentDate,
        changefreq: 'monthly',
        priority: 0.6
      }
    ]

    // 記事ページ
    let articlePages: Array<{url: string, lastmod: string, changefreq: string, priority: number}> = []
    try {
      const posts = await getAllPosts()
      articlePages = posts.map(post => ({
        url: `${baseUrl}/posts/${post.slug.current}`,
        lastmod: new Date(post._updatedAt || post.publishedAt).toISOString(),
        changefreq: 'weekly',
        priority: post.featured ? 0.8 : 0.6
      }))
    } catch (error) {
      console.warn('記事の取得に失敗しました:', error)
    }

    // カテゴリページ
    let categoryPages: Array<{url: string, lastmod: string, changefreq: string, priority: number}> = []
    try {
      const categories = await getAllCategories()
      categoryPages = categories.map(category => ({
        url: `${baseUrl}/categories/${category.slug.current}`,
        lastmod: currentDate,
        changefreq: 'weekly',
        priority: 0.7
      }))
    } catch (error) {
      console.warn('カテゴリの取得に失敗しました:', error)
    }

    // 全ページを統合
    const allPages = [...staticPages, ...articlePages, ...categoryPages]

    // XMLサイトマップ生成
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${allPages.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200'
      }
    })

  } catch (error) {
    console.error('サイトマップ生成エラー:', error)
    
    // エラー時のフォールバック
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${process.env.NEXT_PUBLIC_SITE_URL || 'https://prorenata.vercel.app'}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`

    return new Response(fallbackSitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800'
      }
    })
  }
}