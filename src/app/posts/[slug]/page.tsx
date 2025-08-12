
import { createClient } from 'next-sanity'
import { PortableText } from '@portabletext/react'
import Link from 'next/link'

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
    excerpt,
    body,
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

  return (
    <div className="medical-gradient-subtle min-h-screen">
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
        <article className="max-w-4xl mx-auto px-6">
          <div className="medical-card p-8 mb-8">
            {/* メタ情報 */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span className="medical-badge medical-badge-primary">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                </svg>
                ブログ記事
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
      </main>
    </div>
  )
}
