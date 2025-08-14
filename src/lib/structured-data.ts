import { Post } from '@/lib/sanity'

export interface StructuredData {
  '@context': string
  '@type': string
  [key: string]: unknown
}

export function generateWebsiteStructuredData(): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ProReNata - 看護助手サポート',
    alternateName: 'ProReNata',
    description: '看護助手として働く方・目指す方のための実践的な情報サイト。基礎知識からキャリア形成、実務ノウハウまで幅広くサポートします。',
    url: 'https://prorenata.jp',
    publisher: {
      '@type': 'Organization',
      name: 'ProReNata編集部',
      logo: {
        '@type': 'ImageObject',
        url: 'https://prorenata.jp/logo.png'
      }
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://prorenata.jp/search?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    },
    mainEntity: {
      '@type': 'ItemList',
      name: '看護助手情報カテゴリー',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: '基礎知識・入門',
          url: 'https://prorenata.jp/categories/basics'
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'キャリア・資格',
          url: 'https://prorenata.jp/categories/career'
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: '実務・ノウハウ',
          url: 'https://prorenata.jp/categories/practice'
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: '給与・待遇',
          url: 'https://prorenata.jp/categories/salary'
        },
        {
          '@type': 'ListItem',
          position: 5,
          name: '職場別情報',
          url: 'https://prorenata.jp/categories/workplace'
        }
      ]
    }
  }
}

export function generateOrganizationStructuredData(): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ProReNata編集部',
    alternateName: 'ProReNata',
    description: '看護助手の皆様をサポートする専門情報サイトを運営',
    url: 'https://prorenata.jp',
    logo: 'https://prorenata.jp/logo.png',
    sameAs: [],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'JP',
      addressRegion: '日本'
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: 'Japanese'
    }
  }
}

export function generateArticleStructuredData(post: Post): StructuredData {
  const baseUrl = 'https://prorenata.jp'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${baseUrl}/posts/${post.slug.current}`,
    headline: post.title,
    description: post.excerpt || post.metaDescription || '',
    articleBody: post.body?.map((block: { _type?: string; children?: Array<{ text?: string }> }) => 
      block._type === 'block' && block.children 
        ? block.children.map((child) => child.text || '').join('')
        : ''
    ).join(' ').slice(0, 500) + '...',
    author: {
      '@type': 'Organization',
      name: post.author?.name || 'ProReNata編集部',
      url: baseUrl
    },
    publisher: {
      '@type': 'Organization',
      name: 'ProReNata編集部',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`
      }
    },
    datePublished: post.publishedAt,
    dateModified: post._updatedAt || post.publishedAt,
    url: `${baseUrl}/posts/${post.slug.current}`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/posts/${post.slug.current}`
    },
    keywords: [
      ...(post.tags || []),
      ...(post.relatedKeywords || []),
      post.focusKeyword
    ].filter(Boolean).join(','),
    articleSection: post.categories?.join(',') || '看護助手',
    about: {
      '@type': 'Thing',
      name: '看護助手',
      description: '医療現場で看護師をサポートする職業'
    },
    audience: {
      '@type': 'Audience',
      audienceType: '看護助手・医療従事者・転職検討者',
      name: post.targetAudience === 'beginner' ? '初心者' : 
            post.targetAudience === 'intermediate' ? '中級者' : 
            post.targetAudience === 'advanced' ? '上級者' : '全レベル'
    },
    educationalLevel: post.difficulty === 'beginner' ? '初級' : 
                     post.difficulty === 'intermediate' ? '中級' : 
                     post.difficulty === 'advanced' ? '上級' : '全レベル',
    timeRequired: post.readingTime ? `PT${post.readingTime}M` : 'PT5M'
  }
}

export function generateBreadcrumbStructuredData(breadcrumbs: Array<{name: string, url: string}>): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }
}

export function generateFAQStructuredData(faqs: Array<{question: string, answer: string}>): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }
}