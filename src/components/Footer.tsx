import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
            {/* サイト情報 */}
            <div className="col-span-1">
              <div className="flex items-center">
                <div className="text-2xl font-bold text-gray-900 tracking-tight">
                  ProReNata
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-500 leading-relaxed">
                看護助手として働く方、目指す方のための専門情報サイト。
                現場経験者による実践的なガイドを提供します。
              </p>
              <div className="mt-6 flex space-x-4">
                <a
                  href="mailto:info@prorenata.jp"
                  className="text-gray-400 hover:text-cyan-600 transition-all duration-300 transform hover:scale-110"
                  aria-label="Email"
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                  </svg>
                </a>
                <a
                  href="https://twitter.com/prorenata_jp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-cyan-600 transition-all duration-300 transform hover:scale-110"
                  aria-label="Twitter"
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
                  </svg>
                </a>
              </div>
            </div>

            {/* サイトマップ */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                サイトマップ
              </h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link href="/" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors duration-200 block hover:translate-x-1 transform">
                    ホーム
                  </Link>
                </li>
                <li>
                  <Link href="/posts" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors duration-200 block hover:translate-x-1 transform">
                    記事一覧
                  </Link>
                </li>
                <li>
                  <Link href="/tags" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors duration-200 block hover:translate-x-1 transform">
                    タグ
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors duration-200 block hover:translate-x-1 transform">
                    About
                  </Link>
                </li>
              </ul>
            </div>

            {/* カテゴリー */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                カテゴリー
              </h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link href="/categories/work" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors duration-200 block hover:translate-x-1 transform">
                    仕事
                  </Link>
                </li>
                <li>
                  <Link href="/categories/salary" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors duration-200 block hover:translate-x-1 transform">
                    給与
                  </Link>
                </li>
                <li>
                  <Link href="/categories/license" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors duration-200 block hover:translate-x-1 transform">
                    資格
                  </Link>
                </li>
                <li>
                  <Link href="/categories/career-change" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors duration-200 block hover:translate-x-1 transform">
                    転職
                  </Link>
                </li>
                <li>
                  <Link href="/categories/resignation" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors duration-200 block hover:translate-x-1 transform">
                    退職
                  </Link>
                </li>
                <li>
                  <Link href="/categories/wellbeing" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors duration-200 block hover:translate-x-1 transform">
                    メンタル
                  </Link>
                </li>
                <li>
                  <Link href="/categories/stories" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors duration-200 block hover:translate-x-1 transform">
                    体験
                  </Link>
                </li>
              </ul>
            </div>

            {/* サポート */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                サポート
              </h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link href="/contact" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors duration-200 block hover:translate-x-1 transform">
                    お問い合わせ
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors duration-200 block hover:translate-x-1 transform">
                    プライバシーポリシー
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors duration-200 block hover:translate-x-1 transform">
                    利用規約
                  </Link>
                </li>
                <li>
                  <Link href="/sitemap" className="text-sm text-gray-600 hover:text-cyan-600 transition-colors duration-200 block hover:translate-x-1 transform">
                    サイトマップ
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* 下部のコピーライト */}
          <div className="border-t border-gray-200 pt-8 mt-12">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>© {new Date().getFullYear()} ProReNata.</span>
                <span>All rights reserved.</span>
              </div>
              <div className="mt-4 md:mt-0 text-sm text-gray-400">
                Designed for Nursing Assistants
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
