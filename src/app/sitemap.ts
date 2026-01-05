import { MetadataRoute } from 'next'
import { client } from '@/lib/sanity'
import { SITE_URL } from '@/lib/constants'

type PostSitemapRow = {
  slug?: string
  _updatedAt?: string
  publishedAt?: string
}

type CategorySitemapRow = {
  slug?: string
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL

  // 1. 記事データを取得
  const postsQuery = `*[_type == "post" && defined(slug.current) && (!defined(internalOnly) || internalOnly == false)] {
    "slug": slug.current,
    _updatedAt,
    publishedAt
  }`
  const posts = (await client.fetch(postsQuery)) as PostSitemapRow[]

  const postEntries = posts
    .filter((post) => Boolean(post.slug))
    .map((post) => ({
      url: `${baseUrl}/posts/${post.slug}`,
      lastModified: post._updatedAt ?? post.publishedAt ?? new Date().toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

  // 2. カテゴリデータを取得
  const categoriesQuery = `*[_type == "category" && defined(slug.current)] {
    "slug": slug.current
  }`
  const categories = (await client.fetch(categoriesQuery)) as CategorySitemapRow[]

  const categoryEntries = categories
    .filter((cat) => Boolean(cat.slug))
    .map((cat) => ({
      url: `${baseUrl}/categories/${cat.slug}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }))

  // 3. 静的ページ
  const staticPages = ['', '/about', '/posts', '/privacy'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }))

  return [...staticPages, ...categoryEntries, ...postEntries]
}
