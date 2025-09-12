import Link from 'next/link'

export default function TagsPage() {
  // TODO: 今後Sanityからタグ情報を取得する
  const tags = [
    { name: '基礎知識', count: 12, slug: 'basics' },
    { name: '転職', count: 8, slug: 'career' },
    { name: '看護師への道', count: 6, slug: 'nursing-career' },
    { name: '職場選び', count: 5, slug: 'workplace' },
    { name: 'スキルアップ', count: 7, slug: 'skills' },
    { name: '給与・待遇', count: 4, slug: 'salary' },
    { name: '現場ノウハウ', count: 9, slug: 'practical' },
    { name: '資格取得', count: 5, slug: 'certification' }
  ]

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 xl:max-w-5xl xl:px-0">
      <div className="flex h-screen flex-col justify-between font-sans">
        {/* Header */}
        <header className="flex items-center justify-between py-10">
          <div>
            <Link href="/" aria-label="ProReNata">
              <div className="flex items-center justify-between">
                <div className="mr-3">
                  <div className="text-2xl font-semibold text-gray-900">
                    ProReNata
                  </div>
                </div>
              </div>
            </Link>
          </div>
          <div className="flex items-center space-x-4 leading-5 sm:space-x-6">
            <Link
              href="/blog"
              className="hidden font-medium text-gray-900 hover:text-cyan-600 sm:block"
            >
              ブログ
            </Link>
            <Link
              href="/tags"
              className="hidden font-medium text-gray-900 hover:text-cyan-600 sm:block"
            >
              タグ
            </Link>
            <Link
              href="/about"
              className="hidden font-medium text-gray-900 hover:text-cyan-600 sm:block"
            >
              About
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main>
          <div className="divide-y divide-gray-200">
            <div className="space-y-2 pb-8 pt-6 md:space-y-5">
              <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">
                タグ
              </h1>
              <p className="text-lg leading-7 text-gray-500">
                記事をトピック別に整理しています
              </p>
            </div>
            
            {/* Tags Grid */}
            <div className="pt-8">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {tags.map((tag) => (
                  <div
                    key={tag.slug}
                    className="relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-200 group"
                  >
                    <div className="flex flex-col items-center text-center">
                      <h3 className="text-sm font-medium text-gray-900 group-hover:text-cyan-600 transition-colors duration-200">
                        {tag.name}
                      </h3>
                      <p className="mt-1 text-xs text-gray-500">
                        {tag.count}記事
                      </p>
                    </div>
                    {/* 今後のリンク機能用（準備中） */}
                    <div className="absolute inset-0 rounded-lg cursor-pointer" />
                  </div>
                ))}
              </div>

              {/* 準備中メッセージ */}
              <div className="mt-12 text-center">
                <div className="rounded-lg bg-gray-50 px-6 py-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    タグ機能は準備中です
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    現在、記事をタグ別に分類・検索する機能を開発中です。<br/>
                    しばらくお待ちください。
                  </p>
                  <Link
                    href="/blog"
                    className="inline-flex items-center rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500"
                  >
                    すべての記事を見る
                  </Link>
                </div>
              </div>

              {/* 今後の機能について */}
              <div className="mt-8 border-t border-gray-200 pt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  今後の予定
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      タグ別記事一覧
                    </h4>
                    <p className="text-xs text-gray-600">
                      各タグをクリックすると、そのタグが付いた記事だけを表示する機能を実装予定です。
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      タグ検索機能
                    </h4>
                    <p className="text-xs text-gray-600">
                      複数のタグを組み合わせて、より詳細な記事検索ができる機能を準備中です。
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      人気タグランキング
                    </h4>
                    <p className="text-xs text-gray-600">
                      よく読まれているタグや、注目度の高いトピックをランキング形式で表示します。
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      関連タグ提案
                    </h4>
                    <p className="text-xs text-gray-600">
                      現在読んでいる記事に関連するタグを自動で提案し、さらなる学習をサポートします。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer>
          <div className="mt-16 flex flex-col items-center">
            <div className="mb-3 flex space-x-4">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  className="fill-current text-gray-700 hover:text-cyan-600 h-5 w-5"
                >
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                </svg>
              </div>
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="fill-current text-gray-700 hover:text-cyan-600 h-5 w-5"
                >
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
                </svg>
              </div>
            </div>
            <div className="mb-2 flex space-x-2 text-sm text-gray-500">
              <div>{`© ${new Date().getFullYear()}`}</div>
              <div>{` • `}</div>
              <Link href="/">ProReNata</Link>
            </div>
            <div className="mb-8 text-sm text-gray-500">
              看護助手の皆様を応援するブログ
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}