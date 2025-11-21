import { createClient } from 'next-sanity'
import Link from 'next/link'
import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import ArticleWithTOC from '@/components/ArticleWithTOC'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import RelatedPosts from '@/components/RelatedPosts'
import ViewCounter from '@/components/ViewCounter'
import { ArticleStructuredData, BreadcrumbStructuredData, OrganizationStructuredData } from '@/components/StructuredData'
import { formatPostDate, getRelatedPosts } from '@/lib/sanity'
import { SITE_URL } from '@/lib/constants'
import { CATEGORY_SUMMARY, getTagDefinition, type CategorySlug } from '@/data/tagCatalog'

const projectId = '72m8vhy2'
const dataset = 'production'
const apiVersion = '2024-01-01'
const token = process.env.SANITY_API_TOKEN

export const revalidate = 0

type RawCategory = string | { title?: string | null; slug?: string | null }

interface NormalizedCategory {
  title: string
  slug?: string
}

interface NormalizedTag {
  label: string
  slug?: string
}

const CATEGORY_TITLE_MAP: Record<string, CategorySlug> = Object.entries(CATEGORY_SUMMARY).reduce(
  (acc, [slug, meta]) => {
    acc[meta.title] = slug as CategorySlug
    return acc
  },
  {} as Record<string, CategorySlug>
)

function normalizeCategories(categories?: RawCategory[] | null): NormalizedCategory[] {
  if (!Array.isArray(categories)) return []

  const seen = new Set<string>()
  const normalized: NormalizedCategory[] = []

  for (const category of categories) {
    if (!category) continue

    let normalizedCategory: NormalizedCategory | null = null
    if (typeof category === 'string') {
      const title = category.trim()
      if (!title) continue
      const slug = CATEGORY_TITLE_MAP[title]
      normalizedCategory = { title, slug }
    } else {
      const title = category.title?.trim()
      if (!title) continue
      const slug = category.slug || CATEGORY_TITLE_MAP[title]
      normalizedCategory = { title, slug }
    }

    if (!normalizedCategory || seen.has(normalizedCategory.title)) {
      continue
    }

    seen.add(normalizedCategory.title)
    normalized.push(normalizedCategory)
  }

  return normalized
}

function normalizeTags(tags?: string[] | null): NormalizedTag[] {
  if (!Array.isArray(tags)) return []

  const seen = new Set<string>()
  const normalized: NormalizedTag[] = []

  for (const rawTag of tags) {
    const trimmed = typeof rawTag === 'string' ? rawTag.trim() : ''
    if (!trimmed) continue

    const definition = getTagDefinition(trimmed)
    const label = definition?.title || trimmed
    const slug = definition?.slug
    const uniqueKey = slug || label

    if (seen.has(uniqueKey)) {
      continue
    }

    seen.add(uniqueKey)
    normalized.push({ label, slug })
  }

  return normalized
}

function createSanityClient(isDraftMode = false) {
  return createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: !isDraftMode,
    token: isDraftMode ? token : undefined,
    perspective: isDraftMode ? 'previewDrafts' : 'published',
  })
}

export async function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const client = createSanityClient()
  const query = `*[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    excerpt,
    _createdAt,
    publishedAt,
    _updatedAt,
    slug,
    metaDescription,
    featured,
    readingTime,
    "categories": categories[]->{title,"slug":slug.current},
    "author": author->{name},
    "hasBody": defined(body[0]),
    internalOnly
  }`
  
  try {
    const post = await client.fetch(query, { slug: resolvedParams.slug })
    
    if (!post) {
      return {
        title: '記事が見つかりません | ProReNata',
        description: 'お探しの記事は存在しないか、削除された可能性があります。',
      }
    }

    const normalizedCategories = normalizeCategories(post.categories)
    const categoryTitles = normalizedCategories.map(category => category.title)

    const baseUrl = SITE_URL
    const canonicalUrl = `${baseUrl}/posts/${post.slug.current}`
    const publishedTime = post.publishedAt ?? post._createdAt
    const modifiedTime = post._updatedAt || post.publishedAt || post._createdAt
    
    const title = `${post.title} | ProReNata`
    const description = post.metaDescription ||
      post.excerpt ||
      `${post.title}について、看護助手として働く皆様のお役に立つ情報をお届けします。`

    const keywords = [
      ...categoryTitles,
      '看護助手',
      'ProReNata'
    ].filter(Boolean)

    const hasBodyContent = Boolean(post.hasBody)
    const noIndex = post.internalOnly === true || !hasBodyContent

    return {
      title,
      description,
      keywords: keywords.join(', '),
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: 'ProReNata',
        locale: 'ja_JP',
        type: 'article',
        publishedTime,
        modifiedTime,
        authors: post.author?.name ? [post.author.name] : ['ProReNata編集部'],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
      robots: noIndex
        ? {
            index: false,
            follow: false,
          }
        : undefined,
    }
  } catch (error) {
    console.error('メタデータ生成エラー:', error)
    return {
      title: 'エラー | ProReNata',
      description: '記事の読み込み中にエラーが発生しました。',
    }
  }
}

interface PostPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function PostDetailPage({ params }: PostPageProps) {
  const resolvedParams = await params
  const isDraftMode = (await draftMode()).isEnabled
  const client = createSanityClient(isDraftMode)
  
  const query = `*[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    _createdAt,
    publishedAt,
    _updatedAt,
    excerpt,
    body,
    focusKeyword,
    relatedKeywords,
    readingTime,
    contentType,
    tags,
    "categories": categories[]->{title,"slug":slug.current},
    "author": author->{name, slug},
    internalOnly
  }`
  const post = await client.fetch(query, { slug: resolvedParams.slug })

  const normalizedCategories = normalizeCategories(post?.categories)
  const categoryTitles = normalizedCategories.map(category => category.title)
  const categorySlugs = normalizedCategories
    .map(category => category.slug)
    .filter((slug): slug is string => Boolean(slug))
  const normalizedTags = normalizeTags(post?.tags)

  const hasTopicMeta = normalizedCategories.length > 0 || normalizedTags.length > 0

  // 関連記事の取得（lib/sanity.tsの共通関数を使用）
  const relatedPosts = post
    ? await getRelatedPosts(post._id, categorySlugs, 2)
    : []

  const hasBody = post && Array.isArray(post.body) && post.body.length > 0

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 xl:max-w-5xl xl:px-0">
        <div className="flex h-screen flex-col justify-center">
          <div className="text-center">
            <h1 className="text-6xl font-bold leading-9 tracking-tight text-gray-900 md:text-8xl md:leading-14">
              404
            </h1>
            <p className="text-xl leading-normal text-gray-600 md:text-2xl">
              記事が見つかりません
            </p>
            <p className="mb-4 text-xl leading-normal text-gray-600 md:text-2xl">
              お探しの記事は存在しないか、削除された可能性があります。
            </p>
            <Link
              href="/"
              className="inline rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium leading-5 text-white shadow transition-colors duration-150 hover:bg-blue-700 focus:outline-none focus:shadow-outline-blue"
            >
              ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const structuredPost = { ...post, categories: categoryTitles }
  const categoryChipClass =
    "inline-flex items-center rounded-full border border-cyan-200 px-3 py-1 text-sm font-medium text-cyan-700 hover:border-cyan-300 hover:bg-cyan-50 transition-colors duration-200"
  const tagChipClass =
    "inline-flex items-center rounded-full border border-rose-200 px-3 py-1 text-sm font-medium text-rose-700 hover:border-rose-300 hover:bg-rose-50 transition-colors duration-200"

  return (
    <>
      {/* 構造化データ（JSON-LD） */}
      <ArticleStructuredData post={structuredPost} />
      <BreadcrumbStructuredData title={post.title} slug={post.slug.current} />
      <OrganizationStructuredData />

      {/* Preview Mode Banner */}
      {isDraftMode && (
        <div className="fixed top-0 left-0 z-50 w-full bg-yellow-50 px-6 py-2 text-center text-sm font-medium text-yellow-800 border-b border-yellow-200">
          🔍 プレビューモード中 -
          <Link href="/api/preview?disable=true" className="underline ml-2 hover:text-yellow-600">
            プレビューを終了
          </Link>
        </div>
      )}

      <div className={isDraftMode ? "pt-12" : ""}>
        <Header />
      </div>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 xl:max-w-5xl xl:px-0">
        <main>
            <div className="xl:divide-y xl:divide-gray-200">
              {/* パンくずナビゲーション */}
              <nav className="flex items-center space-x-2 text-sm text-gray-500 pt-6 pb-4">
                <Link href="/" className="hover:text-cyan-600 transition-colors duration-200">
                  ホーム
                </Link>
                <span className="text-gray-300">/</span>
                <Link href="/blog" className="hover:text-cyan-600 transition-colors duration-200">
                  記事一覧
                </Link>
                <span className="text-gray-300">/</span>
                <span className="text-gray-900 font-medium truncate">{post.title}</span>
              </nav>

              <header className="pt-6 xl:pb-6">
                <div className="space-y-1 text-center">
                  <dl className="space-y-10">
                    <div>
                      <dt className="sr-only">Published on</dt>
                      <dd className="text-base font-medium leading-6 text-gray-500">
                        {(() => {
                          const { dateTime, label } = formatPostDate(post, {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                          return dateTime ? (
                            <time dateTime={dateTime}>
                              {label}
                            </time>
                          ) : (
                            <span>{label}</span>
                          )
                        })()}
                      </dd>
                    </div>
                  </dl>
                  <div>
                    <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-5xl md:leading-14">
                      {post.title}
                    </h1>
                  </div>
                  {/* 閲覧数カウンター */}
                  <div className="flex justify-center pt-2">
                    <ViewCounter slug={post.slug.current} />
                  </div>
                </div>
              </header>
              <div className="pb-8 space-y-12">
                {/* 記事コンテンツ */}
                <div className="max-w-none pb-8 pt-10 text-gray-900 [&]:!text-gray-900 [&>*]:!text-gray-900" style={{ color: '#111827 !important' }}>
                  {hasBody ? (
                    <ArticleWithTOC content={post.body} />
                  ) : (
                    <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-600 bg-gray-50">
                      <p className="text-lg font-semibold mb-2">この記事は現在準備中です。</p>
                      <p className="text-sm">公開まで今しばらくお待ちください。</p>
                    </div>
                  )}
                </div>

                {/* 関連記事セクション */}
                {relatedPosts.length > 0 && <RelatedPosts posts={relatedPosts} />}

                {hasTopicMeta && (
                  <div className="my-10 py-8">
                    <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
                      {normalizedCategories.length > 0 && (
                        <div className="flex-1 text-center sm:text-left">
                          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-500">
                            カテゴリ
                          </p>
                          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                            {normalizedCategories.map(category => {
                              const key = category.slug || category.title
                              if (category.slug) {
                                return (
                                  <Link
                                    key={key}
                                    href={`/categories/${category.slug}`}
                                    className={categoryChipClass}
                                  >
                                    {category.title}
                                  </Link>
                                )
                              }
                              return (
                                <span key={key} className={categoryChipClass}>
                                  {category.title}
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      {normalizedTags.length > 0 && (
                        <div className="flex-1 text-center sm:text-left">
                          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-500">
                            タグ
                          </p>
                          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                            {normalizedTags.map(tag => {
                              const key = tag.slug || tag.label
                              if (tag.slug) {
                                return (
                                  <Link
                                    key={key}
                                    href={`/tags/${tag.slug}`}
                                    className={tagChipClass}
                                  >
                                    #{tag.label}
                                  </Link>
                                )
                              }
                              return (
                                <span key={key} className={tagChipClass}>
                                  #{tag.label}
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 記事下部のナビゲーション */}
                <footer className="pt-8">
                  <div className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                      <Link
                        href="/blog"
                        className="text-cyan-600 hover:text-cyan-700 font-medium px-4 py-2 rounded-md border border-cyan-200 hover:border-cyan-300 transition-colors duration-200"
                        aria-label="記事一覧に戻る"
                      >
                        記事一覧に戻る
                      </Link>
                      <Link
                        href="/"
                        className="text-cyan-600 hover:text-cyan-700 font-medium px-4 py-2 rounded-md border border-cyan-200 hover:border-cyan-300 transition-colors duration-200"
                        aria-label="ホームに戻る"
                      >
                        ホームに戻る
                      </Link>
                    </div>
                  </div>
                </footer>
              </div>
            </div>
        </main>
      </div>
      <Footer />
    </>
  )
}
