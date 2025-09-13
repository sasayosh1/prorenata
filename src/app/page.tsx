import { getAllPosts, type Post } from '@/lib/sanity'
import Link from 'next/link'

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
        <main className="flex-1">
          {/* Hero Section */}
          <div className="text-center pb-16">
            <h1 className="text-4xl font-extrabold leading-9 tracking-tight text-gray-900 sm:text-5xl sm:leading-10 md:text-6xl md:leading-14">
              ProReNata
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-500">
              看護助手として働く皆様を全力でサポート。現場経験豊富な専門家による実践的な情報とアドバイスをお届けします。
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/blog"
                className="rounded-md bg-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
              >
                ブログを読む
              </Link>
              <Link
                href="/about"
                className="text-sm font-semibold leading-6 text-gray-900 hover:text-cyan-600"
              >
                サイトについて <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {/* Blog Section */}
            <div className="pb-8 pt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold leading-8 tracking-tight text-gray-900">
                  最新記事
                </h2>
                <Link
                  href="/blog"
                  className="text-sm font-medium text-cyan-600 hover:text-cyan-700"
                >
                  すべての記事を見る →
                </Link>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                看護助手に役立つ最新情報をお届けします
              </p>
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

            {/* Future Content Sections Placeholder */}
            <div className="py-8">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {/* Services Section (Future) */}
                <div className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50">
                      <svg className="h-6 w-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-900">転職サポート</h3>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    看護助手の転職を専門家がサポート（準備中）
                  </div>
                </div>

                {/* Resources Section (Future) */}
                <div className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50">
                      <svg className="h-6 w-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-900">学習リソース</h3>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    スキルアップに役立つ教材・資料（準備中）
                  </div>
                </div>

                {/* Community Section (Future) */}
                <div className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50">
                      <svg className="h-6 w-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-900">コミュニティ</h3>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    看護助手同士の交流・相談の場（準備中）
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="py-8">
              <div className="rounded-lg bg-cyan-50 px-6 py-8 text-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  看護助手のキャリアを一緒にサポートします
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  現場で役立つ情報から転職相談まで、あなたの成長を応援します
                </p>
                <div className="mt-6">
                  <Link
                    href="/blog"
                    className="rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500"
                  >
                    最新記事をチェック
                  </Link>
                </div>
              </div>
            </div>
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
            <div className="mb-8 flex space-x-2 text-sm text-gray-500">
              <div>{`© ${new Date().getFullYear()}`}</div>
              <div>{` • `}</div>
              <Link href="/">ProReNata</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}