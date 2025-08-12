import Link from 'next/link'

export default function Sidebar() {
  return (
    <aside className="space-y-6">
      {/* プロフィール */}
      <div className="medical-card p-6">
        <div className="text-center mb-4">
          <div className="w-20 h-20 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">ProReNata</h3>
          <p className="text-sm text-slate-600">元看護助手</p>
        </div>
        <p className="text-sm text-slate-600 text-center leading-relaxed">
          医療現場で働いた経験をもとに、看護助手の仕事や医療現場での学びについて書いています。
        </p>
      </div>

      {/* カテゴリー */}
      <div className="medical-card p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
          </svg>
          カテゴリー
        </h3>
        <ul className="space-y-2">
          <li>
            <Link href="/categories/experience" className="flex items-center justify-between text-sm text-slate-600 hover:text-blue-600 transition-colors">
              <span>体験談</span>
              <span className="text-xs text-slate-400">12</span>
            </Link>
          </li>
          <li>
            <Link href="/categories/daily" className="flex items-center justify-between text-sm text-slate-600 hover:text-blue-600 transition-colors">
              <span>日常のこと</span>
              <span className="text-xs text-slate-400">8</span>
            </Link>
          </li>
          <li>
            <Link href="/categories/learning" className="flex items-center justify-between text-sm text-slate-600 hover:text-blue-600 transition-colors">
              <span>学び</span>
              <span className="text-xs text-slate-400">6</span>
            </Link>
          </li>
          <li>
            <Link href="/categories/medical-field" className="flex items-center justify-between text-sm text-slate-600 hover:text-blue-600 transition-colors">
              <span>医療現場</span>
              <span className="text-xs text-slate-400">15</span>
            </Link>
          </li>
        </ul>
      </div>

      {/* 最近の記事 */}
      <div className="medical-card p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          最近の記事
        </h3>
        <ul className="space-y-3">
          <li>
            <Link href="#" className="block text-sm text-slate-600 hover:text-blue-600 transition-colors">
              <h4 className="font-medium mb-1">看護助手として働いた日々を振り返って</h4>
              <p className="text-xs text-slate-400">2025年8月12日</p>
            </Link>
          </li>
          <li>
            <Link href="#" className="block text-sm text-slate-600 hover:text-blue-600 transition-colors">
              <h4 className="font-medium mb-1">医療現場で学んだコミュニケーションの大切さ</h4>
              <p className="text-xs text-slate-400">2025年8月11日</p>
            </Link>
          </li>
          <li>
            <Link href="#" className="block text-sm text-slate-600 hover:text-blue-600 transition-colors">
              <h4 className="font-medium mb-1">患者さんとの心に残る出会い</h4>
              <p className="text-xs text-slate-400">2025年8月10日</p>
            </Link>
          </li>
        </ul>
      </div>

      {/* タグクラウド */}
      <div className="medical-card p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          タグ
        </h3>
        <div className="flex flex-wrap gap-2">
          <Link href="#" className="inline-block px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors">
            看護助手
          </Link>
          <Link href="#" className="inline-block px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full hover:bg-green-200 transition-colors">
            医療現場
          </Link>
          <Link href="#" className="inline-block px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded-full hover:bg-purple-200 transition-colors">
            体験談
          </Link>
          <Link href="#" className="inline-block px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full hover:bg-yellow-200 transition-colors">
            学び
          </Link>
          <Link href="#" className="inline-block px-3 py-1 text-xs bg-pink-100 text-pink-800 rounded-full hover:bg-pink-200 transition-colors">
            コミュニケーション
          </Link>
          <Link href="#" className="inline-block px-3 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full hover:bg-indigo-200 transition-colors">
            日常
          </Link>
        </div>
      </div>

      {/* About */}
      <div className="medical-card p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          このブログについて
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          看護助手として働いた経験や医療現場で学んだことを、率直に書いている個人ブログです。
        </p>
        <Link href="/about" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium">
          詳しく見る
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </aside>
  )
}