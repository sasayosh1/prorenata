import Link from 'next/link'
import HeaderSearch from './HeaderSearch'

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 transition-all duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between py-4">
        <Link href="/" aria-label="ProReNata" className="flex items-center group">
          <div className="text-2xl font-bold text-gray-900 tracking-tight group-hover:text-cyan-600 transition-colors duration-300">
            ProReNata
          </div>
        </Link>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-gray-700">
            <Link href="/posts" className="px-3 py-2 rounded-md hover:bg-cyan-50 hover:text-cyan-600 transition-all duration-200">
              記事一覧
            </Link>
            <Link href="/tags" className="px-3 py-2 rounded-md hover:bg-cyan-50 hover:text-cyan-600 transition-all duration-200">
              タグ
            </Link>
            <Link href="/categories" className="px-3 py-2 rounded-md hover:bg-cyan-50 hover:text-cyan-600 transition-all duration-200">
              カテゴリ
            </Link>
            <Link href="/quiz" className="px-3 py-2 rounded-md hover:bg-cyan-50 hover:text-cyan-600 transition-all duration-200">
              クイズ
            </Link>
            <Link href="/about" className="px-3 py-2 rounded-md hover:bg-cyan-50 hover:text-cyan-600 transition-all duration-200">
              About
            </Link>
          </nav>
          <div className="pl-2 border-l border-gray-200 ml-2">
            <HeaderSearch />
          </div>
        </div>
      </div>
    </header>
  )
}
