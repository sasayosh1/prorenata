import { getAllPosts, type Post } from '@/lib/sanity'

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
    <div className="bg-gray-50 min-h-screen">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-800">
            🎉 ProReNata
          </h1>
          <p className="text-gray-500 mt-2">
            必要に応じて、その都度
          </p>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          
          {/* ヒーロー */}
          <section className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-800 mb-4">
              Welcome to ProReNata
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              必要に応じて、その都度。状況に応じた最適な情報をお届けします。
            </p>
          </section>

          {/* ステータス */}
          <div className={`border-2 rounded-lg p-6 mb-12 ${sanityConnected ? 'bg-green-50 border-green-600' : 'bg-yellow-50 border-yellow-500'}`}>
            <h3 className={`text-2xl font-bold mb-6 ${sanityConnected ? 'text-green-800' : 'text-yellow-800'}`}>
              🔍 システム状況確認
            </h3>
            <div className="grid gap-3 text-sm">
              <p className={`${sanityConnected ? 'text-green-700' : 'text-yellow-700'}`}>
                🕐 現在時刻: {timestamp}
              </p>
              <p className={`${sanityConnected ? 'text-green-700' : 'text-yellow-700'}`}>
                🔢 ビルドID: {buildId}
              </p>
              <p className={`${sanityConnected ? 'text-green-700' : 'text-yellow-700'}`}>
                📊 Sanity CMS: {sanityConnected ? `✅ 接続成功 (${posts.length}件)` : '❌ 接続エラー'}
              </p>
              <p className={`${sanityConnected ? 'text-green-700' : 'text-yellow-700'}`}>
                🚀 Vercel: ✅ デプロイ成功
              </p>
              <p className={`${sanityConnected ? 'text-green-700' : 'text-yellow-700'}`}>
                🔄 キャッシュ: ✅ 完全無効化
              </p>
            </div>
            {errorMessage && (
              <p className="text-red-600 mt-4">
                エラー: {errorMessage}
              </p>
            )}
          </div>

          {/* 記事一覧 */}
          <section>
            <h3 className="text-3xl font-bold text-gray-800 mb-8 text-center">
              📰 最新記事 ({sanityConnected ? `${posts.length}件のSanity記事` : 'テスト記事'})
            </h3>
            
            {sanityConnected ? (
              <div className="grid gap-8">
                {posts.map((post) => (
                  <article key={post._id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                    <div className="mb-4">
                      <span className="bg-green-100 text-green-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">
                        ✅ Sanity CMS
                      </span>
                    </div>
                    
                    <h4 className="text-2xl font-bold text-gray-800 mb-4">
                      📰 {post.title}
                    </h4>
                    
                    {post.excerpt && (
                      <p className="text-gray-600 leading-relaxed mb-6">
                        {post.excerpt}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-6">
                      <span>📅 {new Date(post.publishedAt).toLocaleDateString('ja-JP')}</span>
                      <span>🔗 {post.slug.current}</span>
                    </div>

                    <a 
                      href={`/blog/${post.slug.current}`}
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 font-bold"
                    >
                      続きを読む →
                    </a>
                  </article>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                <article className="bg-white rounded-lg shadow-md p-6">
                  <h4 className="text-xl font-bold text-gray-800 mb-2">
                    🎊 ProReNataへようこそ
                  </h4>
                  <p className="text-gray-600 mb-4">
                    新しいブログサイトProReNataが正式に開設されました！
                  </p>
                  <p className="text-sm text-gray-400">
                    📅 2025年7月29日
                  </p>
                </article>
                
                <article className="bg-white rounded-lg shadow-md p-6">
                  <h4 className="text-xl font-bold text-gray-800 mb-2">
                    🛠️ サイト構築について
                  </h4>
                  <p className="text-gray-600 mb-4">
                    Next.js + Sanity CMS + Vercelで構築しました。
                  </p>
                  <p className="text-sm text-gray-400">
                    📅 2025年7月29日
                  </p>
                </article>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-gray-800 text-white text-center py-8 mt-16">
        <div className="max-w-4xl mx-auto px-4">
          <p>© 2025 ProReNata. All rights reserved.</p>
          <p className="text-sm text-gray-400 mt-2">
            更新: {timestamp} | Build: {buildId}
          </p>
        </div>
      </footer>
    </div>
  );
}