import { getAllPosts, type Post, formatPostDate, urlFor } from '@/lib/sanity'
import Link from 'next/link'
import Image from 'next/image'
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
    const posts = await getAllPosts({ limit: 6 }) // 最新6記事に増やす（画像が増えて見栄えが良くなるため）
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
                <img
                  className="w-full h-auto object-cover"
                  src="/hero-image.png"
                  alt="看護助手サポート"
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

          {/* Blog Section */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold leading-8 tracking-tight text-gray-900">
                最新記事
              </h2>
              <Link
                href="/posts"
                className="text-cyan-600 hover:text-cyan-800 font-medium flex items-center gap-1 transition-colors"
              >
                すべて見る <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>

            {/* Recent Posts */}
            {recentPosts.length > 0 ? (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {recentPosts.filter(post => post.slug?.current).map((post) => {
                  const { label } = formatPostDate(post)

                  return (
                    <Link href={`/posts/${post.slug.current}`} key={post._id} className="block h-full">
                      <article className="flex flex-col h-full bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        {/* Image Area */}
                        <div className="h-48 bg-gray-100 relative overflow-hidden group">
                          {post.mainImage ? (
                            <Image
                              src={urlFor(post.mainImage).width(800).height(600).url()}
                              alt={post.title}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-100 to-blue-50 opacity-50 group-hover:scale-105 transition-transform duration-500"></div>
                          )}
                          <div className="absolute bottom-0 left-0 p-4 z-10">
                            {post.categories && post.categories.length > 0 && (
                              <span className="inline-block px-3 py-1 bg-white/90 backdrop-blur-sm text-cyan-700 text-xs font-bold rounded-full shadow-sm">
                                {typeof post.categories[0] === 'string' ? post.categories[0] : post.categories[0]?.title}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 p-6 flex flex-col">
                          <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-cyan-600 transition-colors">
                            {post.title}
                          </h3>

                          {post.excerpt && (
                            <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-1">
                              {post.excerpt}
                            </p>
                          )}

                          <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                            <time dateTime={post.publishedAt || post._createdAt}>
                              {label}
                            </time>
                            <span className="text-cyan-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                              続きを読む
                            </span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
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

          {/* 医療用語クイズセクション */}
          <div className="mb-20">
            <Link href="/quiz" className="block group">
              <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl group-hover:opacity-20 transition-opacity duration-500"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl group-hover:opacity-20 transition-opacity duration-500"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-shrink-0 bg-white/20 p-4 rounded-full backdrop-blur-sm">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-center md:text-left text-white">
                    <h3 className="text-2xl font-bold mb-3">
                      医療用語クイズでスキルアップ
                    </h3>
                    <p className="text-cyan-50 text-lg opacity-90">
                      現場で役立つ知識を、3択クイズで楽しくマスター。
                      <br className="hidden md:inline" />毎日の積み重ねが、あなたの自信になります。
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="inline-block px-6 py-3 bg-white text-cyan-700 font-bold rounded-full shadow-lg hover:bg-cyan-50 transition-colors">
                      今すぐ挑戦する &rarr;
                    </span>
                  </div>
                </div>
              </div>
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
