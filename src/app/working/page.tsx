import { getAllPosts, type Post, formatPostDate } from '@/lib/sanity'

// 完全にキャッシュを無効化
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function WorkingPage() {
  let posts: Post[] = []
  let errorMessage = ''
  let debugInfo = ''
  
  try {
    console.log('🔍 Fetching posts from Sanity...')
    posts = await getAllPosts()
    console.log('✅ Posts retrieved:', posts.length)
    debugInfo = `✅ 成功: ${posts.length}件の記事を取得しました`
    
    if (posts.length > 0) {
      console.log('📄 First post:', posts[0])
    }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Unknown error'
    debugInfo = `❌ エラー: ${errorMessage}`
    console.error('❌ Error fetching posts:', error)
  }
  
  const currentTime = new Date().toLocaleString('ja-JP', { 
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
  
  const buildTime = Date.now()
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            🎉 ProReNata - 動作確認完了！
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
            ✅ サイトが正常に動作しています！
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Sanity CMS連携とVercelデプロイが成功しました。
          </p>
        </section>

        {/* ステータス表示 */}
        <div className="mb-8 p-6 bg-green-100 border-2 border-green-300 rounded-lg">
          <h3 className="text-xl font-bold text-green-800 mb-4">🔍 Sanity接続テスト結果</h3>
          <div className="space-y-2 text-green-700">
            <p>🕐 現在時刻: {currentTime}</p>
            <p>🔢 ビルドID: {buildTime}</p>
            <p>📊 {debugInfo}</p>
            <p>📝 取得記事数: {posts.length}件</p>
            <p>🚀 ページ: /working (キャッシュ回避)</p>
            {errorMessage && (
              <p className="text-red-600">❌ エラー詳細: {errorMessage}</p>
            )}
          </div>
        </div>

        {/* 記事一覧 */}
        <section>
          <h3 className="text-2xl font-bold text-gray-900 mb-8">
            📰 記事一覧 ({posts.length > 0 ? `${posts.length}件のSanity記事` : 'テスト記事'})
          </h3>
          
          {posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map((post) => (
                <article key={post._id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                  <div className="mb-2">
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      ✅ Sanity CMS
                    </span>
                  </div>
                  
                  <h4 className="text-xl font-semibold mb-3 text-gray-800">
                    📰 {post.title}
                  </h4>
                  
                  {post.excerpt && (
                    <p className="text-gray-600 mb-4">
                      {post.excerpt}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                    <p>📅 公開日: {formatPostDate(post).label}</p>
                    <p>🔗 スラッグ: {post.slug.current}</p>
                    <p>🆔 ID: {post._id.substring(0, 8)}...</p>
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
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-6">
              <h4 className="text-xl font-semibold text-yellow-800 mb-4">
                ⚠️ Sanity記事が見つかりません
              </h4>
              <p className="text-yellow-700 mb-4">
                Sanity Studioで作成した記事が取得できていません。以下をご確認ください：
              </p>
              <ul className="list-disc list-inside text-yellow-700 space-y-1">
                <li>Sanity Studioで記事が「Published」状態になっているか</li>
                <li>publishedAtが設定されているか</li>
                <li>Project ID (72m8vhy2) が正しいか</li>
              </ul>
              {errorMessage && (
                <p className="text-red-600 mt-4">
                  エラー詳細: {errorMessage}
                </p>
              )}
            </div>
          )}
        </section>
      </main>

      {/* フッター */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p>&copy; 2025 ProReNata. All rights reserved.</p>
          <p className="text-sm text-gray-400 mt-2">
            最終更新: {currentTime} | Build: {buildTime}
          </p>
        </div>
      </footer>
    </div>
  );
}
