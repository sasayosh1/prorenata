import { client } from '@/lib/sanity'
import { SITE_URL } from '@/lib/constants'

const PUBLIC_POST_FILTER = '!defined(internalOnly) || internalOnly == false'

type UrlEntry = {
  url: string
  lastmod: string
  changefreq: 'daily' | 'weekly' | 'monthly'
  priority: number
}

export async function GET() {
  const baseUrl = SITE_URL
  try {
    const now = new Date().toISOString()

    const staticPages: UrlEntry[] = [
      {
        url: baseUrl,
        lastmod: now,
        changefreq: 'daily',
        priority: 1.0,
      },
      {
        url: `${baseUrl}/posts`,
        lastmod: now,
        changefreq: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/nursing-assistant`,
        lastmod: now,
        changefreq: 'weekly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/community`,
        lastmod: now,
        changefreq: 'weekly',
        priority: 0.7,
      },
      {
        url: `${baseUrl}/tags`,
        lastmod: now,
        changefreq: 'weekly',
        priority: 0.6,
      },
      {
        url: `${baseUrl}/about`,
        lastmod: now,
        changefreq: 'monthly',
        priority: 0.5,
      },
      {
        url: `${baseUrl}/contact`,
        lastmod: now,
        changefreq: 'monthly',
        priority: 0.4,
      },
      {
        url: `${baseUrl}/privacy`,
        lastmod: now,
        changefreq: 'monthly',
        priority: 0.3,
      },
      {
        url: `${baseUrl}/terms`,
        lastmod: now,
        changefreq: 'monthly',
        priority: 0.3,
      },
      {
        url: `${baseUrl}/categories`,
        lastmod: now,
        changefreq: 'weekly',
        priority: 0.6,
      },
      {
        url: `${baseUrl}/sitemap`,
        lastmod: now,
        changefreq: 'weekly',
        priority: 0.4,
      },
    ]

    const postQuery = `*[_type == "post" && !(_id in path("drafts.**")) && (${PUBLIC_POST_FILTER}) && defined(slug.current) && defined(body[0])]{
      "slug": slug.current,
      "lastmod": coalesce(_updatedAt, publishedAt, _createdAt)
    }`
    const posts: { slug: string; lastmod?: string }[] = await client.fetch(postQuery)

    const postEntries: UrlEntry[] = posts.map((post) => ({
      url: `${baseUrl}/posts/${post.slug}`,
      lastmod: post.lastmod ? new Date(post.lastmod).toISOString() : now,
      changefreq: 'weekly',
      priority: 0.7,
    }))

    const categoryQuery = `*[_type == "category" && defined(slug.current)]{
      "slug": slug.current,
      "lastmod": coalesce(_updatedAt, _createdAt),
      "postCount": count(*[_type == "post" && !(_id in path("drafts.**")) && (${PUBLIC_POST_FILTER}) && references(^._id) && defined(slug.current) && defined(body[0])])
    }`

    const categories: { slug?: string; lastmod?: string; postCount: number }[] = await client.fetch(categoryQuery)

    const categoryMap = new Map<string, UrlEntry>()
    categories.forEach((category) => {
      if (!category.slug || category.postCount <= 0) return
      const slug = category.slug
      const lastmod = category.lastmod ? new Date(category.lastmod).toISOString() : now
      const entry: UrlEntry = {
        url: `${baseUrl}/categories/${encodeURIComponent(slug)}`,
        lastmod,
        changefreq: 'weekly',
        priority: 0.6,
      }

      const existing = categoryMap.get(slug)
      if (!existing || new Date(lastmod) > new Date(existing.lastmod)) {
        categoryMap.set(slug, entry)
      }
    })

    const categoryEntries = Array.from(categoryMap.values())

    const allEntries = [...staticPages, ...postEntries, ...categoryEntries]

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allEntries
  .map(
    (entry) => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
      },
    })
  } catch (error) {
    console.error('サイトマップ生成エラー:', error)
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`

    return new Response(fallback, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
      },
    })
  }
}
