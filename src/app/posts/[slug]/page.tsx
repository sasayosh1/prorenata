import { createClient } from 'next-sanity'
import { PortableText } from '@portabletext/react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft, Clock, User, Calendar, Tag, BookOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import TableOfContents from '@/components/TableOfContents'
import ReadingProgress from '@/components/ReadingProgress'
import ShareButtons from '@/components/ShareButtons'
import DarkModeToggle from '@/components/DarkModeToggle'
import { generateArticleStructuredData, generateBreadcrumbStructuredData } from '@/lib/structured-data'

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

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://prorenata.jp'
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
            url: `${baseUrl}/api/og?title=${encodeURIComponent(post.title)}&subtitle=${encodeURIComponent(description)}&category=${encodeURIComponent(post.categories?.[0] || '')}&readingTime=${post.readingTime || 5}`,
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
        images: [`${baseUrl}/api/og?title=${encodeURIComponent(post.title)}&subtitle=${encodeURIComponent(description)}&category=${encodeURIComponent(post.categories?.[0] || '')}&readingTime=${post.readingTime || 5}`],
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
      <div className="min-h-screen bg-gradient-to-b from-medical-50/30 to-white">
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <div className="medical-card p-12">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-professional-100 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-professional-600" />
            </div>
            <h1 className="text-2xl font-bold text-professional-900 mb-4">記事が見つかりません</h1>
            <p className="text-professional-700 mb-8">お探しの記事は存在しないか、削除された可能性があります。</p>
            <Link href="/">
              <Button variant="default">
                <ArrowLeft className="w-4 h-4 mr-2" />
                ホームに戻る
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const currentUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://prorenata.jp'}/posts/${post.slug.current}`
  
  // パンくずリストの構造化データ
  const breadcrumbs = [
    { name: 'ホーム', url: 'https://prorenata.jp' },
    { name: '記事一覧', url: 'https://prorenata.jp/articles' },
    { name: post.title, url: currentUrl }
  ]

  return (
    <>
      {/* 構造化データ - 記事情報 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateArticleStructuredData(post))
        }}
      />
      
      {/* 構造化データ - パンくずリスト */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateBreadcrumbStructuredData(breadcrumbs))
        }}
      />
      <ReadingProgress />
      
      <div className="min-h-screen bg-gradient-to-b from-medical-50/30 to-white">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-professional-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <Link 
                href="/" 
                className="inline-flex items-center text-professional-700 hover:text-medical-600 transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                ProReNata
              </Link>
              
              <div className="flex items-center gap-4">
                <DarkModeToggle />
                <ShareButtons url={currentUrl} title={post.title} excerpt={post.excerpt} />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="py-8">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              
              {/* Table of Contents - Sidebar */}
              <aside className="lg:col-span-1 order-2 lg:order-1">
                <TableOfContents className="lg:max-w-xs" />
              </aside>

              {/* Article Content */}
              <article className="lg:col-span-3 order-1 lg:order-2">
                <div className="medical-card p-8 lg:p-12">
                  
                  {/* Article Meta */}
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Badge variant="medical">ProReNata</Badge>
                    {post.categories && post.categories.map((category: string, index: number) => (
                      <Badge key={index} variant="outline">
                        <Tag className="w-3 h-3 mr-1" />
                        {category}
                      </Badge>
                    ))}
                  </div>

                  {/* Article Title */}
                  <h1 className="text-3xl lg:text-4xl font-bold text-professional-900 leading-tight mb-6">
                    {post.title}
                  </h1>

                  {/* Article Excerpt */}
                  {post.excerpt && (
                    <div className="bg-gradient-to-br from-medical-50 via-white to-clean-50 border border-professional-200 rounded-xl p-6 mb-8">
                      <p className="text-lg text-professional-800 leading-relaxed font-medium">
                        {post.excerpt}
                      </p>
                    </div>
                  )}

                  {/* Article Meta Info */}
                  <div className="flex flex-wrap items-center gap-6 py-6 mb-8 border-y border-professional-200">
                    <div className="flex items-center text-sm text-professional-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <time dateTime={post.publishedAt}>
                        {formatDate(post.publishedAt)}
                      </time>
                    </div>
                    
                    {post.author && (
                      <div className="flex items-center text-sm text-professional-600">
                        <User className="w-4 h-4 mr-2" />
                        執筆: {post.author.name}
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-professional-600">
                      <Clock className="w-4 h-4 mr-2" />
                      読了時間: 約{post.readingTime || 5}分
                    </div>
                  </div>

                  {/* Article Body */}
                  <div className="prose-medical">
                    <PortableText value={post.body} />
                  </div>

                  {/* Article Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-professional-200">
                      <h3 className="text-lg font-semibold text-professional-900 mb-4">タグ</h3>
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Related Articles CTA */}
                  <div className="mt-12 p-8 bg-gradient-to-br from-medical-50 via-white to-clean-50 border border-professional-200 rounded-xl text-center">
                    <h2 className="text-2xl font-bold text-professional-900 mb-4">
                      他の記事も読んでみませんか？
                    </h2>
                    <p className="text-professional-700 mb-6 max-w-2xl mx-auto leading-relaxed">
                      看護助手として働く皆様に役立つ情報を、実体験をもとに率直にお届けしています。
                      同じような立場で働く方々の参考になれば嬉しいです。
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Link href="/">
                        <Button size="lg">
                          <BookOpen className="w-4 h-4 mr-2" />
                          他の記事を見る
                        </Button>
                      </Link>
                      <Link href="/categories">
                        <Button variant="outline" size="lg">
                          <Tag className="w-4 h-4 mr-2" />
                          カテゴリー一覧
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </main>

        {/* Footer Notice */}
        <section className="py-8 bg-professional-50 border-t border-professional-200">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="inline-flex items-center justify-center w-full p-4 bg-white rounded-lg border border-professional-200 shadow-sm">
              <svg className="w-5 h-5 text-medical-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-professional-700 leading-relaxed">
                <strong className="text-professional-900">重要：</strong>
                この記事は個人的な体験や意見をもとに書かれています。
                医療に関する判断は、必ず専門医にご相談ください。
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}