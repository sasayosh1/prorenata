import { Suspense } from 'react'
import { getAllPosts, type Post } from '@/lib/sanity'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import HomeSearch from '@/components/HomeSearch'
import HomePopularGrid from '@/components/HomePopularGrid'
import { sanitizeTitle } from '@/lib/title'

export const dynamic = 'auto'
export const revalidate = 3600
export const fetchCache = 'default-cache'
export const runtime = 'nodejs'

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
                ProReNata編集部による客観的で実践的なガイド。
              </p>
              <div className="mt-8 sm:mx-auto sm:max-w-lg sm:flex sm:justify-center lg:mx-0">
                <div className="mt-3 sm:mt-0">
                  <Link
                    href="/posts"
                    className="block w-full rounded-md bg-cyan-600 px-8 py-3 text-base font-medium text-white shadow hover:bg-cyan-700 transition-colors duration-200"
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
              <div
                className="relative mx-auto w-full rounded-lg shadow-lg overflow-hidden bg-cover bg-center"
                style={{ backgroundImage: "url('/hero-banner.png')" }}
              >
                <Image
                  className="w-full h-auto object-cover"
                  src="/hero-image.png"
                  alt="看護助手サポート"
                  width={1200}
                  height={900}
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
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

          {/* Latest Section (Focus on content) */}
          <div className="mb-16">
            <section className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm max-w-4xl mx-auto">
              <div className="flex items-center justify-between gap-3 mb-8">
                <h2 className="text-2xl font-bold text-gray-900">最新の記事</h2>
                <Link
                  href="/posts"
                  className="text-cyan-700 hover:text-cyan-800 text-sm font-semibold"
                >
                  一覧を見る →
                </Link>
              </div>

              {recentPosts.length > 0 ? (
                <ul className="space-y-1 divide-y divide-gray-50">
                  {recentPosts
                    .filter((post) => post.slug?.current)
                    .slice(0, 5)
                    .map((post) => {
                      const displayTitle = sanitizeTitle(post.title)
                      const publishedDate = post.publishedAt || post._createdAt
                      const label = publishedDate ? new Date(publishedDate).toLocaleDateString('ja-JP') : ''
                      const category =
                        post.categories && post.categories.length > 0 ? post.categories[0]?.title || '' : ''

                      return (
                        <li key={post._id}>
                          <Link
                            href={`/posts/${post.slug.current}`}
                            className="block py-4 group transition-all duration-200"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <div className="text-lg font-bold text-gray-900 group-hover:text-cyan-700 transition-colors line-clamp-1">
                                  {displayTitle}
                                </div>
                                {category && (
                                  <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-cyan-50 text-cyan-700">
                                    {category}
                                  </div>
                                )}
                              </div>
                              {label && (
                                <time className="text-sm text-gray-400 shrink-0 font-medium" dateTime={publishedDate || undefined}>
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
                <div className="py-12 text-center text-gray-500 italic">記事を準備しています…</div>
              )}
            </section>
          </div>

          {/* Popular posts (GSC/GA4 + revenue-aware) */}
          <Suspense fallback={null}>
            <HomePopularGrid limit={9} />
          </Suspense>
        </main>
      </div>

      <Footer />
    </>
  )
}
