import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
})

const builder = imageUrlBuilder(client)

export const urlFor = (source: SanityImageSource) => builder.image(source)

// 型定義
export interface SanityImage {
  _type: 'image'
  asset: {
    _ref: string
    _type: 'reference'
  }
}

export interface Post {
  _id: string
  title: string
  slug: {
    current: string
  }
  _createdAt?: string
  publishedAt?: string
  _updatedAt?: string
  excerpt?: string
  mainImage?: SanityImage
  categories?: Category[]
  author?: Author
  body?: Array<Record<string, unknown>>
  // SEO関連フィールド
  metaTitle?: string
  metaDescription?: string
  focusKeyword?: string
  relatedKeywords?: string[]
  // コンテンツ分類
  contentType?: string
  targetAudience?: string
  difficulty?: string
  readingTime?: number
  featured?: boolean
  tags?: string[]
}

export interface Author {
  _id: string
  name: string
  slug: {
    current: string
  }
  image?: SanityImage
  bio?: Array<Record<string, unknown>>
}

export interface Category {
  _id: string
  title: string
  slug: {
    current: string
  }
  description?: string
  color?: string
  icon?: string
  featured?: boolean
  level?: 'main' | 'sub'
  sortOrder?: number
  active?: boolean
}



// データ取得関数
export async function getAllPosts(): Promise<Post[]> {
  try {
    const query = `*[_type == "post"] | order(coalesce(publishedAt, _createdAt) desc) {
      _id,
      title,
      slug,
      _createdAt,
      publishedAt,
      _updatedAt,
      excerpt,
      mainImage,
      "categories": categories[]->title,
      "author": author->{name, slug},
      body,
      metaTitle,
      metaDescription,
      focusKeyword,
      relatedKeywords,
      contentType,
      targetAudience,
      difficulty,
      readingTime,
      featured,
      tags
    }`

    const result = await client.fetch(query)
    return result
  } catch (error) {
    console.error('Sanity fetch error:', error)
    throw error
  }
}

// ページネーション付き記事取得
export async function getPostsPaginated(page: number = 1, pageSize: number = 15): Promise<{
  posts: Post[]
  totalCount: number
  hasNextPage: boolean
  hasPrevPage: boolean
  totalPages: number
}> {
  try {
    const start = (page - 1) * pageSize
    const end = start + pageSize

    // 総記事数を取得
    const totalCountQuery = `count(*[_type == "post"])`
    const totalCount = await client.fetch(totalCountQuery)

    // ページネーション付きで記事を取得
    const postsQuery = `*[_type == "post"] | order(coalesce(publishedAt, _createdAt) desc) [$start...$end] {
      _id,
      title,
      slug,
      _createdAt,
      publishedAt,
      excerpt,
      mainImage,
      "categories": categories[]->title,
      "author": author->{name, slug}
    }`

    const posts = await client.fetch(postsQuery, { start, end })

    const totalPages = Math.ceil(totalCount / pageSize)

    return {
      posts,
      totalCount,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      totalPages
    }
  } catch (error) {
    console.error('Paginated posts fetch error:', error)
    throw error
  }
}

// 検索機能（全記事対象）
export async function searchPosts(searchTerm: string): Promise<Post[]> {
  try {
    const query = `*[_type == "post" && (
      title match "*${searchTerm}*" ||
      excerpt match "*${searchTerm}*" ||
      categories[]->title match "*${searchTerm}*"
    )] | order(coalesce(publishedAt, _createdAt) desc) {
      _id,
      title,
      slug,
      _createdAt,
      publishedAt,
      excerpt,
      mainImage,
      "categories": categories[]->title,
      "author": author->{name, slug}
    }`

    const result = await client.fetch(query)
    return result
  } catch (error) {
    console.error('Search posts fetch error:', error)
    throw error
  }
}

export async function getAllCategories(): Promise<Category[]> {
  try {
    const query = `*[_type == "category"] | order(sortOrder asc) {
      _id,
      title,
      slug,
      description,
      color,
      icon,
      featured,
      level,
      sortOrder,
      active
    }`
    
    const result = await client.fetch(query)
    return result
  } catch (error) {
    console.error('Categories fetch error:', error)
    return []
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const query = `*[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    _createdAt,
    publishedAt,
    excerpt,
    mainImage,
    "categories": categories[]->title,
    "author": author->{name, slug, image, bio},
    body
  }`
  
  return client.fetch(query, { slug })
}

export function formatPostDate(
  post: Pick<Post, '_createdAt' | 'publishedAt'>,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  },
  locale: string = 'ja-JP'
): { dateTime?: string; label: string } {
  const dateValue = post.publishedAt ?? post._createdAt
  if (!dateValue) {
    return { dateTime: undefined, label: '公開日未設定' }
  }

  const dateObject = new Date(dateValue)
  if (Number.isNaN(dateObject.getTime())) {
    return { dateTime: undefined, label: '公開日未設定' }
  }

  return {
    dateTime: dateValue,
    label: dateObject.toLocaleDateString(locale, options)
  }
}
