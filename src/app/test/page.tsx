// Vercelキャッシュを完全に無効化
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function TestPage() {
  const now = new Date().toLocaleString('ja-JP')
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Pro Re Nata - Test Page
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
            🎉 サイトが正常に動作しています！
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            キャッシュ問題が解決され、リアルタイム更新が可能になりました。
          </p>
        </section>

        {/* ステータス情報 */}
        <section className="mb-16">
          <div className="bg-green-100 border border-green-300 rounded-lg p-6">
            <h3 className="text-xl font-bold text-green-800 mb-4">✅ システム状況</h3>
            <ul className="space-y-2 text-green-700">
              <li>🕒 現在時刻: {now}</li>
              <li>🚀 Vercel デプロイ: 正常</li>
              <li>🔄 キャッシュ: 無効化済み</li>
              <li>⚡ リアルタイム更新: 有効</li>
            </ul>
          </div>
        </section>

        {/* テスト記事一覧 */}
        <section>
          <h3 className="text-2xl font-bold text-gray-900 mb-8">テスト記事</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <h4 className="text-xl font-semibold mb-3 text-gray-800">
                  🎊 Pro Re Nataへようこそ
                </h4>
                
                <p className="text-gray-600 mb-4">
                  新しいブログサイトPro Re Nataが正式に開設されました！技術情報、ライフハック、最新トレンドなど様々なトピックを扱っていきます。
                </p>

                <p className="text-gray-500 text-sm mb-4">
                  📅 2025年7月29日公開
                </p>

                <a
                  href="#"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                >
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
                  🛠️ モダンなサイト構築
                </h4>
                
                <p className="text-gray-600 mb-4">
                  Next.js 15 + Sanity CMS + Vercelの組み合わせで、高速でスケーラブルなモダンブログサイトを構築しました。
                </p>

                <p className="text-gray-500 text-sm mb-4">
                  📅 2025年7月29日公開
                </p>

                <a
                  href="#"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                >
                  続きを読む
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </article>
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p>&copy; 2025 Pro Re Nata. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}