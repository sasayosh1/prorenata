import { getAllPosts, type Post } from '@/lib/sanity'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default async function BlogPage() {
  let posts: Post[] = []
  
  try {
    posts = await getAllPosts()
  } catch (error) {
    console.error('Failed to load posts:', error)
  }
  
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 xl:max-w-5xl xl:px-0">
      <div className="flex h-screen flex-col justify-between font-sans">
        {/* Header */}
        <header className="flex items-center justify-between py-10">
          <div>
            <Link href="/" aria-label="ProReNata">
              <div className="flex items-center justify-between">
                <div className="mr-3">
                  <div className="text-2xl font-semibold text-gray-900">
                    ProReNata
                  </div>
                </div>
              </div>
            </Link>
          </div>
          <div className="flex items-center space-x-4 leading-5 sm:space-x-6">
            <Link
              href="/blog"
              className="hidden font-medium text-gray-900 hover:text-cyan-600 sm:block"
            >
              ブログ
            </Link>
            <Link
              href="/tags"
              className="hidden font-medium text-gray-900 hover:text-cyan-600 sm:block"
            >
              タグ
            </Link>
            <Link
              href="/about"
              className="hidden font-medium text-gray-900 hover:text-cyan-600 sm:block"
            >
              About
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main>
          <div className="divide-y divide-gray-200">
            <div className="space-y-2 pb-8 pt-6 md:space-y-5">
              <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">
                ブログ
              </h1>
              <p className="text-lg leading-7 text-gray-500">
                看護助手として働く皆様に役立つ情報を定期的にお届けします
              </p>
            </div>
            
            {/* Posts List */}
            <ul className="divide-y divide-gray-200">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <li key={post._id} className="py-12">
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
                        <div className="space-y-5 xl:col-span-3">
                          <div className="space-y-6">
                            <div>
                              <h2 className="text-2xl font-bold leading-8 tracking-tight">
                                <Link
                                  href={`/posts/${post.slug.current}`}
                                  className="text-gray-900 hover:text-cyan-600"
                                >
                                  {post.title}
                                </Link>
                              </h2>
                              <div className="flex flex-wrap">
                                {post.categories && post.categories.map((category, index) => (
                                  <span
                                    key={index}
                                    className="mr-3 text-sm font-medium uppercase text-cyan-600 hover:text-cyan-700"
                                  >
                                    {typeof category === 'string' ? category : category.title}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="prose max-w-none text-gray-500">
                              {post.excerpt}
                            </div>
                          </div>
                          <div className="text-base font-medium leading-6">
                            <Link
                              href={`/posts/${post.slug.current}`}
                              className="text-cyan-600 hover:text-cyan-700"
                              aria-label={`"${post.title}"を読む`}
                            >
                              続きを読む &rarr;
                            </Link>
                          </div>
                        </div>
                      </div>
                    </article>
                  </li>
                ))
              ) : (
                <li className="py-12">
                  <div className="text-center">
                    <p className="text-gray-500">記事を読み込んでいます...</p>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </main>

        {/* Footer */}
        <footer>
          <div className="mt-16 flex flex-col items-center">
            <div className="mb-3 flex space-x-4">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  className="fill-current text-gray-700 hover:text-cyan-600 h-5 w-5"
                >
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                </svg>
              </div>
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="fill-current text-gray-700 hover:text-cyan-600 h-5 w-5"
                >
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
                </svg>
              </div>
            </div>
            <div className="mb-2 flex space-x-2 text-sm text-gray-500">
              <div>{`© ${new Date().getFullYear()}`}</div>
              <div>{` • `}</div>
              <Link href="/">ProReNata</Link>
            </div>
            <div className="mb-8 text-sm text-gray-500">
              看護助手の皆様を応援するブログ
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}