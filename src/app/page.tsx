import { getAllPosts, type Post } from '@/lib/sanity'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import HomeSearch from '@/components/HomeSearch'
import HomePopularGrid from '@/components/HomePopularGrid'
import { sanitizeTitle } from '@/lib/title'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default async function Home() {
  let recentPosts: Post[] = []

  try {
    const posts = await getAllPosts({ limit: 12 })
    recentPosts = posts
  } catch (error) {
    console.error('Failed to load posts:', error)
  }

  return (
    <>
      <Header />

      {/* Hero Section with Modern Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-b from-cyan-50 to-white pb-16 pt-16 sm:pb-24 lg:pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
            <div className="sm:text-center md:mx-auto md:max-w-2xl lg:col-span-6 lg:text-left">
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl">
                <span className="block">ProReNata</span>
                <span className="block text-cyan-600 mt-2 text-3xl sm:text-4xl">看護助手の未来を拓く</span>
              </h1>
              <p className="mt-6 text-base text-gray-600 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl leading-relaxed">
                現場で働くあなたに、確かな情報を。<br className="hidden sm:inline" />
                給与、資格、キャリア、メンタルケアまで、<br className="hidden sm:inline" />
                経験者が語る実践的ガイド。
              </p>
              <div className="mt-8 sm:mx-auto sm:max-w-lg sm:flex sm:justify-center lg:mx-0">
                <div className="mt-3 sm:mt-0">
                  <Link
                    href="/posts"
                    className="block w-full rounded-md bg-cyan-600 px-8 py-3 text-base font-medium text-white shadow hover:bg-cyan-700 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    記事を読む
                  </Link>
                </div>
                <div className="mt-3 sm:ml-3 sm:mt-0">
                  <Link
                    href="/about"
                    className="block w-full rounded-md bg-white px-8 py-3 text-base font-medium text-cyan-700 shadow-sm ring-1 ring-inset ring-cyan-200 hover:bg-cyan-50 transition-all duration-200"
                  >
                    ProReNataについて
                  </Link>
                </div>
              </div>
              <p className="mt-4 text-xs text-gray-400">
                ※当サイトはアフィリエイト広告を利用しています
              </p>
            </div>
            <div className="relative mt-12 sm:mx-auto sm:max-w-lg lg:col-span-6 lg:mx-0 lg:mt-0 lg:flex lg:max-w-none lg:items-center">
              <div className="relative mx-auto w-full rounded-lg shadow-lg overflow-hidden transform transition-transform hover:scale-105 duration-500">
                <Image
                  className="w-full h-auto object-cover"
                  src="/hero-image.png"
                  alt="看護助手サポート"
                  width={1200}
                  height={900}
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Content */}
        <main>
          {/* Search Section */}
          <div className="py-8 max-w-3xl mx-auto">
            <HomeSearch />
          </div>

          {/* Latest + Quiz (UX first) */}
          <div className="mb-16 grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Latest posts: text-only */}
            <section className="lg:col-span-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-xl font-bold text-gray-900">最新記事</h2>
                <Link href="/posts" className="text-cyan-700 hover:text-cyan-800 text-sm font-semibold">
                  すべて見る →
                </Link>
              </div>

              {recentPosts.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {recentPosts
                    .filter((post) => post.slug?.current)
                    .slice(0, 10)
                    .map((post) => {
                      const displayTitle = sanitizeTitle(post.title)
                      const publishedDate = post.publishedAt || post._createdAt
                      const label = publishedDate ? new Date(publishedDate).toLocaleDateString('ja-JP') : ''
                      const category =
                        post.categories && post.categories.length > 0 ? post.categories[0]?.title || '' : ''

                      return (
                        <li key={post._id}>
                          <Link href={`/posts/${post.slug.current}`} className="block py-3 group">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-gray-900 group-hover:text-cyan-700 transition-colors line-clamp-2">
                                  {displayTitle}
                                </div>
                                {category && <div className="mt-1 text-xs text-gray-500">{category}</div>}
                              </div>
                              {label && (
                                <time className="text-xs text-gray-400 shrink-0" dateTime={publishedDate || undefined}>
                                  {label}
                                </time>
                              )}
                            </div>
                          </Link>
                        </li>
                      )
                    })}
                </ul>
              ) : (
                <div className="text-sm text-gray-500">記事を読み込んでいます…</div>
              )}
            </section>

            {/* Medical quiz promo */}
            <section className="lg:col-span-4">
              <Link href="/quiz" className="block group h-full">
                <div className="h-full relative overflow-hidden bg-gradient-to-br from-cyan-600 to-blue-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="absolute top-0 right-0 -mr-24 -mt-24 w-72 h-72 rounded-full bg-white opacity-10 blur-3xl group-hover:opacity-20 transition-opacity duration-500"></div>
                  <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-72 h-72 rounded-full bg-white opacity-10 blur-3xl group-hover:opacity-20 transition-opacity duration-500"></div>

                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 bg-white/20 p-3 rounded-full backdrop-blur-sm">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div className="text-white">
                        <div className="text-sm font-semibold opacity-90">毎日3分で</div>
                        <h3 className="text-xl font-bold">メディカルクイズ</h3>
                      </div>
                    </div>

                    <p className="mt-4 text-cyan-50 opacity-95 leading-relaxed">
                      現場でよく見る医療用語を、3択でサクッと確認。
                      <br />
                      ちょっとした自信が、明日の余裕につながります。
                    </p>

                    <div className="mt-auto pt-6">
                      <span className="inline-block w-full text-center px-5 py-3 bg-white text-cyan-700 font-bold rounded-full shadow-lg hover:bg-cyan-50 transition-colors">
                        今すぐ挑戦する →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </section>
          </div>

          {/* Popular posts (GSC/GA4 + revenue-aware) */}
          <HomePopularGrid limit={9} />
        </main>
      </div>

      <Footer />
    </>
  )
}
