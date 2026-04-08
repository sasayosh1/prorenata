import { Suspense } from 'react'
import Image from 'next/image'
import { getAllPosts, type Post } from '@/lib/sanity'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import HomeSearch from '@/components/HomeSearch'
import HomePopularGrid from '@/components/HomePopularGrid'
import { sanitizeTitle } from '@/lib/title'
import NewsletterForm from '@/components/NewsletterForm'

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

      {/* Hero Section: Minimalist & Stylish */}
      <div className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-white dark:bg-gray-950">
        {/* Background Layer: Glassmorphism & Subtle Gradients */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-cyan-100/20 via-transparent to-transparent dark:from-cyan-900/10 transition-opacity duration-1000" />
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/hero-bg-near-future.png')] bg-cover bg-center opacity-30 dark:opacity-50 mix-blend-soft-light" />
          <div className="absolute inset-0 backdrop-blur-[2px]" />
        </div>

        <div className="relative z-10 w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <h1 className="text-6xl font-thin tracking-widest text-gray-900 dark:text-white sm:text-7xl md:text-8xl lg:text-9xl mb-6 font-[family-name:var(--font-raleway)]">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-cyan-800 to-gray-900 dark:from-white dark:via-cyan-400 dark:to-white">
                ProReNata
              </span>
            </h1>
            
            <p className="mt-6 text-sm sm:text-base md:text-xl text-gray-600 dark:text-gray-300 font-medium tracking-tight max-w-4xl mx-auto leading-tight whitespace-nowrap">
              看護助手の日常に小さな救済と確かなガイドを
            </p>


            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                href="#newsletter"
                className="group relative px-10 py-5 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-full font-black text-xl shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                メルマガを購読する
              </Link>
            </div>
            
            <p className="mt-12 text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest opacity-60">
              Curated by Sera Shirasaki
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 bg-gray-50/50 dark:bg-gray-950/50">
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
                  className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-8 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 ${topic.color} opacity-5 -mr-8 -mt-8 rounded-full group-hover:scale-150 transition-transform duration-500`} />
                  <h3 className="text-xl font-extrabold text-gray-800 dark:text-gray-100 mb-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{topic.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">{topic.desc}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* Latest Section */}
          <div className="mb-20">
            <section className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-10 shadow-sm max-w-5xl mx-auto">
              <div className="flex items-center justify-between gap-3 mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-cyan-600 dark:bg-cyan-500 rounded-full" />
                  <h2 className="text-3xl font-black text-gray-800 dark:text-gray-100">最新の記事</h2>
                </div>
                <Link
                  href="/posts"
                  className="group flex items-center gap-1 text-cyan-700 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300 text-sm font-bold"
                >
                  一覧を見る 
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>

              {recentPosts.length > 0 ? (
                <ul className="space-y-1 divide-y divide-gray-100 dark:divide-gray-800">
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
                                <div className="text-xl font-bold text-gray-800 dark:text-gray-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-1">
                                  {displayTitle}
                                </div>
                                {category && (
                                  <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-cyan-50 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-800">
                                    {category}
                                  </div>
                                )}
                              </div>
                              {label && (
                                <time className="text-sm text-gray-400 dark:text-gray-500 shrink-0 font-bold" dateTime={publishedDate || undefined}>
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

          {/* LINEスタンプ & note バナー */}
          <section className="mb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LINEスタンプバナー */}
              <a
                href="https://store.line.me/stickershop/product/33372767/ja"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ aspectRatio: '640/280' }}
              >
                <div className="relative w-full h-full">
                  <Image
                    src="/line-stamp-banner.png"
                    alt="「白崎セラ」LINEスタンプ、できました。LINE STOREで見る"
                    fill
                    className="object-cover"
                  />
                </div>
              </a>

              {/* noteバナー */}
              <a
                href="https://note.com/prorenata"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] bg-[#41C9B4]"
                style={{ aspectRatio: '640/280' }}
              >
                <div className="flex items-stretch w-full h-full">
                  <div className="relative w-2/5 shrink-0 overflow-hidden">
                    <Image
                      src="/sera-note-convenience.png"
                      alt="白崎セラ"
                      fill
                      className="object-cover"
                      style={{ objectPosition: '50% 15%' }}
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-center gap-2 px-5 py-5 text-white">
                    <div className="text-[10px] font-black tracking-widest opacity-80">Sera&apos;s Note</div>
                    <p className="text-base font-black leading-snug">
                      看護助手の<br />リアルを、noteで。
                    </p>
                    <p className="hidden md:block text-[11px] leading-relaxed opacity-90">
                      日常・葛藤・小さな喜びを<br />等身大の言葉で綴っています。
                    </p>
                    <span className="inline-flex items-center gap-1.5 bg-white text-[#41C9B4] text-[11px] font-black px-3 py-1.5 rounded-full self-start">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.8 2H6.2C3.9 2 2 3.9 2 6.2v11.6C2 20.1 3.9 22 6.2 22h11.6c2.3 0 4.2-1.9 4.2-4.2V6.2C22 3.9 20.1 2 17.8 2zM15 17.5h-1.5v-7h-1.5v7H10.5v-7c0-0.8 0.7-1.5 1.5-1.5h1.5c0.8 0 1.5 0.7 1.5 1.5v7z" />
                      </svg>
                      noteで読む →
                    </span>
                  </div>
                </div>
              </a>
            </div>
          </section>

          {/* メルマガ登録フォーム */}
          <section id="newsletter" className="mb-32">
            <NewsletterForm />
          </section>

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
