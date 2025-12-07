/**
 * 構造化データ（JSON-LD）コンポーネント
 * Google検索結果でのリッチスニペット表示のため
 */

import { SITE_URL } from '@/lib/constants'

interface Author {
  name: string
  slug?: { current: string }
}

type CategoryValue = string | { title?: string | null }

interface Post {
  _id: string
  title: string
  slug: { current: string }
  excerpt?: string
  publishedAt?: string
  _createdAt: string
  _updatedAt?: string
  author?: Author
  categories?: CategoryValue[]
  readingTime?: number
}

interface ArticleStructuredDataProps {
  post: Post
}

/**
 * Article構造化データ
 * 記事の基本情報をGoogleに伝える
 */
export function ArticleStructuredData({ post }: ArticleStructuredDataProps) {
  const publishedDate = post.publishedAt ?? post._createdAt
  const modifiedDate = post._updatedAt ?? post.publishedAt ?? post._createdAt
  const canonicalUrl = `${SITE_URL}/posts/${post.slug.current}`
  const primaryCategory = post.categories?.[0]
  const primaryCategoryTitle =
    typeof primaryCategory === 'string' ? primaryCategory : primaryCategory?.title || '看護助手'
  const resolvedKeywords = (post.categories || []).map(category =>
    typeof category === 'string' ? category : category?.title
  )

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || `${post.title}について、看護助手として働く皆様のお役に立つ情報をお届けします。`,
    url: canonicalUrl,
    datePublished: publishedDate,
    dateModified: modifiedDate,
    author: {
      '@type': 'Person',
      name: post.author?.name || 'ProReNata編集部',
      url: post.author?.slug?.current
        ? `${SITE_URL}/authors/${post.author.slug.current}`
        : SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'ProReNata',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    articleSection: primaryCategoryTitle,
    keywords: [
      ...resolvedKeywords.filter(Boolean),
      '看護助手',
      'ProReNata',
    ].join(', '),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    ></script>
  )
}

interface BreadcrumbStructuredDataProps {
  title: string
  slug: string
}

/**
 * BreadcrumbList構造化データ
 * パンくずナビゲーションをGoogleに伝える
 */
export function BreadcrumbStructuredData({ title, slug }: BreadcrumbStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'ホーム',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: '記事一覧',
        item: `${SITE_URL}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: title,
        item: `${SITE_URL}/posts/${slug}`,
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    ></script>
  )
}

/**
 * Organization構造化データ
 * サイト運営組織の情報をGoogleに伝える
 */
export function OrganizationStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ProReNata',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: '看護助手として働く皆様のための情報サイト。仕事内容、給料、資格、転職など、現場で役立つ情報をお届けします。',
    sameAs: [
      // SNSアカウントがあれば追加
      // 'https://twitter.com/prorenata',
      // 'https://www.facebook.com/prorenata',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      url: `${SITE_URL}/contact`,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    ></script>
  )
}

interface WebSiteStructuredDataProps {
  searchUrl?: string
}

/**
 * WebSite構造化データ
 * サイト全体の情報とサイト内検索をGoogleに伝える
 */
export function WebSiteStructuredData({ searchUrl = `${SITE_URL}/search` }: WebSiteStructuredDataProps = {}) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ProReNata',
    url: SITE_URL,
    description: '看護助手として働く皆様のための情報サイト',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${searchUrl}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    ></script>
  )
}

interface FAQItem {
  question: string
  answer: string
}

interface FAQStructuredDataProps {
  faqItems: FAQItem[]
}

/**
 * FAQPage構造化データ
 * よくある質問をGoogleに伝える
 */
export function FAQStructuredData({ faqItems }: FAQStructuredDataProps) {
  if (!faqItems || faqItems.length === 0) return null

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
