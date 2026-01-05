import { createClient } from 'next-sanity'
import Link from 'next/link'
import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import ArticleWithTOC from '@/components/ArticleWithTOC'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ViewCounter from '@/components/ViewCounter'
import { ArticleStructuredData, BreadcrumbStructuredData, OrganizationStructuredData, FAQStructuredData } from '@/components/StructuredData'
import { formatPostDate, getRelatedPosts, urlFor } from '@/lib/sanity'
import { SITE_URL } from '@/lib/constants'
import { CATEGORY_SUMMARY, resolveTagDefinition, type CategorySlug } from '@/data/tagCatalog'
import Image from 'next/image'
import { sanitizeTitle, sanitizePersonaText } from '@/lib/title'
import PRDisclosure from '@/components/Article/PRDisclosure'
import StandardDisclaimer from '@/components/Article/StandardDisclaimer'

const projectId = '72m8vhy2'
const dataset = 'production'
const apiVersion = '2024-01-01'
const token = process.env.SANITY_API_TOKEN

export const revalidate = 3600

type RawCategory = string | { title?: string | null; slug?: string | null }
type PortableTextSpan = { _type?: string; text?: string }
type PortableTextBlock = { _type?: string; style?: string; children?: PortableTextSpan[]; _key?: string }

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

    const definition = resolveTagDefinition(trimmed)
    const label = definition?.title || trimmed
    const slug = definition?.slug || trimmed
    const uniqueKey = slug || label

    if (seen.has(uniqueKey)) {
      continue
    }

    seen.add(uniqueKey)
    normalized.push({ label, slug })
  }

  return normalized
}

function getPortableTextBlockText(block: PortableTextBlock): string {
  const children = Array.isArray(block.children) ? block.children : []
  return children
    .map((child) => (typeof child?.text === 'string' ? child.text : ''))
    .join('')
    .trim()
}

function isSummaryHeading(block: PortableTextBlock): boolean {
  if (block?._type !== 'block' || block.style !== 'h2') return false
  const text = getPortableTextBlockText(block)
  return text === 'まとめ' || text.startsWith('まとめ') || text.includes('まとめ')
}

function extractTitleKeywords(rawTitle: string): string[] {
  const t = String(rawTitle || '')
    .replace(/^【[^】]+】\s*/u, '')
    .replace(/\s+/g, ' ')
    .trim()

  const stop = new Set([
    '看護助手',
    '看護補助者',
    'ProReNata',
    '徹底解説',
    '解説',
    'まとめ',
    '完全',
    '完全版',
    '基本',
    '方法',
    'コツ',
    'ポイント',
    '心構え',
    'よくある',
    '質問',
    '回答',
    '対策',
    '準備',
    '徹底',
    '採用',
  ])

  const tokens: string[] = []
  const re = /[A-Za-z0-9][A-Za-z0-9_-]{1,30}|[一-龠々〆ヵヶぁ-んァ-ヶー]{2,20}/g
  for (const match of t.matchAll(re)) {
    const token = String(match[0] || '').trim()
    if (!token) continue
    if (stop.has(token)) continue
    tokens.push(token)
  }

  const intentPriority = [
    '面接',
    '志望動機',
    '自己PR',
    '自己ＰＲ',
    '逆質問',
    '履歴書',
    '職務経歴書',
    '転職',
    '退職',
    '夜勤',
    '給料',
    '人間関係',
    'メンタル',
  ]
  const unique: string[] = []
  const seen = new Set<string>()

  for (const p of intentPriority) {
    if (t.includes(p) && !seen.has(p)) {
      unique.push(p)
      seen.add(p)
    }
  }
  for (const token of tokens) {
    if (seen.has(token)) continue
    seen.add(token)
    unique.push(token)
    if (unique.length >= 6) break
  }

  return unique
}

function isSupportiveClosing(text: string): boolean {
  return /(応援|大丈夫|無理しない|焦らない|一歩ずつ|今日から|少しずつ|できます|してみて|試して)/.test(text)
}

function pruneOffTopicSummary(body: unknown, title: string) {
  if (!Array.isArray(body) || body.length === 0) return body
  const blocks = body as PortableTextBlock[]
  const keywords = extractTitleKeywords(title)
  if (!keywords || keywords.length === 0) return body

  const summaryIndex = blocks.findIndex(isSummaryHeading)
  if (summaryIndex < 0) return body

  let endIndex = blocks.length
  for (let i = summaryIndex + 1; i < blocks.length; i += 1) {
    const block = blocks[i]
    if (block?._type === 'block' && block.style === 'h2') {
      endIndex = i
      break
    }
  }

  const before = blocks.slice(0, summaryIndex + 1)
  const summaryBlocks = blocks.slice(summaryIndex + 1, endIndex)
  const after = blocks.slice(endIndex)

  const kept: PortableTextBlock[] = []
  for (const block of summaryBlocks) {
    if (!block || block._type !== 'block') {
      kept.push(block)
      continue
    }
    if (block.style === 'h3') continue

    const text = getPortableTextBlockText(block)
    if (!text) {
      kept.push(block)
      continue
    }

    if (text.length <= 40 && isSupportiveClosing(text)) {
      kept.push(block)
      continue
    }

    const matches = keywords.some((k) => text.includes(k))
    if (matches) {
      kept.push(block)
      continue
    }

    if (text.length >= 30) continue
    kept.push(block)
  }

  return [...before, ...(kept.length > 0 ? kept : summaryBlocks), ...after]
}

function isDisclaimerParagraph(block: PortableTextBlock): boolean {
  if (block?._type !== 'block' || block.style) return false
  const text = getPortableTextBlockText(block)
  return text.startsWith('免責事項')
}

function isAffiliateEmbedBlock(block: PortableTextBlock): boolean {
  return block?._type === 'affiliateEmbed'
}

function isManualRelatedHeading(block: PortableTextBlock): boolean {
  if (block?._type !== 'block') return false
  if (block.style !== 'h2' && block.style !== 'h3') return false
  const text = getPortableTextBlockText(block)
  return /あわせて読/.test(text) || text.includes('関連記事')
}

function stripManualRelatedSection(body: unknown) {
  if (!Array.isArray(body) || body.length === 0) return body
  const blocks = body as PortableTextBlock[]

  const stripped: PortableTextBlock[] = []
  let skippingRelated = false

  for (const block of blocks) {
    if (skippingRelated) {
      const stop =
        (block?._type === 'block' && block.style === 'h2') ||
        isDisclaimerParagraph(block) ||
        isAffiliateEmbedBlock(block) ||
        block?._type === 'relatedPosts'
      if (!stop) continue
      skippingRelated = false
    }

    if (isManualRelatedHeading(block)) {
      skippingRelated = true
      continue
    }

    stripped.push(block)
  }

  return stripped
}

function reorderBlocksForABTesting(body: unknown, postId: string) {
  if (!Array.isArray(body) || body.length < 10) return body
  const blocks = body as PortableTextBlock[]

  // 簡易ABテストロジック: IDの末尾文字で判定 (A: 偶数/0-7, B: 奇数/8-f)
  // ここでは A: オリジナル配置, B: 終盤へ移動
  const charCode = postId.charCodeAt(postId.length - 1)
  const isVariantB = charCode % 2 !== 0

  if (!isVariantB) return body

  const recIndex = blocks.findIndex(b => b._type === 'seraRecommendation')
  if (recIndex < 0) return body

  // すでに後半(後ろから1/3)にある場合は動かさない
  if (recIndex > blocks.length * 0.7) return body

  const summaryIndex = blocks.findIndex(isSummaryHeading)
  const insertAt = summaryIndex >= 0 ? summaryIndex : blocks.length

  const [recBlock] = blocks.splice(recIndex, 1)
  blocks.splice(insertAt - 1, 0, recBlock) // まとめ見出しの直前に挿入

  return blocks
}

function injectRelatedPostsBeforeDisclaimer(
  body: unknown,
  posts: Array<{ title: string; slug: string; categories?: Array<{ title: string; slug?: string | null }> | null }>
) {
  const cleanedBody = stripManualRelatedSection(body)
  if (!Array.isArray(cleanedBody) || cleanedBody.length === 0) return cleanedBody
  if (!Array.isArray(posts) || posts.length === 0) return cleanedBody

  const blocks = cleanedBody as PortableTextBlock[]
  const alreadyInserted = blocks.some((block) => block?._type === 'relatedPosts')
  if (alreadyInserted) return cleanedBody

  const summaryIndex = blocks.findIndex(isSummaryHeading)
  const disclaimerIndex = blocks.findIndex(isDisclaimerParagraph)

  const insertAt =
    disclaimerIndex >= 0 && (summaryIndex < 0 || disclaimerIndex > summaryIndex)
      ? disclaimerIndex
      : blocks.length

  const relatedBlock = {
    _type: 'relatedPosts',
    _key: `related-posts-${posts[0]?.slug || 'auto'}`,
    posts,
  }

  return [...blocks.slice(0, insertAt), relatedBlock, ...blocks.slice(insertAt)]
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
	    mainImage,
	    metaDescription,
	    featured,
	    readingTime,
	    "categories": categories[]->{title,"slug":slug.current},
	    "author": author->{name},
	    "hasBody": defined(body[0]),
	    "firstBodyImage": body[_type == "image"][0],
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

    const displayTitle = sanitizeTitle(post.title)
    const title = `${displayTitle} | ProReNata`
    const rawDescription = post.metaDescription ||
      post.excerpt ||
      `${displayTitle}について、看護助手として働く皆様のお役に立つ情報をお届けします。`
    const description = sanitizePersonaText(rawDescription)

    const keywords = [
      ...categoryTitles,
      '看護助手',
      'ProReNata'
    ].filter(Boolean)

    const hasBodyContent = Boolean(post.hasBody)
    const noIndex = post.internalOnly === true || !hasBodyContent

    const ogImageSource = post.mainImage?.asset ? post.mainImage : post.firstBodyImage
    const ogImageUrl = ogImageSource?.asset
      ? urlFor(ogImageSource).width(1200).height(630).fit('crop').url()
      : `${baseUrl}/og-image.png`

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
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: displayTitle,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImageUrl],
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
    mainImage,
    body,
    focusKeyword,
    relatedKeywords,
    readingTime,
    contentType,
    tags,
    "categories": categories[]->{title,"slug":slug.current},
    "author": author->{name, slug},
    faq,
    stickyCTA,
    isSeraPick,
    internalOnly
  }`
  const post = await client.fetch(query, { slug: resolvedParams.slug })

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

  const normalizedCategories = normalizeCategories(post.categories)
  const categoryTitles = normalizedCategories.map(category => category.title)
  const categorySlugs = normalizedCategories
    .map(category => category.slug)
    .filter((slug): slug is string => Boolean(slug))
  const normalizedTags = normalizeTags(post.tags)

  const hasTopicMeta = normalizedCategories.length > 0 || normalizedTags.length > 0

  let primaryRelatedPosts: Array<{ title: string; slug: string; categories?: Array<{ title: string; slug?: string | null }> | null }> = []
  try {
    primaryRelatedPosts = await getRelatedPosts(post._id, categorySlugs, 6)
  } catch (error) {
    console.error('Failed to load related posts:', error)
    primaryRelatedPosts = []
  }

  let relatedPosts = primaryRelatedPosts
  if (relatedPosts.length < 4) {
    const fallbackQuery = `*[_type == "post" && defined(slug.current) && _id != $id && !internalOnly] | order(coalesce(publishedAt, _createdAt) desc)[0...8]{
      title,
      "slug": slug.current,
      "categories": categories[]->{title,"slug":slug.current}
    }`
    const fallback = await client.fetch(fallbackQuery, { id: post._id })

    const seen = new Set<string>(relatedPosts.map((p) => p.slug))
    const merged = [...relatedPosts]
    for (const item of Array.isArray(fallback) ? fallback : []) {
      const slug = typeof item?.slug === 'string' ? item.slug : ''
      if (!slug || seen.has(slug)) continue
      seen.add(slug)
      merged.push({
        title: item.title,
        slug,
        categories: item.categories || [],
      })
      if (merged.length >= 6) break
    }
    relatedPosts = merged
  }

  const hasBody = post && Array.isArray(post.body) && post.body.length > 0
  const cleanedBody = hasBody ? pruneOffTopicSummary(post.body, post.title) : post.body
  const abTestedBody = hasBody ? reorderBlocksForABTesting(cleanedBody, post._id) : cleanedBody
  const bodyWithRelated = hasBody ? injectRelatedPostsBeforeDisclaimer(abTestedBody, relatedPosts) : abTestedBody

  const displayTitle = sanitizeTitle(post.title)
  const sanitizedExcerpt = post?.excerpt ? sanitizePersonaText(post.excerpt) : undefined
  const structuredPost = { ...post, title: displayTitle, categories: categoryTitles, excerpt: sanitizedExcerpt }
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
      <FAQStructuredData faqItems={post.faq} />

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
              <span className="text-gray-900 font-medium truncate">{displayTitle}</span>
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
                    {displayTitle}
                  </h1>
                </div>
                {/* 閲覧数カウンター */}
                <div className="flex justify-center pt-2">
                  <ViewCounter slug={post.slug.current} />
                </div>
              </div>
            </header>

            {/* アイキャッチ画像 */}
            {post.mainImage?.asset && (
              <div className="relative w-full aspect-video mb-8 rounded-xl overflow-hidden shadow-lg">
                <Image
                  src={urlFor(post.mainImage).url()}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 1024px, 1024px"
                />
              </div>
            )}

            <div className="pb-8 space-y-12">
              {/* 記事コンテンツ */}
              <div className="max-w-none pb-8 pt-10 text-gray-900 [&]:!text-gray-900 [&>*]:!text-gray-900" style={{ color: '#111827 !important' }}>
                {hasBody ? (
                  <>
                    <PRDisclosure />
                    <ArticleWithTOC content={bodyWithRelated} />
                    <StandardDisclaimer />
                  </>
                ) : (
                  <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-600 bg-gray-50">
                    <p className="text-lg font-semibold mb-2">この記事は現在準備中です。</p>
                    <p className="text-sm">公開まで今しばらくお待ちください。</p>
                  </div>
                )}
              </div>

              {hasTopicMeta && (
                <div className="my-10 py-8 border-y border-dashed border-gray-200" aria-label="この記事のカテゴリとタグ">
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
