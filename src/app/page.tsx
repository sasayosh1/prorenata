// Vercelキャッシュを無効化
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function Home() {
  const timestamp = new Date().toISOString()
  
  return (
    <div className="min-h-screen bg-gray-50">
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
            Welcome to Pro Re Nata
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            必要に応じて、その都度。状況に応じた最適な情報をお届けします。
          </p>
        </section>

        {/* テスト記事一覧 */}
        <section>
          <h3 className="text-2xl font-bold text-gray-900 mb-8">最新記事</h3>
          
          <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded">
            <p className="text-green-800">✅ サイトは正常に動作しています！</p>
            <p className="text-sm mt-2">現在、Sanity CMSとの接続を設定中です。</p>
            <p className="text-xs text-gray-600 mt-1">最終更新: {timestamp}</p>
            <p className="text-xs text-blue-600 mt-1">🔄 キャッシュ無効化済み</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <h4 className="text-xl font-semibold mb-3 text-gray-800">
                  Pro Re Nataへようこそ
                </h4>
                
                <p className="text-gray-600 mb-4">
                  新しいブログサイトPro Re Nataが開設されました。技術情報やライフハックなどを扱っていきます。
                </p>

                <p className="text-gray-500 text-sm mb-4">
                  2025年7月29日
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
                  サイト構築について
                </h4>
                
                <p className="text-gray-600 mb-4">
                  Next.js + Sanity CMS + Vercelの組み合わせでモダンなブログサイトを構築しました。
                </p>

                <p className="text-gray-500 text-sm mb-4">
                  2025年7月29日
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
          <p>&copy; 2024 Pro Re Nata. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}