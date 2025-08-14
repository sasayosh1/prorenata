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
    <div className="min-h-screen" style={{background: 'var(--background)'}}>
      {/* ヘッダー */}
      <header className="site-header py-8">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center hero-content">
            <h1 className="heading-primary text-gradient fade-in">
              ProReNata
            </h1>
            <p className="text-lg text-muted mb-2 fade-in" style={{animationDelay: '0.1s'}}>
              Pro Re Nata - 必要に応じて、その都度
            </p>
            <p className="text-sm text-muted fade-in" style={{animationDelay: '0.2s'}}>
              元看護助手が書く、医療現場の体験や日常の日記
            </p>
          </div>
        </div>
      </header>

      {/* ナビゲーション */}
      <nav className="site-header border-t" style={{borderColor: 'var(--border-light)'}}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center space-x-2 text-sm">
              <Link href="/" className="nav-link">
                🏠 ホーム
              </Link>
              <Link href="/articles" className="nav-link">
                📚 記事一覧
              </Link>
              <Link href="/categories" className="nav-link">
                🏷️ カテゴリー
              </Link>
              <Link href="/about" className="nav-link">
                ℹ️ About
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main className="py-8">
        <div className="max-w-4xl mx-auto px-6">
              
          {/* 簡潔な紹介 */}
          <section className="hero-section slide-up">
            <div className="text-center hero-content">
              <h2 className="heading-secondary mb-3">
                ✨ ようこそ
              </h2>
              <p className="text-muted mb-6 max-w-2xl mx-auto">
                看護助手として働いた経験や医療現場で学んだことを、率直に書いている個人ブログです。
                同じような立場で働く方々の参考になれば嬉しいです。
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                <Link href="/articles" className="btn btn-primary">
                  📖 記事を読む
                </Link>
                <div className="w-full sm:w-80">
                  <SimpleSearch placeholder="記事を検索..." />
                </div>
              </div>
            </div>
          </section>
          
    

          {/* 記事一覧 */}
          <section className="fade-in" style={{animationDelay: '0.4s'}}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="heading-secondary">
                📰 最新の記事
              </h2>
              <span className="badge">
                {sanityConnected ? `${posts.length}記事` : '準備中'}
              </span>
            </div>
            
            {sanityConnected ? (
              <div className="space-y-6">
                {posts.map((post, index) => (
                  <article key={post._id} className="card slide-up" style={{animationDelay: `${0.5 + index * 0.1}s`}}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="badge">
                        🩺 ProReNata
                      </span>
                      <time className="text-sm text-muted">
                        {new Date(post.publishedAt).toLocaleDateString('ja-JP')}
                      </time>
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-3" style={{color: 'var(--foreground)'}}>
                      {post.title}
                    </h3>
                    
                    {post.excerpt && (
                      <p className="text-muted leading-relaxed mb-6">
                        {post.excerpt}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <Link 
                        href={`/posts/${post.slug.current}`}
                        className="btn"
                      >
                        📖 記事を読む
                      </Link>
                      <div className="flex items-center text-xs text-muted">
                        ⏱️ 約{post.readingTime || 3}分で読める
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
              <section className="hero-section mt-12 fade-in" style={{animationDelay: '0.8s'}}>
                <div className="hero-content">
                  <h3 className="heading-secondary mb-4">💡 このブログについて</h3>
                  <p className="text-muted leading-relaxed mb-4">
                    看護助手として医療現場で働いた経験をもとに、
                    日々の体験や学びを率直に紹介しています。
                    同じような立場で働く方の参考になれば嬉しいです。
                  </p>
                  <div className="bg-white bg-opacity-60 rounded-lg p-4 border border-white border-opacity-50">
                    <p className="text-xs text-muted">
                      ⚠️ このブログは個人的な体験や意見を書いたものです。
                      医療に関する判断は、必ず専門医にご相談ください。
                    </p>
                  </div>
                </div>
              </section>
        </div>
      </main>

      {/* フッター */}
      <footer className="site-footer py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="fade-in" style={{animationDelay: '1s'}}>
            <h3 className="heading-secondary text-gradient mb-3">ProReNata</h3>
            <p className="text-muted mb-6 max-w-md mx-auto">
              必要に応じて、その都度。元看護助手が書く個人ブログです。
            </p>
            <div className="flex justify-center space-x-6 text-sm mb-6">
              <Link href="/" className="nav-link">🏠 ホーム</Link>
              <Link href="/articles" className="nav-link">📚 記事一覧</Link>
              <Link href="/categories" className="nav-link">🏷️ カテゴリー</Link>
              <Link href="/about" className="nav-link">ℹ️ About</Link>
            </div>
            <div className="border-t pt-6" style={{borderColor: 'var(--border-light)'}}>
              <p className="text-xs text-muted">
                © 2025 ProReNata. All rights reserved. 🩺
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}