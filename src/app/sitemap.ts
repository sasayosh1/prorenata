import { getAllPosts, formatPostDate } from '@/lib/sanity'
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://prorenata.jp'
  
  try {
    const posts = await getAllPosts()
    
    const postUrls = posts.map((post) => {
      const { dateTime } = formatPostDate(post)
      const lastModifiedSource = post._updatedAt || dateTime
      const lastModified = lastModifiedSource ? new Date(lastModifiedSource) : new Date()

      return {
        url: `${baseUrl}/posts/${post.slug.current}`,
        lastModified,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }
    })

    const staticPages = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
      },
      {
        url: `${baseUrl}/articles`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
      },
      {
        url: `${baseUrl}/categories`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/about`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      },
      {
        url: `${baseUrl}/search`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      },
    ]

    return [...staticPages, ...postUrls]
  } catch (error) {
    console.error('Sitemap生成エラー:', error)
    
    // エラーが発生した場合は最低限のサイトマップを返す
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
      },
    ]
  }
}
