import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import ArticleWithTOC from '@/components/ArticleWithTOC'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ViewCounter from '@/components/ViewCounter'
import { ArticleStructuredData, BreadcrumbStructuredData, OrganizationStructuredData, FAQStructuredData } from '@/components/StructuredData'
import { formatPostDate, getRelatedPosts, safeSanityFetch, urlFor, type SanityImage } from '@/lib/sanity'
import { SITE_URL } from '@/lib/constants'
import { CATEGORY_SUMMARY, resolveTagDefinition, type CategorySlug } from '@/data/tagCatalog'
import Image from 'next/image'
import { sanitizeTitle, sanitizePersonaText } from '@/lib/title'
import PRDisclosure from '@/components/Article/PRDisclosure'
import StandardDisclaimer from '@/components/Article/StandardDisclaimer'
import DisclaimerBlock from '@/components/Article/DisclaimerBlock'
import TrustBlock from '@/components/Article/TrustBlock'
import type { PortableTextBlock as PortableTextBlockType } from '@portabletext/types'

export const dynamic = 'force-dynamic'
export const revalidate = 3600
// Guard: draftMode() uses headers => this route must remain dynamic.
// If you remove force-dynamic, also remove draftMode()/headers/cookies usage.
const __STATIC_TO_DYNAMIC_GUARD__: 'force-dynamic' = dynamic
void __STATIC_TO_DYNAMIC_GUARD__

type RawCategory = string | { title?: string | null; slug?: string | null }
type PortableTextSpan = { _type?: string; text?: string }
type RawPortableTextBlock = { _type?: string; style?: string; children?: PortableTextSpan[]; _key?: string }

interface PostMeta {
  _id: string
  title: string
  excerpt?: string
  _createdAt?: string
  publishedAt?: string
  _updatedAt?: string
  slug?: { current?: string }
  mainImage?: SanityImage | null
  metaDescription?: string
  featured?: boolean
  readingTime?: number
  categories?: Array<{ title?: string | null; slug?: string | null }> | null
  author?: { name?: string | null } | null
  hasBody?: boolean
  firstBodyImage?: SanityImage | null
  internalOnly?: boolean
}

interface PostDetail {
  _id: string
  title: string
  slug?: { current?: string }
  _createdAt?: string
  publishedAt?: string
  _updatedAt?: string
  excerpt?: string
  mainImage?: SanityImage | null
  body?: Array<Record<string, unknown>>
  focusKeyword?: string
  relatedKeywords?: string[]
  readingTime?: number
  contentType?: string
  tags?: string[]
  categories?: Array<{ title?: string | null; slug?: string | null }> | null
  author?: { name?: string; slug?: { current?: string } } | null
  faq?: Array<Record<string, unknown>> | null
  stickyCTA?: unknown
  isSeraPick?: boolean
  internalOnly?: boolean
  showDisclaimer?: boolean
  showTrustBlock?: boolean
}

interface RelatedFallbackItem {
  title?: string
  slug?: string
  categories?: Array<{ title?: string; slug?: string | null }>
}

interface SiteSettings {
  disclaimerEnabled?: boolean
  disclaimerTitle?: string
  disclaimerBody?: PortableTextBlockType[]
  trustEnabled?: boolean
  trustTitle?: string
  trustBody?: PortableTextBlockType[]
}

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

function getPortableTextBlockText(block: RawPortableTextBlock): string {
  const children = Array.isArray(block.children) ? block.children : []
  return children
    .map((child) => (typeof child?.text === 'string' ? child.text : ''))
    .join('')
    .trim()
}

function isSummaryHeading(block: RawPortableTextBlock): boolean {
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
  const blocks = body as RawPortableTextBlock[]
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
  const disclaimerIndex = blocks.findIndex(isDisclaimerParagraph)
  const hasDisclaimerInSummary = disclaimerIndex > summaryIndex && disclaimerIndex < endIndex
  const summaryBlocks = blocks.slice(summaryIndex + 1, hasDisclaimerInSummary ? disclaimerIndex : endIndex)
  const after = hasDisclaimerInSummary ? blocks.slice(disclaimerIndex) : blocks.slice(endIndex)

  const kept: RawPortableTextBlock[] = []
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

function isDisclaimerParagraph(block: RawPortableTextBlock): boolean {
  if (block?._type !== 'block') return false
  const text = getPortableTextBlockText(block)
  return text.startsWith('免責事項')
}

function isAffiliateEmbedBlock(block: RawPortableTextBlock): boolean {
  return block?._type === 'affiliateEmbed'
}

function isManualRelatedHeading(block: RawPortableTextBlock): boolean {
  if (block?._type !== 'block') return false
  if (block.style !== 'h2' && block.style !== 'h3') return false
  const text = getPortableTextBlockText(block)
  return /あわせて読/.test(text) || text.includes('関連記事')
}

function stripManualRelatedSection(body: unknown) {
  if (!Array.isArray(body) || body.length === 0) return body
  const blocks = body as RawPortableTextBlock[]

  const stripped: RawPortableTextBlock[] = []
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
  const blocks = body as RawPortableTextBlock[]

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

  const blocks = cleanedBody as RawPortableTextBlock[]
  const alreadyInserted = blocks.some((block) => block?._type === 'relatedPosts')
  if (alreadyInserted) return cleanedBody
  const insertAt = blocks.length

  const relatedBlock = {
    _type: 'relatedPosts',
    _key: `related-posts-${posts[0]?.slug || 'auto'}`,
    posts,
  }

  return [...blocks.slice(0, insertAt), relatedBlock, ...blocks.slice(insertAt)]
}

function isPortableTextBlock(block: RawPortableTextBlock): block is PortableTextBlockType {
  return block?._type === 'block' && Array.isArray(block.children)
}

function extractDisclaimerBlocks(body: unknown) {
  if (!Array.isArray(body) || body.length === 0) {
    return { mainBody: body, disclaimerBlocks: [] as PortableTextBlockType[] }
  }

  const blocks = body as RawPortableTextBlock[]
  const disclaimerIndex = blocks.findIndex(isDisclaimerParagraph)
  if (disclaimerIndex < 0) {
    return { mainBody: body, disclaimerBlocks: [] as PortableTextBlockType[] }
  }

  const disclaimerBlocks: PortableTextBlockType[] = []
  const mainBody: RawPortableTextBlock[] = []

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i]
    if (i < disclaimerIndex) {
      mainBody.push(block)
      continue
    }

    const isHeading = block?._type === 'block' && (block.style === 'h2' || block.style === 'h3')
    const isRelated = block?._type === 'relatedPosts'

    if (i !== disclaimerIndex && (isHeading || isRelated)) {
      for (let j = i; j < blocks.length; j += 1) {
        mainBody.push(blocks[j])
      }
      break
    }

    if (isPortableTextBlock(block)) {
      disclaimerBlocks.push(block)
    }
  }

  return { mainBody, disclaimerBlocks }
}

export async function generateStaticParams() {
  return []
}

export async function generateMetadata(
  { params, searchParams }: { params: Promise<{ slug: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
): Promise<Metadata> {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
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
    const { data: post, error } = await safeSanityFetch<PostMeta | null>(
      query,
      { slug: resolvedParams.slug },
      { tag: 'post-metadata' }
    )

    if (error) {
      return {
        title: 'エラー | ProReNata',
        description: '記事の読み込み中にエラーが発生しました。',
        robots: {
          index: false,
          follow: false,
        },
      }
    }

    if (!post || !post.slug?.current) {
      return {
        title: '記事が見つかりません | ProReNata',
        description: 'お探しの記事は存在しないか、削除された可能性があります。',
        robots: {
          index: false,
          follow: false,
        }
      }
    }

    const slugCurrent = post.slug.current
    const normalizedCategories = normalizeCategories(post.categories)
    const categoryTitles = normalizedCategories.map(category => category.title)

    const baseUrl = SITE_URL
    let canonicalUrl = `${baseUrl}/posts/${slugCurrent}`

    // Add query parameters for cache-busting (e.g. ?t=1)
    if (resolvedSearchParams && Object.keys(resolvedSearchParams).length > 0) {
      const queryString = new URLSearchParams(resolvedSearchParams as Record<string, string>).toString()
      canonicalUrl = `${canonicalUrl}?${queryString}`
    }
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
      : `${baseUrl}/sera/sera_icon.jpg`

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
    internalOnly,
    showDisclaimer,
    showTrustBlock
  }`
  const { data: post, error } = await safeSanityFetch<PostDetail | null>(
    query,
    { slug: resolvedParams.slug },
    { preview: isDraftMode, tag: 'post-detail' }
  )

  if (error) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-3xl px-4 sm:px-6 xl:max-w-5xl xl:px-0">
          <div className="py-16 text-center">
            <h1 className="text-2xl font-bold text-gray-900">読み込み中にエラーが発生しました</h1>
            <p className="mt-4 text-gray-600">時間をおいて再度アクセスしてください。</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Link
                href="/blog"
                className="text-cyan-600 hover:text-cyan-700 font-medium px-4 py-2 rounded-md border border-cyan-200 hover:border-cyan-300 transition-colors duration-200"
              >
                記事一覧に戻る
              </Link>
              <Link
                href="/"
                className="text-cyan-600 hover:text-cyan-700 font-medium px-4 py-2 rounded-md border border-cyan-200 hover:border-cyan-300 transition-colors duration-200"
              >
                ホームに戻る
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (!post || !post.slug?.current) {
    notFound()
  }

  const settingsQuery = `*[_type == "siteSettings"][0]{
    disclaimerEnabled,
    disclaimerTitle,
    disclaimerBody,
    trustEnabled,
    trustTitle,
    trustBody
  }`
  const { data: siteSettings } = await safeSanityFetch<SiteSettings | null>(
    settingsQuery,
    {},
    { preview: isDraftMode, tag: 'site-settings' }
  )

  const slugCurrent = post.slug.current
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
    const { data: fallback } = await safeSanityFetch<RelatedFallbackItem[] | null>(
      fallbackQuery,
      { id: post._id },
      { preview: isDraftMode, tag: 'related-fallback' }
    )

    const seen = new Set<string>(relatedPosts.map((p) => p.slug))
    const merged = [...relatedPosts]
    for (const item of Array.isArray(fallback) ? fallback : []) {
      const slug = typeof item?.slug === 'string' ? item.slug : ''
      const title = typeof item?.title === 'string' ? item.title : ''
      if (!slug || !title || seen.has(slug)) continue
      seen.add(slug)
      merged.push({
        title,
        slug,
        categories: Array.isArray(item.categories)
          ? item.categories
            .filter(
              (category): category is { title: string; slug?: string | null } =>
                typeof category?.title === 'string'
            )
            .map((category) => ({ title: category.title, slug: category.slug ?? null }))
          : [],
      })
      if (merged.length >= 6) break
    }
    relatedPosts = merged
  }

  const hasBody = post && Array.isArray(post.body) && post.body.length > 0
  const { mainBody } = hasBody ? extractDisclaimerBlocks(post.body) : { mainBody: post.body }
  const cleanedBody = hasBody ? pruneOffTopicSummary(mainBody, post.title) : mainBody
  const abTestedBody = hasBody ? reorderBlocksForABTesting(cleanedBody, post._id) : cleanedBody
  const bodyWithRelated = hasBody ? injectRelatedPostsBeforeDisclaimer(abTestedBody, relatedPosts) : abTestedBody
  const tocContent = (Array.isArray(bodyWithRelated) ? bodyWithRelated : []) as Array<{
    _type: string
    style?: string
    [key: string]: unknown
  }>
  const showDisclaimer = post.showDisclaimer !== false
  const showTrustBlock = post.showTrustBlock !== false
  const disclaimerBody = Array.isArray(siteSettings?.disclaimerBody) ? siteSettings?.disclaimerBody : undefined
  const trustBody = Array.isArray(siteSettings?.trustBody) ? siteSettings?.trustBody : undefined
  const hasDisclaimerBody = Boolean(disclaimerBody?.length)
  const hasTrustBody = Boolean(trustBody?.length)
  const canShowDisclaimerFromSettings = Boolean(siteSettings?.disclaimerEnabled && showDisclaimer && hasDisclaimerBody)
  const canShowTrustFromSettings = Boolean(siteSettings?.trustEnabled && showTrustBlock && hasTrustBody)
  const shouldShowStandardDisclaimer = showDisclaimer && !canShowDisclaimerFromSettings

  const displayTitle = sanitizeTitle(post.title)
  const sanitizedExcerpt = post?.excerpt ? sanitizePersonaText(post.excerpt) : undefined
  const faqItems = Array.isArray(post.faq)
    ? post.faq.filter(
      (item): item is { question: string; answer: string } =>
        typeof item?.question === 'string' && typeof item?.answer === 'string'
    )
    : []
  const structuredPost = {
    ...post,
    _createdAt: post._createdAt!,
    slug: { current: slugCurrent },
    title: displayTitle,
    categories: categoryTitles,
    excerpt: sanitizedExcerpt,
    author: post.author?.name
      ? {
        name: post.author.name,
        ...(post.author.slug?.current ? { slug: { current: post.author.slug.current } } : {}),
      }
      : undefined,
  }
  const categoryChipClass =
    "inline-flex items-center rounded-full border border-cyan-200 dark:border-cyan-800 px-3 py-1 text-sm font-medium text-cyan-700 dark:text-cyan-300 hover:border-cyan-300 dark:hover:border-cyan-700 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 transition-colors duration-200"
  const tagChipClass =
    "inline-flex items-center rounded-full border border-cyan-200 dark:border-cyan-800 px-3 py-1 text-sm font-medium text-cyan-700 dark:text-cyan-300 hover:border-cyan-300 dark:hover:border-cyan-700 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 transition-colors duration-200"


  return (
    <>
      {/* 構造化データ（JSON-LD） */}
      <ArticleStructuredData post={structuredPost} />
      <BreadcrumbStructuredData title={post.title} slug={slugCurrent} />
      <OrganizationStructuredData />
      <FAQStructuredData faqItems={faqItems} />

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
            <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 pt-6 pb-4">
              <Link href="/" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors duration-200">
                ホーム
              </Link>
              <span className="text-gray-300 dark:text-gray-700">/</span>
              <Link href="/blog" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors duration-200">
                記事一覧
              </Link>
              <span className="text-gray-300 dark:text-gray-700">/</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium truncate">{displayTitle}</span>
            </nav>


            <header className="pt-6 xl:pb-6">
              <div className="space-y-1 text-center">
                <dl className="space-y-10">
                  <div>
                    <dt className="sr-only">Published on</dt>
                    <dd className="text-base font-medium leading-6 text-gray-500 dark:text-gray-400">

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
                  <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl sm:leading-10 md:text-5xl md:leading-14">
                    {displayTitle}
                  </h1>

                </div>
                {/* 閲覧数カウンター */}
                <div className="flex justify-center pt-2">
                  <ViewCounter slug={slugCurrent} />
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

            <div className="pb-8 space-y-16">
              {/* 記事コンテンツ */}
              <div className="prose-custom pb-8 pt-10">
                {hasBody ? (
                  <>
                    <PRDisclosure />
                    <ArticleWithTOC content={tocContent} />
                  </>
                ) : (
                  <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50">
                    <p className="text-lg font-semibold mb-2">この記事は現在準備中です。</p>
                    <p className="text-sm">公開まで今しばらくお待ちください。</p>
                  </div>

                )}
              </div>

              {hasTopicMeta && (
                <div className="my-10 py-8 border-y border-dashed border-gray-200 dark:border-gray-800" aria-label="この記事のカテゴリとタグ">

                  <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
                    {normalizedCategories.length > 0 && (
                      <div className="flex-1 text-center sm:text-left">
                        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-500 dark:text-gray-400">
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
                        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-500 dark:text-gray-400">
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

              {(canShowTrustFromSettings || canShowDisclaimerFromSettings || shouldShowStandardDisclaimer) && (
                <section aria-label="この記事について" className="mt-8">
                  {canShowTrustFromSettings && (
                    <TrustBlock
                      title={siteSettings?.trustTitle || 'この記事について'}
                      body={trustBody}
                    />
                  )}
                  {canShowDisclaimerFromSettings ? (
                    <DisclaimerBlock
                      title={siteSettings?.disclaimerTitle || '免責事項'}
                      body={disclaimerBody}
                    />
                  ) : shouldShowStandardDisclaimer ? (
                    <StandardDisclaimer />
                  ) : null}
                </section>
              )}

              {/* 記事下部のナビゲーション */}
              <footer className="pt-8">
                <div className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                    <Link
                      href="/blog"
                      className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium px-4 py-2 rounded-md border border-cyan-200 dark:border-cyan-800 hover:border-cyan-300 dark:hover:border-cyan-700 transition-colors duration-200"
                      aria-label="記事一覧に戻る"
                    >
                      記事一覧に戻る
                    </Link>
                    <Link
                      href="/"
                      className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium px-4 py-2 rounded-md border border-cyan-200 dark:border-cyan-800 hover:border-cyan-300 dark:hover:border-cyan-700 transition-colors duration-200"
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
