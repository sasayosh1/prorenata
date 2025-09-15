import { getAllPosts, type Post } from '@/lib/sanity'
import Link from 'next/link'
import Header from '@/components/Header'

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
          className="w-full h-96 object-contain bg-gray-50"
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

          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="py-12">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* サイト情報 */}
                <div className="md:col-span-1">
                  <div className="flex items-center">
                    <div className="text-xl font-semibold text-gray-900">
                      ProReNata
                    </div>
                  </div>
                  <div className="mt-6 flex space-x-4">
                    <a
                      href="mailto:info@prorenata.jp"
                      className="text-gray-400 hover:text-cyan-600 transition-colors duration-200"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                      </svg>
                    </a>
                    <a
                      href="https://twitter.com/prorenata_jp"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-cyan-600 transition-colors duration-200"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
                      </svg>
                    </a>
                  </div>
                </div>

                {/* サイトマップ */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                    サイトマップ
                  </h3>
                  <ul className="mt-4 space-y-2">
                    <li>
                      <Link href="/" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors duration-200">
                        ホーム
                      </Link>
                    </li>
                    <li>
                      <Link href="/blog" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors duration-200">
                        ブログ
                      </Link>
                    </li>
                    <li>
                      <Link href="/tags" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors duration-200">
                        タグ
                      </Link>
                    </li>
                    <li>
                      <Link href="/about" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors duration-200">
                        About
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* カテゴリー */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                    カテゴリー
                  </h3>
                  <ul className="mt-4 space-y-2">
                    <li>
                      <Link href="/blog?category=基礎知識・入門" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors duration-200">
                        基礎知識・入門
                      </Link>
                    </li>
                    <li>
                      <Link href="/blog?category=実務・ノウハウ" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors duration-200">
                        実務・ノウハウ
                      </Link>
                    </li>
                    <li>
                      <Link href="/blog?category=キャリア・資格" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors duration-200">
                        キャリア・資格
                      </Link>
                    </li>
                    <li>
                      <Link href="/blog?category=給与・待遇" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors duration-200">
                        給与・待遇
                      </Link>
                    </li>
                    <li>
                      <Link href="/blog?category=悩み・相談" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors duration-200">
                        悩み・相談
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* サポート */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                    サポート
                  </h3>
                  <ul className="mt-4 space-y-2">
                    <li>
                      <Link href="/contact" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors duration-200">
                        お問い合わせ
                      </Link>
                    </li>
                    <li>
                      <Link href="/privacy" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors duration-200">
                        プライバシーポリシー
                      </Link>
                    </li>
                    <li>
                      <Link href="/terms" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors duration-200">
                        利用規約
                      </Link>
                    </li>
                    <li>
                      <Link href="/sitemap" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors duration-200">
                        サイトマップ
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              {/* 下部のコピーライト */}
              <div className="border-t border-gray-200 pt-8 mt-8">
                <div className="flex justify-center items-center">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>© {new Date().getFullYear()} ProReNata.</span>
                    <span>All rights reserved.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
    </>
  )
}