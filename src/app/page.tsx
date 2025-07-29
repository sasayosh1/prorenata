import { getAllPosts, type Post } from '@/lib/sanity'
import Link from 'next/link'

// ISRを有効にして60秒ごとに再生成
export const revalidate = 60

export default async function Home() {
  let posts: Post[] = []
  
  try {
    console.log('Fetching posts...')
    posts = await getAllPosts()
    console.log('Posts fetched:', posts.length)
    console.log('First post:', posts[0])
  } catch (error) {
    console.log('Posts not available yet:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Pro Re Nata
          </h1>
          <p className="text-gray-600 mt-2">
            必要に応じて、その都度
          </p>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto py-12 px-4">
        {/* ヒーローセクション */}
        <section className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Welcome to Pro Re Nata
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            必要に応じて、その都度。状況に応じた最適な情報をお届けします。
          </p>
        </section>

        {/* ブログ記事一覧 */}
        <section>
          <h3 className="text-2xl font-bold text-gray-900 mb-8">最新記事</h3>
          
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <article key={post._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <h4 className="text-xl font-semibold mb-3 text-gray-800">
                      {post.title}
                    </h4>
                    
                    {post.excerpt && (
                      <p className="text-gray-600 mb-4">
                        {post.excerpt}
                      </p>
                    )}

                    <p className="text-gray-500 text-sm mb-4">
                      {new Date(post.publishedAt).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>

                    <Link
                      href={`/blog/${post.slug.current}`}
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                    >
                      続きを読む
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <h4 className="text-xl font-semibold text-gray-900 mb-4">
                  準備中
                </h4>
                <p className="text-gray-600 mb-6">
                  現在コンテンツを準備中です。近日公開予定です。
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    Sanity CMSの設定が完了したら、記事が表示されます。
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* フッター */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p>&copy; 2024 Pro Re Nata. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
