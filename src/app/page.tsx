import { getAllPosts, type Post } from '@/lib/sanity'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default async function Home() {
  let recentPosts: Post[] = []
  
  try {
    const posts = await getAllPosts()
    recentPosts = posts.slice(0, 3) // 最新3記事のみ表示
  } catch (error) {
    console.error('Failed to load posts:', error)
  }
  
  return (
    <>
      <Header />

      {/* Full-width Hero Image */}
      <div className="mb-16">
        <img
          src="/hero-image.png"
          alt="看護助手サポート"
          className="w-full h-96 object-contain"
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

          <div className="divide-y divide-gray-200">
            {/* Site Description */}
            <div className="pb-8 pt-6 text-center">
              <p className="text-lg leading-8 text-gray-600">
                看護助手の皆様をサポートする専門情報サイト
              </p>
              <p className="mt-2 text-sm text-gray-500">
                現場で役立つ実践的な知識とキャリア情報をお届けします
              </p>
            </div>

            {/* Blog Section */}
            <div className="pb-8 pt-6">
              <h2 className="text-2xl font-bold leading-8 tracking-tight text-gray-900">
                最新記事
              </h2>
            </div>
            
            {/* Recent Posts */}
            <ul className="divide-y divide-gray-200">
              {recentPosts.length > 0 ? (
                recentPosts.map((post) => (
                  <li key={post._id} className="py-8">
                    <article>
                      <div className="space-y-2 xl:grid xl:grid-cols-4 xl:items-baseline xl:space-y-0">
                        <dl>
                          <dt className="sr-only">Published on</dt>
                          <dd className="text-base font-medium leading-6 text-gray-500">
                            <time dateTime={post.publishedAt}>
                              {new Date(post.publishedAt).toLocaleDateString('ja-JP', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </time>
                          </dd>
                        </dl>
                        <div className="space-y-3 xl:col-span-3">
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-xl font-bold leading-7 tracking-tight">
                                <Link
                                  href={`/posts/${post.slug.current}`}
                                  className="text-gray-900 hover:text-cyan-600"
                                >
                                  {post.title}
                                </Link>
                              </h3>
                              <div className="flex flex-wrap mt-1">
                                {post.categories && post.categories.map((category, index) => (
                                  <span
                                    key={index}
                                    className="mr-3 text-sm font-medium uppercase text-cyan-600"
                                  >
                                    {typeof category === 'string' ? category : category.title}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="prose max-w-none text-gray-500 text-sm">
                              {post.excerpt}
                            </div>
                          </div>
                          <div className="text-sm font-medium leading-6">
                            <Link
                              href={`/posts/${post.slug.current}`}
                              className="text-cyan-600 hover:text-cyan-700"
                              aria-label={`"${post.title}"を読む`}
                            >
                              続きを読む →
                            </Link>
                          </div>
                        </div>
                      </div>
                    </article>
                  </li>
                ))
              ) : (
                <li className="py-8">
                  <div className="text-center">
                    <p className="text-gray-500">記事を読み込んでいます...</p>
                  </div>
                </li>
              )}
            </ul>

            {/* 記事一覧へのリンク */}
            <div className="pt-8 text-center">
              <Link
                href="/blog"
                className="text-cyan-600 hover:text-cyan-700 font-medium"
              >
                記事一覧 →
              </Link>
            </div>

          </div>
        </main>
      </div>

      <Footer />
    </>
  )
}