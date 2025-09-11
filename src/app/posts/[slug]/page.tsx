
import { createClient } from 'next-sanity'
import { PortableText } from '@portabletext/react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { portableTextComponents } from '@/components/PortableTextComponents'

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
    slug,
    publishedAt,
    _updatedAt,
    excerpt,
    body,
    focusKeyword,
    relatedKeywords,
    readingTime,
    contentType,
    tags,
    "categories": categories[]->title,
    "author": author->{name, slug}
  }`
  const post = await client.fetch(query, { slug: resolvedParams.slug })

  if (!post) {
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">記事が見つかりません</h1>
          <p className="text-gray-600 mb-8">お探しの記事は存在しないか、削除された可能性があります。</p>
          <Link href="/" className="bg-gray-900 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">
            ホームに戻る
          </Link>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-4xl mx-auto px-6">
          <Link href="/" className="text-gray-600 hover:text-gray-900 text-sm">
            ← ProReNataホームに戻る
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="py-8">
        <div className="max-w-4xl mx-auto px-6">
          <article className="card fade-in">
            {/* メタ情報 */}
            <div className="mb-6">
              <span className="badge">🩺 ProReNata</span>
              {post.categories && post.categories.map((category: string, index: number) => (
                <span key={index} className="tag ml-2">
                  🏷️ {category}
                </span>
              ))}
            </div>

            {/* タイトル */}
            <h1 className="heading-primary mb-6">
              {post.title}
            </h1>

            {/* 概要 */}
            {post.excerpt && (
              <div className="hero-section mb-8">
                <div className="hero-content">
                  <p style={{color: 'var(--foreground)'}}>{post.excerpt}</p>
                </div>
              </div>
            )}

            {/* 公開情報 */}
            <div className="py-6 mb-8 border-b" style={{borderColor: 'var(--border-light)'}}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-muted">
                <time className="flex items-center">
                  📅 {new Date(post.publishedAt).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  {post.author && (
                    <span className="flex items-center">
                      ✍️ 執筆: {post.author.name}
                    </span>
                  )}
                  <span className="flex items-center">
                    ⏱️ 読了時間: 約{post.readingTime || 5}分
                  </span>
                </div>
              </div>
            </div>

            {/* 記事本文 */}
            <div className="prose prose-lg max-w-none leading-relaxed space-y-8" style={{color: 'var(--foreground)'}}>
              <style jsx>{`
                /* リンクスタイル - 重要：今後絶対に変更しない */
                .external-link {
                  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                  background-clip: text;
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
                  font-weight: 500;
                }
                
                .affiliate-link {
                  background: linear-gradient(135deg, #f59e0b, #d97706);
                  background-clip: text;
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
                  font-weight: 600;
                  position: relative;
                }
                
                .affiliate-link:hover::after {
                  content: ' (PR)';
                  background: #f59e0b;
                  color: white;
                  font-size: 10px;
                  padding: 1px 4px;
                  border-radius: 2px;
                  margin-left: 4px;
                  font-weight: normal;
                  white-space: nowrap;
                }
                
                .new-tab-link:hover {
                  text-decoration: underline dotted;
                }
                
                /* データ属性による詳細なスタイリング */
                a[data-affiliate="true"] {
                  border-bottom: 2px solid rgba(245, 158, 11, 0.3);
                  padding-bottom: 1px;
                }
                
                a[data-external="true"]:not([data-affiliate="true"]) {
                  border-bottom: 1px solid rgba(59, 130, 246, 0.3);
                }
                
                /* アクセシビリティ強化 */
                a[data-new-tab="true"]:focus::after {
                  content: ' (新しいタブで開く)';
                  position: absolute;
                  left: -9999px;
                  width: 1px;
                  height: 1px;
                  overflow: hidden;
                }
                
                /* 外部リンクアイコンのホバー効果 */
                a[data-external="true"] span[aria-label*="外部"] {
                  transition: transform 0.2s ease;
                }
                
                a[data-external="true"]:hover span[aria-label*="外部"] {
                  transform: scale(1.2);
                }
                
                /* アフィリエイトリンクアイコンのホバー効果 */
                a[data-affiliate="true"] span[aria-label*="アフィリエイト"] {
                  transition: transform 0.2s ease;
                }
                
                a[data-affiliate="true"]:hover span[aria-label*="アフィリエイト"] {
                  transform: rotate(15deg);
                }
              `}</style>
              
              <PortableText 
                value={post.body} 
                components={portableTextComponents}
              />
            </div>

            {/* 記事下部のCTA */}
            <div className="hero-section text-center mt-12">
              <div className="hero-content">
                <h2 className="heading-secondary mb-3">📚 他の記事も読んでみませんか？</h2>
                <p className="text-muted mb-6">
                  看護助手の体験や日常のことを気軽に書いている個人ブログです。
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <Link href="/" className="btn btn-primary">
                    📰 他の記事を見る
                  </Link>
                  <Link href="/" className="btn">
                    🏠 ホームに戻る
                  </Link>
                </div>
              </div>
            </div>
          </article>
        </div>
      </main>
    </div>
  )
}
