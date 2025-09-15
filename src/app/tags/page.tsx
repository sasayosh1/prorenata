import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

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
    <>
      <Header />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 xl:max-w-5xl xl:px-0">
        {/* Main Content */}
        <main>
          <div className="divide-y divide-gray-200">
            <div className="space-y-2 pb-8 pt-6 md:space-y-5">
              {/* パンくずナビゲーション */}
              <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                <Link href="/" className="hover:text-cyan-600 transition-colors duration-200">
                  ホーム
                </Link>
                <span className="text-gray-300">/</span>
                <span className="text-gray-900 font-medium">タグ</span>
              </nav>

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
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                    <Link
                      href="/blog"
                      className="inline-flex items-center rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500"
                    >
                      すべての記事を見る
                    </Link>
                    <Link
                      href="/"
                      className="text-cyan-600 hover:text-cyan-700 font-medium"
                    >
                      ← ホームに戻る
                    </Link>
                  </div>
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
      </div>
      <Footer />
    </>
  )
}