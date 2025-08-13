
import { createClient } from 'next-sanity'
import { PortableText } from '@portabletext/react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import type { Metadata } from 'next'

const projectId = '72m8vhy2'
const dataset = 'production'
const apiVersion = '2024-01-01'

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
})

export async function generateStaticParams() {
  const query = `*[_type == "post" && defined(slug.current)]{ "slug": slug.current }`
  const slugs: { slug: string }[] = await client.fetch(query)
  return slugs.map((s: { slug: string }) => ({ slug: s.slug }))
}

// 動的メタデータ生成
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const query = `*[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    excerpt,
    publishedAt,
    _updatedAt,
    slug,
    metaTitle,
    metaDescription,
    focusKeyword,
    relatedKeywords,
    featured,
    readingTime,
    "categories": categories[]->title,
    "author": author->{name}
  }`
  
  try {
    const post = await client.fetch(query, { slug: resolvedParams.slug })
    
    if (!post) {
      return {
        title: '記事が見つかりません | ProReNata',
        description: 'お探しの記事は存在しないか、削除された可能性があります。',
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://prorenata.vercel.app'
    const canonicalUrl = `${baseUrl}/posts/${post.slug.current}`
    
    // メタタイトル（SEO最適化）
    const title = post.metaTitle || `${post.title} | ProReNata`
    
    // メタ説明（SEO最適化）
    const description = post.metaDescription || 
      post.excerpt || 
      `${post.title}について、看護助手として働く皆様のお役に立つ情報をお届けします。`
    
    // キーワード（SEO最適化）
    const keywords = [
      post.focusKeyword,
      ...(post.relatedKeywords || []),
      ...(post.categories || []),
      '看護助手',
      'ProReNata'
    ].filter(Boolean)

    return {
      title,
      description,
      keywords: keywords.join(', '),
      
      // URL設定
      alternates: {
        canonical: canonicalUrl,
      },
      
      // Open Graph
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: 'ProReNata',
        locale: 'ja_JP',
        type: 'article',
        publishedTime: post.publishedAt,
        modifiedTime: post._updatedAt || post.publishedAt,
        authors: post.author?.name ? [post.author.name] : ['ProReNata編集部'],
        section: post.categories?.[0] || '記事',
        tags: keywords,
        images: [
          {
            url: `${baseUrl}/og-article.png`,
            width: 1200,
            height: 630,
            alt: title,
            type: 'image/png'
          }
        ]
      },
      
      // Twitter Card
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [`${baseUrl}/twitter-article.png`],
        creator: '@prorenata',
      },
      
      // 記事固有の情報
      other: {
        'article:author': post.author?.name || 'ProReNata編集部',
        'article:published_time': post.publishedAt,
        'article:modified_time': post._updatedAt || post.publishedAt,
        'article:section': post.categories?.[0] || '記事',
        'article:tag': keywords.join(','),
        'reading-time': `${post.readingTime || 5}分`,
      },
      
      // 検索エンジン最適化
      robots: {
        index: true,
        follow: true,
        nocache: false,
        googleBot: {
          index: true,
          follow: true,
          noimageindex: false,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
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
  const query = `*[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    publishedAt,
    _updatedAt,
    excerpt,
    body,
    focusKeyword,
    relatedKeywords,
    readingTime,
    "categories": categories[]->title,
    "author": author->{name, slug}
  }`
  const post = await client.fetch(query, { slug: resolvedParams.slug })

  if (!post) {
    return (
      <div className="medical-gradient-subtle min-h-screen">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">記事が見つかりません</h1>
          <p className="text-slate-600 mb-8">お探しの記事は存在しないか、削除された可能性があります。</p>
          <Link href="/" className="btn btn-primary">
            ホームに戻る
          </Link>
        </div>
      </div>
    )
  }

  // 構造化データ (JSON-LD)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://prorenata.vercel.app'
  const articleStructuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.excerpt || `${post.title}について詳しく解説します。`,
    "author": {
      "@type": "Person",
      "name": post.author?.name || "ProReNata編集部"
    },
    "publisher": {
      "@type": "Organization",
      "name": "ProReNata",
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/logo.png`
      }
    },
    "datePublished": post.publishedAt,
    "dateModified": post._updatedAt || post.publishedAt,
    "url": `${baseUrl}/posts/${resolvedParams.slug}`,
    "image": `${baseUrl}/og-article.png`,
    "articleSection": post.categories?.[0] || "記事",
    "keywords": [
      post.focusKeyword,
      ...(post.relatedKeywords || []),
      ...(post.categories || [])
    ].filter(Boolean).join(", "),
    "wordCount": post.body ? post.body.length * 5 : 1000, // 概算
    "timeRequired": `PT${post.readingTime || 5}M`,
    "inLanguage": "ja-JP",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${baseUrl}/posts/${resolvedParams.slug}`
    }
  }

  return (
    <div className="medical-gradient-subtle min-h-screen">
      {/* 構造化データの挿入 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleStructuredData)
        }}
      />
      {/* ヘッダー */}
      <header className="medical-gradient text-white py-8">
        <div className="max-w-4xl mx-auto px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            ProReNataホームに戻る
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* メインコンテンツエリア */}
            <div className="lg:col-span-3">
              <article>
                <div className="medical-card p-8 mb-8">
            {/* メタ情報 */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span className="medical-badge medical-badge-primary">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                </svg>
                ProReNata
              </span>
              {post.categories && post.categories.map((category: string, index: number) => (
                <span key={index} className="medical-badge medical-badge-secondary">
                  {category}
                </span>
              ))}
            </div>

            {/* タイトル */}
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4 leading-tight">
              {post.title}
            </h1>

            {/* 概要 */}
            {post.excerpt && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
                <p className="text-blue-800 leading-relaxed">{post.excerpt}</p>
              </div>
            )}

            {/* 公開情報 */}
            <div className="flex items-center justify-between py-4 mb-8 border-b border-slate-200">
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <time className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(post.publishedAt).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
                {post.author && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {post.author.name}
                  </span>
                )}
              </div>
              <div className="flex items-center text-xs text-slate-400">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                約5分で読める
              </div>
            </div>

            {/* 記事本文 */}
            <div className="prose prose-lg prose-slate max-w-none">
              <PortableText value={post.body} />
            </div>
          </div>

                {/* 記事下部のCTA */}
                <div className="medical-gradient text-white rounded-lg p-8 text-center">
                  <h2 className="text-2xl font-bold mb-4">他の記事も読んでみませんか？</h2>
                  <p className="text-blue-100 mb-6">
                    看護助手の体験や日常のこと、趣味のことなどを
                    気軽に書いている個人ブログです。
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/" className="btn btn-secondary">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M8 11h8" />
                      </svg>
                      他の記事を見る
                    </Link>
                    <Link href="/" className="btn btn-outline bg-white text-blue-600 border-white hover:bg-blue-50">
                      ホームに戻る
                    </Link>
                  </div>
                </div>
              </article>
            </div>
            
            {/* サイドバー */}
            <div className="lg:col-span-1">
              <Sidebar />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
