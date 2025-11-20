import { getAllPosts, formatPostDate, type Post } from '@/lib/sanity'
import Link from 'next/link'
import SimpleSearch from '@/components/SimpleSearch'
import { rankPostsByQuery, buildHighlightSnippet } from '@/lib/searchUtils'

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export const metadata = {
  title: '検索 | ProReNata',
  description: 'ProReNataで記事を検索した結果ページ。',
  robots: {
    index: false,
    follow: true,
  },
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedParams = await searchParams
  const query = (resolvedParams.q || '').trim()

  const allPosts = await getAllPosts({ fetchAll: true, includeBody: true })
  const filteredPosts: Post[] = query
    ? rankPostsByQuery(allPosts, query).slice(0, 100)
    : allPosts

  return (
    <div className="bg-white min-h-screen">
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
          <h1 className="text-2xl font-bold text-gray-900 mb-6">記事検索</h1>
          
          {/* 検索フォーム */}
          <div className="mb-8">
            <SimpleSearch placeholder="記事を検索..." />
          </div>

          {query && (
            <div className="mb-6 text-sm text-gray-600">
              「{query}」の検索結果: {filteredPosts.length}件
            </div>
          )}

          <div className="space-y-4">
            {filteredPosts.map(post => (
              <article key={post._id} className="py-4 border-b border-gray-200 last:border-b-0">
                <div className="flex items-center justify-between mb-1">
                  {(() => {
                    const { dateTime, label } = formatPostDate(post, { year: 'numeric', month: '2-digit', day: '2-digit' })
                    return dateTime ? (
                      <time dateTime={dateTime} className="text-sm text-gray-500">
                        {label}
                      </time>
                    ) : (
                      <span className="text-sm text-gray-500">{label}</span>
                    )
                  })()}
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    ProReNata
                  </span>
                </div>

                <h2 className="text-lg font-medium text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                  <Link href={`/posts/${post.slug.current}`} className="block">
                    {post.title}
                  </Link>
                </h2>

                {query ? (
                  <p className="text-gray-600 text-sm mb-2 line-clamp-3">
                    {buildHighlightSnippet(post.excerpt || post.bodyPlainText || '', query)}
                  </p>
                ) : (
                  post.excerpt && (
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                      {post.excerpt}
                    </p>
                  )
                )}

                <div className="flex items-center justify-between">
                  <Link
                    href={`/posts/${post.slug.current}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    記事を読む →
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {filteredPosts.length === 0 && query && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                「{query}」に一致する記事が見つかりませんでした。
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
