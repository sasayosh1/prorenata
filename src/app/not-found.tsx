import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-md mx-auto text-center px-6">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            ページが見つかりません
          </h2>
          <p className="text-gray-600 mb-8">
            お探しのページは移動または削除された可能性があります。
            URLを確認するか、下記のリンクから目的のページを探してください。
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/"
            className="block w-full bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            ホームに戻る
          </Link>
          
          <Link 
            href="/search"
            className="block w-full bg-white text-gray-900 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            記事を検索
          </Link>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            よく閲覧されるページ
          </h3>
          <div className="space-y-2 text-sm">
            <Link href="/" className="block text-gray-600 hover:text-gray-900">
              • 最新記事一覧
            </Link>
            <Link href="/search" className="block text-gray-600 hover:text-gray-900">
              • 記事検索
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}