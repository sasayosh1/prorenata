
import { getAllPosts, type Post } from '@/lib/sanity'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SimpleSearch from '@/components/SimpleSearch'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default async function PostsPage() {
  let posts: Post[] = []

  try {
    posts = await getAllPosts()
  } catch (error) {
    console.error('Failed to load posts:', error)
  }

  return (
    <>
      <Header />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 xl:max-w-5xl xl:px-0">
        {/* Main Content */}
        <main>
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 pt-6 pb-4">
            <Link href="/" className="hover:text-cyan-600 transition-colors duration-200">
              ホーム
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-medium">記事一覧</span>
          </nav>

          {/* Title Section */}
          <div className="text-center pb-12">
            <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-5xl md:leading-14">
              記事一覧
            </h1>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              看護助手に関する全ての記事をご覧いただけます
            </p>

            {/* Search Box */}
            <div className="mt-8 flex justify-center">
              <div className="w-full max-w-md">
                <SimpleSearch placeholder="記事を検索..." />
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {/* Posts List */}
            <ul className="divide-y divide-gray-200">
              {posts.length > 0 ? (
                posts.map((post) => (
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
                            {post.excerpt && (
                              <div className="prose max-w-none text-gray-500 text-sm">
                                {post.excerpt}
                              </div>
                            )}
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

            {/* Navigation Buttons */}
            <div className="pt-8 text-center">
              <Link
                href="/"
                className="text-cyan-600 hover:text-cyan-700 font-medium px-6 py-3 rounded-md border border-cyan-200 hover:border-cyan-300 transition-colors duration-200"
                aria-label="ホームに戻る"
              >
                ← ホームに戻る
              </Link>
            </div>

          </div>
        </main>
      </div>

      <Footer />
    </>
  )
}
