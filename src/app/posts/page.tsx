
import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getPostsPaginated, searchPosts, formatPostDate, urlFor, type Post } from '@/lib/sanity'
import Pagination from '@/components/Pagination'
import PostsSearch from '@/components/PostsSearch'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { sanitizeTitle } from '@/lib/title'

export const revalidate = 60 // Revalidate every 60 seconds

interface PostsPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
  }>
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const params = await searchParams
  const currentPage = parseInt(params.page || '1', 10)
  const searchQuery = params.search?.trim() || undefined

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

      <div className="mx-auto max-w-3xl px-4 sm:px-6 xl:max-w-5xl xl:px-0 py-8">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => {
              const { label } = formatPostDate(post)

              return (
                <Link href={`/posts/${post.slug.current}`} key={post._id}>
                  <article className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group h-full flex flex-col">
                    {/* Image Area */}
                    <div className="h-48 bg-gray-100 relative overflow-hidden">
                      {post.mainImage?.asset ? (
                        <Image
                          src={urlFor(post.mainImage).width(800).height(600).url()}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-100 to-blue-50 opacity-50 group-hover:scale-105 transition-transform duration-500"></div>
                      )}
                    </div>

                    <div className="p-6 flex flex-col flex-grow">
                      <h2 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {sanitizeTitle(post.title)}
                      </h2>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-3">
                        <time dateTime={post.publishedAt || post._createdAt}>
                          {label}
                        </time>

                        {post.categories && post.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {post.categories.slice(0, 2).map((category, index) => {
                              const categoryLabel =
                                typeof category === 'string'
                                  ? category
                                  : category?.title
                              if (!categoryLabel) {
                                return null
                              }
                              return (
                                <span
                                  key={`${post._id}-category-${index}`}
                                  className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                                >
                                  {categoryLabel}
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      {post.excerpt && (
                        <p className="text-sm text-gray-600 leading-relaxed flex-grow line-clamp-3">
                          {post.excerpt}
                        </p>
                      )}
                    </div>
                  </article>
                </Link>
              )
            })}
          </div >
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
        )
        }

        {/* ページネーション（検索モードでは表示しない） */}
        {
          !isSearchMode && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              hasNextPage={hasNextPage}
              hasPrevPage={hasPrevPage}
              baseUrl="/posts"
            />
          )
        }

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
      </div >

      <Footer />
    </>
  )
}
