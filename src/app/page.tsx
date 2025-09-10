import { getAllPosts, type Post } from '@/lib/sanity'
import Link from 'next/link'
import SimpleSearch from '@/components/SimpleSearch'
import Container from '@/components/Container'

// 最強のキャッシュ無効化
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default async function Home() {
  let posts: Post[] = []
  let sanityConnected = false
  
  try {
    posts = await getAllPosts()
    sanityConnected = posts.length > 0
  } catch (error) {
    console.error('Failed to load posts:', error)
  }
  
  return (
    <>
      {/* ヒーローセクション - 全幅背景 */}
      <section className="w-full bg-gradient-to-b from-blue-600 to-blue-500 text-white">
        <Container className="py-16 sm:py-20 lg:py-24">
          <h1 className="text-4xl font-extrabold leading-tight">
            ProReNata
          </h1>
          <p className="mt-3 text-base opacity-90">
            医療現場で役立つ知見を、簡潔に共有します。
          </p>
        </Container>
      </section>

      {/* メインコンテンツ */}
      <Container className="py-6 sm:py-8">
        {/* 検索セクション */}
        <section className="mb-8">
          <h2 className="sr-only">記事検索</h2>
          <div className="max-w-md mx-auto">
            <SimpleSearch placeholder="キーワードで検索" />
          </div>
        </section>
        
        {/* 記事一覧 */}
        <section className="py-6 sm:py-10">
          <h2 className="text-2xl font-bold mb-4 sm:mb-6">
            最新の記事
          </h2>
            
          {sanityConnected ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {posts.map((post) => (
                  <article key={post._id} className="rounded-xl border border-gray-200/70 bg-white shadow-sm hover:shadow transition-shadow">
                    <Link href={`/posts/${post.slug.current}`} className="block p-4 sm:p-5">
                      <h3 className="text-base sm:text-lg font-semibold leading-snug line-clamp-2 mb-2">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="font-medium">ProReNata</span>
                        <time dateTime={post.publishedAt}>
                          {new Date(post.publishedAt).toLocaleDateString('ja-JP')}
                        </time>
                      </div>
                    </Link>
                  </article>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                <article className="rounded-xl border border-gray-200/70 bg-white shadow-sm hover:shadow transition-shadow">
                  <Link href="#" className="block p-4 sm:p-5">
                    <h3 className="text-base sm:text-lg font-semibold leading-snug line-clamp-2 mb-2">
                      看護助手として働いた日々を振り返って
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      医療現場で看護助手として働いた実体験をもとに、日々感じたことや学んだことを率直に書いています。
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="font-medium">ProReNata</span>
                      <time dateTime="2025-08-12">2025年8月12日</time>
                    </div>
                  </Link>
                </article>
                
                <article className="rounded-xl border border-gray-200/70 bg-white shadow-sm hover:shadow transition-shadow">
                  <Link href="#" className="block p-4 sm:p-5">
                    <h3 className="text-base sm:text-lg font-semibold leading-snug line-clamp-2 mb-2">
                      医療現場で学んだコミュニケーションの大切さ
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      患者さんや医療スタッフとのコミュニケーションで学んだこと、今でも心に残っている印象深いエピソードを紹介しています。
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="font-medium">ProReNata</span>
                      <time dateTime="2025-08-11">2025年8月11日</time>
                    </div>
                  </Link>
                </article>
            </div>
          )}
        </section>
      </Container>

      {/* フッター */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-12">
        <Container className="text-center">
          <p className="text-xs text-gray-500">
            © 2025 ProReNata
          </p>
        </Container>
      </footer>
    </>
  );
}