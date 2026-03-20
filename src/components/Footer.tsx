import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
            {/* サイト情報 */}
            <div className="col-span-1">
              <div className="flex items-center">
                <div className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
                  ProReNata
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                看護助手として働く方、目指す方のための専門情報サイト。
                現場経験者による実践的なガイドを提供します。
              </p>
              <div className="mt-6 flex space-x-4">
                <a
                  href="mailto:prorenata.jp@gmail.com"
                  className="text-gray-400 hover:text-cyan-600 transition-all duration-300 transform hover:scale-110"
                  aria-label="Email"
                >
                  <svg
                    className="h-6 w-6"
                    width="24"
                    height="24"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                  </svg>
                </a>
                <a
                  href="https://twitter.com/prorenata_jp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 dark:text-gray-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all duration-300 transform hover:scale-110"
                  aria-label="Twitter"
                >
                  <svg
                    className="h-6 w-6"
                    width="24"
                    height="24"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
                  </svg>
                </a>
                <a
                  href="https://note.com/prorenata"
                  target="_blank"
                  rel="noopener noreferrer"
                   className="text-gray-400 dark:text-gray-500 hover:text-[#2cb696] dark:hover:text-[#2cb696] transition-all duration-300 transform hover:scale-110"
                  aria-label="note"
                >
                  <svg
                    className="h-6 w-6"
                    width="24"
                    height="24"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.8 2H6.2C3.9 2 2 3.9 2 6.2v11.6C2 20.1 3.9 22 6.2 22h11.6c2.3 0 4.2-1.9 4.2-4.2V6.2C22 3.9 20.1 2 17.8 2zM15 17.5h-1.5v-7h-1.5v7H10.5v-7c0-0.8 0.7-1.5 1.5-1.5h1.5c0.8 0 1.5 0.7 1.5 1.5v7z"></path>
                  </svg>
                </a>
              </div>
            </div>

            {/* サイトマップ */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                サイトマップ
              </h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link href="/about" className="text-sm text-gray-600 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors duration-200 block hover:translate-x-1 transform">
                    About
                  </Link>
                </li>
              </ul>
            </div>

            {/* カテゴリー */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
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
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
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
          <div className="border-t border-gray-200 dark:border-gray-800 pt-8 mt-12">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <span>© {new Date().getFullYear()} ProReNata.</span>
                <span>All rights reserved.</span>
              </div>
              <div className="mt-4 md:mt-0 text-sm text-gray-400 dark:text-gray-500">
                Designed for Nursing Assistants
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
