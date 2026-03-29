import Link from 'next/link'
import HeaderSearch from './HeaderSearch'
import MobileMenu from './MobileMenu'
import ThemeSwitch from './ThemeSwitch'

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-all duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between py-4">
        <Link href="/" aria-label="ProReNata" className="flex items-center group">
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight group-hover:text-cyan-600 transition-colors duration-300">
            ProReNata
          </div>
        </Link>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Link href="/posts" className="px-3 py-2 rounded-md hover:bg-cyan-50 dark:hover:bg-cyan-900/30 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all duration-200">
              記事一覧
            </Link>
            <Link href="/tags" className="px-3 py-2 rounded-md hover:bg-cyan-50 dark:hover:bg-cyan-900/30 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all duration-200">
              タグ
            </Link>
            <Link href="/categories" className="px-3 py-2 rounded-md hover:bg-cyan-50 dark:hover:bg-cyan-900/30 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all duration-200">
              カテゴリ
            </Link>
            <Link href="/about" className="px-3 py-2 rounded-md hover:bg-cyan-50 dark:hover:bg-cyan-900/30 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all duration-200">
              About
            </Link>
            <Link href="/contact" className="px-3 py-2 rounded-md hover:bg-cyan-50 dark:hover:bg-cyan-900/30 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all duration-200">
              お問い合わせ
            </Link>
            <Link href="/#newsletter" className="px-3 py-2 rounded-md bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 font-bold hover:bg-cyan-100 dark:hover:bg-cyan-800 transition-all duration-200">
              メルマガ
            </Link>
          </nav>
          <div className="flex items-center gap-4 pl-2 border-l border-gray-200 dark:border-gray-700 ml-2">
            <HeaderSearch />
            <ThemeSwitch />
          </div>
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}
