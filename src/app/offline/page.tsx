'use client'

import Link from 'next/link'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white">
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* アイコンとタイトル */}
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              📱 オフラインモード
            </h1>
            <p className="text-xl text-blue-100">
              インターネット接続が確認できません
            </p>
          </div>

          {/* 説明 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">ご利用いただける機能</h2>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="bg-white/10 rounded-lg p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  お気に入り記事
                </h3>
                <p className="text-sm text-blue-100">
                  お気に入りに追加した記事はオフラインでも閲覧できる場合があります。
                </p>
              </div>

              <div className="bg-white/10 rounded-lg p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  読書履歴
                </h3>
                <p className="text-sm text-blue-100">
                  過去に読んだ記事の履歴を確認できます。
                </p>
              </div>

              <div className="bg-white/10 rounded-lg p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  キャッシュされた記事
                </h3>
                <p className="text-sm text-blue-100">
                  以前に閲覧した記事の一部はオフラインでも表示されます。
                </p>
              </div>

              <div className="bg-white/10 rounded-lg p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  オフライン検索
                </h3>
                <p className="text-sm text-blue-100">
                  キャッシュされた記事の中から検索できます。
                </p>
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                再試行
              </button>

              <Link
                href="/favorites"
                className="bg-red-500/80 hover:bg-red-500 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                お気に入りを見る
              </Link>
            </div>

            <p className="text-sm text-blue-200">
              インターネット接続が復旧すると、自動的に最新の内容が表示されます
            </p>
          </div>

          {/* オフライン時のヒント */}
          <div className="mt-12 bg-white/5 backdrop-blur-sm rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">💡 オフライン時のヒント</h3>
            <ul className="text-left text-sm text-blue-100 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                <span>Wi-Fi設定やモバイルデータ接続を確認してください</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                <span>機内モードがオンになっていないか確認してください</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                <span>お気に入りに追加した記事は、次回オンライン時に自動で更新されます</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                <span>PWAとしてホーム画面に追加すると、より快適にご利用いただけます</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}