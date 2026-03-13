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

      {/* Hero Section: Centered & Search Integrated */}
      <div className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-white">
        {/* Background Image/Gradient Layer */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-100 via-white to-blue-50 opacity-100" />
          <div className="absolute inset-0 backdrop-blur-[1px] bg-white/20" />
          {/* Future near-future background will go here */}
          {/* <Image src="/hero-bg-near-future.png" alt="" fill className="object-cover opacity-50" priority /> */}
        </div>

        <div className="relative z-10 w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl md:text-7xl lg:text-8xl">
              <span className="block drop-shadow-sm opacity-90">ProReNata</span>
              <span className="block text-cyan-600 mt-4 text-2xl sm:text-3xl md:text-4xl font-bold tracking-wide">
                看護助手の未来を拓く
              </span>
            </h1>
            <p className="mt-8 text-lg text-gray-600 sm:text-xl md:text-2xl leading-relaxed max-w-3xl mx-auto">
              現場で働くあなたに、確かな情報を。給与、資格、キャリア、メンタルケアまで、編集部による客観的なガイド。
            </p>

            {/* Integrated Search in Hero */}
            <div className="mt-12 max-w-2xl mx-auto">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative">
                  <HomeSearch />
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/posts"
                className="rounded-full bg-cyan-600 px-10 py-4 text-lg font-bold text-white shadow-xl hover:bg-cyan-700 hover:scale-105 active:scale-95 transition-all duration-200"
              >
                記事を読む
              </Link>
              <Link
                href="/about"
                className="rounded-full bg-white/70 backdrop-blur-md px-10 py-4 text-lg font-bold text-cyan-700 shadow-lg ring-1 ring-cyan-200 hover:bg-white hover:scale-105 active:scale-95 transition-all duration-200"
              >
                ProReNataについて
              </Link>
            </div>
            
            <p className="mt-10 text-xs text-gray-400 font-medium">
              ※当サイトはアフィリエイト広告を利用しています
            </p>
          </div>
        </div>
      </div>

      {/* Trust Ribbon: Authority Bar */}
      <div className="bg-cyan-700 py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-white text-sm font-bold tracking-widest uppercase">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-300 animate-pulse" />
              ProReNata編集部 監修
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-300 animate-pulse" />
              最新キャリアデータ
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-300 animate-pulse" />
              現場視点のガイド
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 bg-gray-50/50">
        {/* Main Content */}
        <main className="py-16">
          
          {/* Key Topics Grid (NEW) */}
          <section className="mb-20">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: '給料・待遇', desc: '全国の相場・比較', color: 'bg-blue-500', href: '/tags/給料' },
                { title: '資格・キャリア', desc: 'ステップアップ術', color: 'bg-cyan-500', href: '/tags/資格' },
                { title: 'メンタルケア', desc: '夜勤・人間関係', color: 'bg-teal-500', href: '/tags/メンタルケア' },
                { title: '退職・転職', desc: '円満な次の一歩', color: 'bg-indigo-500', href: '/tags/退職' }
              ].map((topic) => (
                <Link 
                  key={topic.title} 
                  href={topic.href}
                  className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 ${topic.color} opacity-5 -mr-8 -mt-8 rounded-full group-hover:scale-150 transition-transform duration-500`} />
                  <h3 className="text-xl font-extrabold text-gray-900 mb-2 group-hover:text-cyan-600 transition-colors">{topic.title}</h3>
                  <p className="text-gray-500 font-medium">{topic.desc}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* Latest Section */}
          <div className="mb-20">
            <section className="rounded-2xl border border-gray-100 bg-white p-10 shadow-sm max-w-5xl mx-auto">
              <div className="flex items-center justify-between gap-3 mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-cyan-600 rounded-full" />
                  <h2 className="text-3xl font-black text-gray-900">最新の記事</h2>
                </div>
                <Link
                  href="/posts"
                  className="group flex items-center gap-1 text-cyan-700 hover:text-cyan-800 text-sm font-bold"
                >
                  一覧を見る 
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>

              {recentPosts.length > 0 ? (
                <ul className="space-y-1 divide-y divide-gray-100">
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
                            className="block py-6 group transition-all duration-200"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <div className="text-xl font-bold text-gray-900 group-hover:text-cyan-600 transition-colors line-clamp-1">
                                  {displayTitle}
                                </div>
                                {category && (
                                  <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-cyan-50 text-cyan-700 border border-cyan-100">
                                    {category}
                                  </div>
                                )}
                              </div>
                              {label && (
                                <time className="text-sm text-gray-400 shrink-0 font-bold" dateTime={publishedDate || undefined}>
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
                <div className="py-16 text-center text-gray-400 font-medium italic">記事を準備しています…</div>
              )}
            </section>
          </div>

          {/* Popular posts */}
          <div className="mb-20">
            <Suspense fallback={null}>
              <HomePopularGrid limit={9} />
            </Suspense>
          </div>
        </main>
      </div>

      <Footer />
    </>
  )
}
