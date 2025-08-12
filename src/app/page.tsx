import { getAllPosts, type Post } from '@/lib/sanity'
import Link from 'next/link'

// 最強のキャッシュ無効化
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default async function Home() {
  let posts: Post[] = []
  let sanityConnected = false
  let errorMessage = ''
  
  try {
    posts = await getAllPosts()
    sanityConnected = posts.length > 0
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Connection error'
  }
  
  const timestamp = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
  const buildId = Date.now()
  
  return (
    <div className="medical-gradient-subtle min-h-screen">
      {/* ヘッダー */}
      <header className="medical-gradient text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="flex items-center gap-3">
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                  </svg>
                  ProReNata
                </span>
              </h1>
              <p className="text-xl text-blue-100 font-medium">
                Pro Re Nata - 必要に応じて、その都度
              </p>
              <p className="text-blue-100 mt-2 max-w-2xl">
                元看護助手が書く、医療現場の体験や日常の日記
              </p>
            </div>
            <div className="hidden md:block">
              <div className="medical-badge medical-badge-light">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                個人ブログ
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </header>

      {/* ナビゲーション */}
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-slate-700 hover:text-blue-600 font-medium transition-colors">
                ホーム
              </Link>
              <Link href="/articles" className="text-slate-700 hover:text-blue-600 font-medium transition-colors">
                記事一覧
              </Link>
              <Link href="/categories" className="text-slate-700 hover:text-blue-600 font-medium transition-colors">
                カテゴリー
              </Link>
              <Link href="/nft" className="text-slate-700 hover:text-blue-600 font-medium transition-colors">
                CNP NFT
              </Link>
              <Link href="/about" className="text-slate-700 hover:text-blue-600 font-medium transition-colors">
                About
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main className="py-12">
        <div className="max-w-6xl mx-auto px-6">
          
          {/* 特徴セクション */}
          <section className="mb-16">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="medical-card p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">体験談</h3>
                <p className="text-slate-600">看護助手として働いた実体験をもとに、医療現場のリアルをお伝えします</p>
              </div>
              
              <div className="medical-card p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">日常のこと</h3>
                <p className="text-slate-600">仕事以外の日常生活や趣味についても気軽に書いています</p>
              </div>
              
              <div className="medical-card p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">趣味</h3>
                <p className="text-slate-600">NFTアートなど、個人的に興味を持っていることも紹介しています</p>
              </div>
            </div>
          </section>

          {/* ステータス（開発用） */}
          {process.env.NODE_ENV === 'development' && (
            <div className={`medical-card p-6 mb-12 ${sanityConnected ? 'border-l-4 border-green-500' : 'border-l-4 border-yellow-500'}`}>
              <h3 className={`text-xl font-bold mb-4 ${sanityConnected ? 'text-green-800' : 'text-yellow-800'}`}>
                システム状況確認（開発モード）
              </h3>
              <div className="grid gap-2 text-sm">
                <p className="text-slate-600">現在時刻: {timestamp}</p>
                <p className="text-slate-600">ビルドID: {buildId}</p>
                <p className={`${sanityConnected ? 'text-green-600' : 'text-yellow-600'}`}>
                  Sanity CMS: {sanityConnected ? `接続成功 (${posts.length}件)` : '接続エラー'}
                </p>
              </div>
              {errorMessage && (
                <p className="text-red-600 mt-4 text-sm">
                  エラー: {errorMessage}
                </p>
              )}
            </div>
          )}

          {/* 記事一覧 */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-slate-800">
                最新の記事
              </h2>
              <span className="medical-badge medical-badge-light">
                {sanityConnected ? `${posts.length}記事` : '準備中'}
              </span>
            </div>
            
            {sanityConnected ? (
              <div className="grid lg:grid-cols-2 gap-8">
                {posts.map((post) => (
                  <article key={post._id} className="medical-card p-6 group">
                    <div className="flex items-center justify-between mb-4">
                      <span className="medical-badge medical-badge-primary">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                        </svg>
                        ブログ記事
                      </span>
                      <time className="text-sm text-slate-500">
                        {new Date(post.publishedAt).toLocaleDateString('ja-JP')}
                      </time>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h3>
                    
                    {post.excerpt && (
                      <p className="text-slate-600 leading-relaxed mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <a 
                        href={`/posts/${post.slug.current}`}
                        className="btn btn-outline text-sm"
                      >
                        記事を読む
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </a>
                      <div className="flex items-center text-xs text-slate-400">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        3分で読める
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-8">
                <article className="medical-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="medical-badge medical-badge-primary">体験談</span>
                    <time className="text-sm text-slate-500">2025年8月12日</time>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-slate-800 mb-3">
                    看護助手として働いた日々を振り返って
                  </h3>
                  
                  <p className="text-slate-600 leading-relaxed mb-4">
                    医療現場で看護助手として働いた実体験をもとに、
                    日々感じたことや学んだことを率直に書いています。
                    同じような立場で働く方の参考になれば嬉しいです。
                  </p>

                  <div className="flex items-center justify-between">
                    <Link href="#" className="btn btn-outline text-sm">
                      記事を読む
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                    <div className="flex items-center text-xs text-slate-400">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      3分で読める
                    </div>
                  </div>
                </article>
                
                <article className="medical-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="medical-badge medical-badge-secondary">日常</span>
                    <time className="text-sm text-slate-500">2025年8月11日</time>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-slate-800 mb-3">
                    疲れた心を癒すNFTアートとの出会い
                  </h3>
                  
                  <p className="text-slate-600 leading-relaxed mb-4">
                    忙しい職場で疲れ果てていた時に出会ったCNP NFT。
                    可愛いキャラクターたちに癒されて、新しい趣味として楽しんでいる話を
                    気軽に書いてみました。
                  </p>

                  <div className="flex items-center justify-between">
                    <Link href="#" className="btn btn-outline text-sm">
                      記事を読む
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                    <div className="flex items-center text-xs text-slate-400">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      5分で読める
                    </div>
                  </div>
                </article>
              </div>
            )}
          </section>

          {/* CTA セクション */}
          <section className="medical-gradient text-white rounded-2xl p-12 mt-16 text-center">
            <h2 className="text-3xl font-bold mb-4">気軽に読める個人ブログです</h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
              看護助手の経験や日常のことを、のんびりと書いています。
              同じような経験をされた方や、医療現場に興味のある方に読んでもらえたら嬉しいです。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/articles" className="btn btn-secondary">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                記事を読む
              </Link>
              <Link href="/nft" className="btn btn-outline bg-white text-blue-600 border-white hover:bg-blue-50">
                趣味のNFTも見る
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-slate-900 text-white py-12 mt-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                </svg>
                <span className="text-2xl font-bold">ProReNata</span>
              </div>
              <p className="text-slate-300 mb-4">
                必要に応じて、その都度。元看護助手が書く個人ブログです。
              </p>
              <p className="text-sm text-slate-400">
                ※このブログは個人的な体験や意見を書いたものです。
                医療に関する判断は、必ず専門医にご相談ください。
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">サイトマップ</h4>
              <ul className="space-y-2 text-slate-300">
                <li><Link href="/" className="hover:text-white transition-colors">ホーム</Link></li>
                <li><Link href="/articles" className="hover:text-white transition-colors">記事一覧</Link></li>
                <li><Link href="/categories" className="hover:text-white transition-colors">カテゴリー</Link></li>
                <li><Link href="/nft" className="hover:text-white transition-colors">CNP NFT</Link></li>
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">お問い合わせ</h4>
              <ul className="space-y-2 text-slate-300">
                <li><Link href="/contact" className="hover:text-white transition-colors">お問い合わせ</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">プライバシーポリシー</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">利用規約</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 mt-8 text-center">
            <p className="text-slate-400">
              © 2025 ProReNata. All rights reserved.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs text-slate-500 mt-2">
                更新: {timestamp} | Build: {buildId}
              </p>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}