import Link from 'next/link'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200/20">
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
            href="/blog"
            className="hidden font-medium text-gray-900 hover:text-cyan-600 sm:block transition-colors duration-200"
          >
            ブログ
          </Link>
          <Link
            href="/tags"
            className="hidden font-medium text-gray-900 hover:text-cyan-600 sm:block transition-colors duration-200"
          >
            タグ
          </Link>
          <Link
            href="/about"
            className="hidden font-medium text-gray-900 hover:text-cyan-600 sm:block transition-colors duration-200"
          >
            About
          </Link>
        </div>
      </div>
    </header>
  )
}