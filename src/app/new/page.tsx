import { getAllPosts, type Post, formatPostDate } from '@/lib/sanity'

// 完全にキャッシュを無効化
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NewPage() {
  let posts: Post[] = []
  let errorMessage = ''
  
  try {
    console.log('🔍 Fetching posts from Sanity...')
    posts = await getAllPosts()
    console.log('✅ Posts fetched:', posts.length)
    console.log('📄 First post:', posts[0])
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Posts fetch error:', error)
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Pro Re Nata - 新しいページ
          </h1>
          <p className="text-gray-600 mt-2">
            必要に応じて、その都度
          </p>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto py-12 px-4">
        {/* ステータス表示 */}
        <div className="mb-8 p-6 bg-blue-100 border-2 border-blue-300 rounded-lg">
          <h3 className="text-xl font-bold text-blue-800 mb-4">🔍 Sanity接続テスト</h3>
          <div className="space-y-2 text-blue-700">
            <p>🕐 現在時刻: {currentTime}</p>
            <p>📊 取得した記事数: {posts.length}件</p>
            {errorMessage && (
              <p className="text-red-600">❌ エラー: {errorMessage}</p>
            )}
          </div>
        </div>

        {/* 記事一覧 */}
        <section>
          <h3 className="text-2xl font-bold text-gray-900 mb-8">
            Sanityから取得した記事 ({posts.length}件)
          </h3>
          
          {posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map((post) => (
                <article key={post._id} className="bg-white rounded-lg shadow-md p-6">
                  <h4 className="text-xl font-semibold mb-3 text-gray-800">
                    📝 {post.title}
                  </h4>
                  
                  {post.excerpt && (
                    <p className="text-gray-600 mb-4">
                      {post.excerpt}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <p>📅 公開日: {formatPostDate(post).label}</p>
                    <p>🔗 スラッグ: {post.slug.current}</p>
                    <p>🆔 ID: {post._id}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-6">
              <h4 className="text-xl font-semibold text-yellow-800 mb-4">
                ⚠️ 記事が見つかりません
              </h4>
              <p className="text-yellow-700">
                Sanity Studioで作成した記事が取得できていません。
              </p>
              {errorMessage && (
                <p className="text-red-600 mt-2">
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
          <p>&copy; 2025 Pro Re Nata. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
