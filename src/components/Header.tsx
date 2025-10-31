import Link from 'next/link'

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 xl:max-w-5xl xl:px-0 flex items-center justify-between py-4">
        <div>
          <Link href="/" aria-label="ProReNata">
            <div className="flex items-center justify-between">
              <div className="mr-3">
                <div className="text-xl font-semibold text-gray-900">
                  ProReNata
                </div>
              </div>
            </div>
          </Link>
        </div>
        <div className="flex items-center space-x-4 leading-5 sm:space-x-6">
          <Link
            href="/posts"
            className="font-medium text-gray-900 hover:text-cyan-600 transition-colors duration-200"
          >
            記事一覧
          </Link>
          <Link
            href="/tags"
            className="font-medium text-gray-900 hover:text-cyan-600 transition-colors duration-200"
          >
            タグ
          </Link>
          <Link
            href="/categories"
            className="font-medium text-gray-900 hover:text-cyan-600 transition-colors duration-200"
          >
            カテゴリ
          </Link>
          <Link
            href="/about"
            className="font-medium text-gray-900 hover:text-cyan-600 transition-colors duration-200"
          >
            About
          </Link>
        </div>
      </div>
    </header>
  )
}
