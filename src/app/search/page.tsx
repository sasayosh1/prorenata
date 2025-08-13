import { getAllPosts } from '@/lib/sanity'
import Link from 'next/link'
import SimpleSearch from '@/components/SimpleSearch'

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export const metadata = {
  title: '検索結果 | ProReNata',
  description: 'ProReNataで記事を検索した結果ページ。',
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedParams = await searchParams
  const query = resolvedParams.q || ''
  
  const allPosts = await getAllPosts()
  
  // シンプルな検索ロジック
  const filteredPosts = query ? 
    allPosts.filter(post => 
      post.title.toLowerCase().includes(query.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(query.toLowerCase())
    ) : allPosts

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

          {/* 検索結果 */}
          {query && (
            <div className="mb-6">
              <p className="text-gray-600 text-sm">
                「{query}」の検索結果: {filteredPosts.length}件
              </p>
            </div>
          )}

          {/* 記事一覧 */}
          <div className="space-y-6">
            {filteredPosts.map((post) => (
              <article key={post._id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    ProReNata
                  </span>
                  <time className="text-sm text-gray-500">
                    {new Date(post.publishedAt).toLocaleDateString('ja-JP')}
                  </time>
                </div>
                
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  <Link href={`/posts/${post.slug.current}`} className="hover:text-gray-700">
                    {post.title}
                  </Link>
                </h2>
                
                {post.excerpt && (
                  <p className="text-gray-600 text-sm mb-3">
                    {post.excerpt}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <Link 
                    href={`/posts/${post.slug.current}`}
                    className="text-gray-600 hover:text-gray-900 text-sm"
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