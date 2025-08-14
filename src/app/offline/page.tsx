import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { WifiOff, RefreshCw, Heart, BookOpen, Home, Clock, FileText, Search } from 'lucide-react'

export const metadata = {
  title: 'オフライン | ProReNata',
  description: 'インターネット接続がありません。オフラインでも利用できる機能をご確認ください。',
  robots: 'noindex, nofollow'
}

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-medical-50/50 to-white">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-professional-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-medical-500 to-medical-600 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-professional-900">ProReNata</h1>
                <p className="text-xs text-professional-600">オフラインモード</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-professional-50">
              <WifiOff className="w-3 h-3 mr-1" />
              オフライン
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12 lg:py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="medical-card p-8 lg:p-12">
            {/* Status Icon */}
            <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-gradient-to-br from-professional-100 to-professional-200 flex items-center justify-center">
              <WifiOff className="w-10 h-10 text-professional-600" />
            </div>

            {/* Title */}
            <h1 className="text-3xl lg:text-4xl font-bold text-professional-900 mb-6">
              インターネット接続がありません
            </h1>

            {/* Description */}
            <div className="max-w-2xl mx-auto mb-8">
              <p className="text-lg text-professional-700 leading-relaxed mb-6">
                現在、インターネットに接続されていないため、最新の記事や情報を表示することができません。
              </p>
              
              <div className="bg-gradient-to-br from-medical-50 via-white to-clean-50 border border-professional-200 rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-professional-900 mb-4 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  オフラインでもご利用いただける機能
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="text-left">
                    <h4 className="font-medium text-professional-900 mb-2 flex items-center">
                      <Heart className="w-4 h-4 mr-2 text-medical-500" />
                      お気に入り記事
                    </h4>
                    <p className="text-sm text-professional-700 mb-3">
                      お気に入りに追加した記事はオフラインでも閲覧できる場合があります。
                    </p>
                  </div>
                  
                  <div className="text-left">
                    <h4 className="font-medium text-professional-900 mb-2 flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-clean-500" />
                      読書履歴
                    </h4>
                    <p className="text-sm text-professional-700 mb-3">
                      過去に読んだ記事の履歴を確認できます。
                    </p>
                  </div>
                  
                  <div className="text-left">
                    <h4 className="font-medium text-professional-900 mb-2 flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-medical-500" />
                      キャッシュされた記事
                    </h4>
                    <p className="text-sm text-professional-700 mb-3">
                      以前に閲覧した記事の一部はオフラインでも表示されます。
                    </p>
                  </div>
                  
                  <div className="text-left">
                    <h4 className="font-medium text-professional-900 mb-2 flex items-center">
                      <Search className="w-4 h-4 mr-2 text-clean-500" />
                      オフライン検索
                    </h4>
                    <p className="text-sm text-professional-700 mb-3">
                      キャッシュされた記事の中から検索できます。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-8">
              <Button 
                size="lg"
                onClick={() => window.location.reload()}
                className="px-8"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                再試行
              </Button>
              
              <Link href="/favorites">
                <Button variant="outline" size="lg" className="px-8">
                  <Heart className="w-4 h-4 mr-2" />
                  お気に入りを見る
                </Button>
              </Link>
              
              <Link href="/">
                <Button variant="outline" size="lg" className="px-8">
                  <Home className="w-4 h-4 mr-2" />
                  ホームに戻る
                </Button>
              </Link>
            </div>

            <p className="text-sm text-professional-600 mb-8">
              インターネット接続が復旧すると、自動的に最新の内容が表示されます
            </p>

            {/* Tips */}
            <div className="bg-professional-50 border border-professional-200 rounded-xl p-6">
              <h4 className="font-semibold text-professional-900 mb-3">
                💡 接続を改善するためのヒント
              </h4>
              <div className="text-sm text-professional-700 space-y-2 text-left max-w-2xl mx-auto">
                <p>• Wi-Fiまたはモバイルデータの接続を確認してください</p>
                <p>• 機内モードがオフになっているか確認してください</p>
                <p>• ルーターの電源を入れ直してみてください</p>
                <p>• しばらく時間をおいてから再度お試しください</p>
                <p>• PWAとしてホーム画面に追加すると、より快適にご利用いただけます</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-professional-50 border-t border-professional-200 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-medical-500 to-medical-600 rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-professional-900">ProReNata</span>
          </div>
          <p className="text-sm text-professional-600">
            看護助手として働く皆様のために、必要に応じて情報をお届けします
          </p>
        </div>
      </footer>
    </div>
  )
}