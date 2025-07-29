import { getAllPosts, type Post } from '@/lib/sanity'

// 完全にキャッシュを無効化
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Home() {
  let posts: Post[] = []
  let errorMessage = ''
  let debugInfo = ''
  
  try {
    debugInfo = '🔍 Sanityからデータを取得中...'
    posts = await getAllPosts()
    debugInfo = `✅ 成功: ${posts.length}件の記事を取得`
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Unknown error'
    debugInfo = `❌ エラー: ${errorMessage}`
  }
  
  // 確実に新しいタイムスタンプを生成
  const buildTime = Date.now()
  const currentTime = new Date().toLocaleString('ja-JP', { 
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
  
  return (
    <html lang="ja">
      <head>
        <title>Pro Re Nata - 正常動作確認</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{
          __html: `console.log('Page loaded at: ${currentTime}');`
        }} />
      </head>
      <body className="min-h-screen bg-gray-50">
        {/* ヘッダー */}
        <header className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Pro Re Nata
            </h1>
            <p className="text-gray-600 mt-2">
              必要に応じて、その都度
            </p>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="max-w-6xl mx-auto py-12 px-4">
          {/* ヒーローセクション */}
          <section className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              🎉 サイトが正常に動作中！
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              キャッシュ問題を解決し、リアルタイム更新を実現しました。
            </p>
          </section>

          {/* ステータス表示 */}
          <div className="mb-8 p-6 bg-blue-100 border-2 border-blue-300 rounded-lg">
            <h3 className="text-xl font-bold text-blue-800 mb-4">🔍 Sanity接続テスト結果</h3>
            <div className="space-y-2 text-blue-700">
              <p>🕐 表示時刻: {currentTime}</p>
              <p>🔢 ビルドID: {buildTime}</p>
              <p>📊 {debugInfo}</p>
              <p>📝 取得記事数: {posts.length}件</p>
              {errorMessage && (
                <p className="text-red-600">❌ エラー詳細: {errorMessage}</p>
              )}
            </div>
          </div>

          {/* 記事一覧 */}
          <section>
            <h3 className="text-2xl font-bold text-gray-900 mb-8">
              記事一覧 ({posts.length > 0 ? `${posts.length}件のSanity記事` : 'テスト記事'})
            </h3>
            
            {posts.length > 0 ? (
              <div className="space-y-6">
                {posts.map((post) => (
                  <article key={post._id} className="bg-white rounded-lg shadow-md p-6">
                    <h4 className="text-xl font-semibold mb-3 text-gray-800">
                      📰 {post.title}
                    </h4>
                    
                    {post.excerpt && (
                      <p className="text-gray-600 mb-4">
                        {post.excerpt}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                      <p>📅 {new Date(post.publishedAt).toLocaleDateString('ja-JP')}</p>
                      <p>🔗 {post.slug.current}</p>
                    </div>

                    <a href={`/blog/${post.slug.current}`} className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
                      続きを読む
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </article>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <h4 className="text-xl font-semibold mb-3 text-gray-800">
                      🎊 Pro Re Nataへようこそ (テスト記事)
                    </h4>
                    
                    <p className="text-gray-600 mb-4">
                      新しいブログサイトPro Re Nataが正式に開設されました！技術情報、ライフハック、最新トレンドなど様々なトピックを扱っていきます。
                    </p>

                    <p className="text-gray-500 text-sm mb-4">
                      📅 公開日: 2025年7月29日
                    </p>

                    <a href="#" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
                      続きを読む
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                </article>
                
                <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <h4 className="text-xl font-semibold mb-3 text-gray-800">
                      🛠️ モダンなサイト構築について (テスト記事)
                    </h4>
                    
                    <p className="text-gray-600 mb-4">
                      Next.js 15 + Sanity CMS + Vercelの組み合わせで、高速でスケーラブルなモダンブログサイトを構築しました。
                    </p>

                    <p className="text-gray-500 text-sm mb-4">
                      📅 公開日: 2025年7月29日
                    </p>

                    <a href="#" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
                      続きを読む
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                </article>
              </div>
            )}
          </section>
        </main>

        {/* フッター */}
        <footer className="bg-gray-900 text-white py-8 mt-16">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p>&copy; 2025 Pro Re Nata. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}