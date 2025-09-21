
import { Suspense } from 'react'
import Link from 'next/link'
import { getPostsPaginated, searchPosts, formatPostDate, type Post } from '@/lib/sanity'
import Pagination from '@/components/Pagination'
import PostsSearch from '@/components/PostsSearch'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const revalidate = 60 // Revalidate every 60 seconds

interface PostsPageProps {
  searchParams: {
    page?: string
    search?: string
  }
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const currentPage = parseInt(searchParams.page || '1', 10)
  const searchQuery = searchParams.search?.trim()

  let posts: Post[] = []
  let totalCount = 0
  let hasNextPage = false
  let hasPrevPage = false
  let totalPages = 1
  let isSearchMode = false

  try {
    if (searchQuery) {
      // 検索モード：全記事対象の検索
      posts = await searchPosts(searchQuery)
      totalCount = posts.length
      isSearchMode = true
    } else {
      // 通常モード：ページネーション付き記事取得
      const result = await getPostsPaginated(currentPage, 15)
      posts = result.posts
      totalCount = result.totalCount
      hasNextPage = result.hasNextPage
      hasPrevPage = result.hasPrevPage
      totalPages = result.totalPages
    }
  } catch (error) {
    console.error('Failed to load posts:', error)
  }

  return (
    <>
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">記事一覧</h1>
          <p className="text-gray-600">
            看護助手に関する全ての記事をご覧いただけます
          </p>
        </div>

      {/* 検索フォーム */}
      <Suspense fallback={<div>検索フォーム読み込み中...</div>}>
        <PostsSearch initialQuery={searchQuery} />
      </Suspense>

      {/* 記事数表示 */}
      <div className="mb-6">
        {isSearchMode ? (
          <p className="text-sm text-gray-600">
            {totalCount}件の記事が見つかりました
          </p>
        ) : (
          <p className="text-sm text-gray-600">
            全{totalCount}件中 {Math.min((currentPage - 1) * 15 + 1, totalCount)}-{Math.min(currentPage * 15, totalCount)}件を表示
          </p>
        )}
      </div>

      {/* 記事一覧 */}
      {posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map((post) => {
            const { label } = formatPostDate(post)

            return (
              <Link href={`/posts/${post.slug.current}`} key={post._id}>
                <article className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {post.title}
                  </h2>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                    <time dateTime={post.publishedAt || post._createdAt}>
                      公開日: {label}
                    </time>

                    {post.categories && post.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {post.categories.slice(0, 3).map((category) => (
                          <span
                            key={category}
                            className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {post.excerpt && (
                    <p className="text-gray-600 leading-relaxed">
                      {post.excerpt}
                    </p>
                  )}
                </article>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">記事が見つかりません</h3>
          <p className="text-gray-500">
            {isSearchMode ? '検索条件を変更してお試しください。' : '記事がまだ投稿されていません。'}
          </p>
        </div>
      )}

      {/* ページネーション（検索モードでは表示しない） */}
      {!isSearchMode && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          hasNextPage={hasNextPage}
          hasPrevPage={hasPrevPage}
          baseUrl="/posts"
        />
      )}

      {/* ホームボタン */}
      <div className="text-center py-8">
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          ホームに戻る
        </Link>
      </div>
    </div>

    <Footer />
  </>
  )
}
