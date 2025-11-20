import Link from 'next/link'
import HeaderSearch from './HeaderSearch'

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 xl:max-w-5xl xl:px-0 flex items-center justify-between py-4 gap-4">
        <Link href="/" aria-label="ProReNata" className="flex items-center">
          <div className="text-xl font-semibold text-gray-900">
            ProReNata
          </div>
        </Link>
        <nav className="flex items-center gap-3 text-sm font-medium text-gray-900">
          <Link href="/posts" className="hover:text-cyan-600 transition-colors duration-200">
            記事一覧
          </Link>
          <Link href="/tags" className="hover:text-cyan-600 transition-colors duration-200">
            タグ
          </Link>
          <Link href="/categories" className="hover:text-cyan-600 transition-colors duration-200">
            カテゴリ
          </Link>
          <Link href="/about" className="hover:text-cyan-600 transition-colors duration-200 hidden sm:inline-flex">
            About
          </Link>
        </nav>
        <HeaderSearch />
      </div>
    </header>
  )
}
