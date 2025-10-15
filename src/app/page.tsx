import { getAllPosts, type Post, formatPostDate } from '@/lib/sanity'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import PopularPosts from '@/components/PopularPosts'
import HomeSearch from '@/components/HomeSearch'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default async function Home() {
  let recentPosts: Post[] = []
  
  try {
    const posts = await getAllPosts({ limit: 3 }) // 最新3記事のみ取得
    recentPosts = posts
  } catch (error) {
    console.error('Failed to load posts:', error)
  }
  
  return (
    <>
      <Header />

      {/* Full-width Hero Image */}
      <div className="mb-16 flex justify-center">
        <img
          src="/hero-image.png"
          alt="看護助手サポート"
          className="h-auto max-h-96 object-contain"
          style={{ maxWidth: '800px', width: '100%' }}
        />
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 xl:max-w-5xl xl:px-0">
        {/* Main Content */}
        <main>
          {/* Title Section */}
          <div className="text-center pb-16">
            <h1 className="text-4xl font-extrabold leading-9 tracking-tight text-gray-900 sm:text-5xl sm:leading-10 md:text-6xl md:leading-14">
              ProReNata
            </h1>
          </div>

          {/* Site Description */}
          <div className="pb-12 text-center">
            <p className="text-lg leading-8 text-gray-600">
              看護助手の皆様をサポートする専門情報サイト
            </p>
            <p className="mt-4 text-xs text-gray-500">
              ※このサイトはアフィリエイト広告（Amazonアソシエイト含む）を掲載しています
            </p>
          </div>

          {/* Search Section */}
          <HomeSearch />

          {/* Blog Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold leading-8 tracking-tight text-gray-900 mb-6">
              最新記事
            </h2>

            {/* Recent Posts */}
            {recentPosts.length > 0 ? (
              <div className="space-y-6">
                {recentPosts.map((post) => {
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
                              {post.categories.slice(0, 3).map((category, index) => {
                                const label = typeof category === 'string' ? category : String(category)
                                return (
                                <span
                                  key={`${post._id}-category-${index}`}
                                  className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                                >
                                  {label}
                                </span>
                                )
                              })}
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
                <h3 className="text-lg font-medium text-gray-900 mb-1">記事を読み込んでいます</h3>
                <p className="text-gray-500">
                  しばらくお待ちください。
                </p>
              </div>
            )}
          </div>

          {/* 記事一覧へのリンク */}
          <div className="text-center mb-12">
            <Link
              href="/posts"
              className="text-cyan-600 hover:text-cyan-700 font-medium"
            >
              記事一覧 →
            </Link>
          </div>

          {/* 人気記事ランキング */}
          <PopularPosts limit={3} />
        </main>
      </div>

      <Footer />
    </>
  )
}
