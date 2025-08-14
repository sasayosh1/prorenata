import { getAllPosts, type Post } from '@/lib/sanity'
import Link from 'next/link'
import SimpleSearch from '@/components/SimpleSearch'

// 最強のキャッシュ無効化
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default async function Home() {
  let posts: Post[] = []
  let sanityConnected = false
  
  try {
    posts = await getAllPosts()
    sanityConnected = posts.length > 0
  } catch (error) {
    console.error('Failed to load posts:', error)
  }
  
  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ProReNata
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              Pro Re Nata - 必要に応じて、その都度
            </p>
            <p className="text-sm text-gray-500">
              元看護助手が書く、医療現場の体験や日常の日記
            </p>
          </div>
        </div>
      </header>

      {/* ナビゲーション */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center space-x-8 text-sm">
              <Link href="/" className="text-gray-700 hover:text-gray-900 transition-colors">
                ホーム
              </Link>
              <Link href="/articles" className="text-gray-700 hover:text-gray-900 transition-colors">
                記事一覧
              </Link>
              <Link href="/categories" className="text-gray-700 hover:text-gray-900 transition-colors">
                カテゴリー
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-gray-900 transition-colors">
                About
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main className="py-8">
        <div className="max-w-6xl mx-auto px-6">
              
          {/* 簡潔な紹介 */}
          <section className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                ようこそ
              </h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                看護助手として働いた経験や医療現場で学んだことを、率直に書いている個人ブログです。
                同じような立場で働く方々の参考になれば嬉しいです。
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                <Link href="/articles" className="bg-gray-900 text-white px-6 py-2 rounded text-sm hover:bg-gray-700 transition-colors">
                  記事を読む
                </Link>
                <div className="w-full sm:w-80">
                  <SimpleSearch placeholder="記事を検索..." />
                </div>
              </div>
            </div>
          </section>
          
          {/* 記事一覧 */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold text-gray-900">
                最新の記事
              </h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded">
                {sanityConnected ? `${posts.length}記事` : '準備中'}
              </span>
            </div>
            
            {sanityConnected ? (
              <div className="grid-layout">
                {posts.map((post) => (
                  <article key={post._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        ProReNata
                      </span>
                      <time className="text-sm text-gray-500">
                        {new Date(post.publishedAt).toLocaleDateString('ja-JP')}
                      </time>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                      {post.title}
                    </h3>
                    
                    {post.excerpt && (
                      <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-auto">
                      <Link 
                        href={`/posts/${post.slug.current}`}
                        className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                      >
                        記事を読む →
                      </Link>
                      <div className="flex items-center text-xs text-gray-400">
                        約{post.readingTime || 3}分
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <article className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">ProReNata</span>
                    <time className="text-sm text-gray-500">2025年8月12日</time>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    看護助手として働いた日々を振り返って
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed mb-4">
                    医療現場で看護助手として働いた実体験をもとに、
                    日々感じたことや学んだことを率直に書いています。
                    同じような立場で働く方の参考になれば嬉しいです。
                  </p>

                  <div className="flex items-center justify-between">
                    <Link href="#" className="text-gray-600 hover:text-gray-900 text-sm">
                      記事を読む →
                    </Link>
                    <div className="flex items-center text-xs text-gray-400">
                      3分で読める
                    </div>
                  </div>
                </article>
                
                <article className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">ProReNata</span>
                    <time className="text-sm text-gray-500">2025年8月11日</time>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    医療現場で学んだコミュニケーションの大切さ
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed mb-4">
                    患者さんや医療スタッフとのコミュニケーションで学んだこと、
                    今でも心に残っている印象深いエピソードなどを
                    体験談として紹介しています。
                  </p>

                  <div className="flex items-center justify-between">
                    <Link href="#" className="text-gray-600 hover:text-gray-900 text-sm">
                      記事を読む →
                    </Link>
                    <div className="flex items-center text-xs text-gray-400">
                      4分で読める
                    </div>
                  </div>
                </article>
              </div>
            )}
          </section>

              {/* お知らせセクション */}
              <section className="bg-white border border-gray-200 rounded-lg p-6 mt-12">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">このブログについて</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  看護助手として医療現場で働いた経験をもとに、
                  日々の体験や学びを率直に紹介しています。
                  同じような立場で働く方の参考になれば嬉しいです。
                </p>
                <div className="bg-white rounded p-3 border border-gray-200">
                  <p className="text-xs text-gray-500">
                    ※ このブログは個人的な体験や意見を書いたものです。
                    医療に関する判断は、必ず専門医にご相談ください。
                  </p>
                </div>
              </section>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-white border-t border-gray-200 py-12 mt-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">ProReNata</h3>
          <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">
            必要に応じて、その都度。元看護助手が書く個人ブログです。
          </p>
          <div className="flex justify-center space-x-8 text-sm mb-6">
            <Link href="/" className="text-gray-500 hover:text-gray-700">ホーム</Link>
            <Link href="/articles" className="text-gray-500 hover:text-gray-700">記事一覧</Link>
            <Link href="/categories" className="text-gray-500 hover:text-gray-700">カテゴリー</Link>
            <Link href="/about" className="text-gray-500 hover:text-gray-700">About</Link>
          </div>
          <div className="border-t border-gray-200 pt-6">
            <p className="text-xs text-gray-500">
              © 2025 ProReNata. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}