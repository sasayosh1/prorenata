import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getPostsByTagSlug, formatPostDate } from '@/lib/sanity'
import { TAG_CATALOG, resolveTagDefinition, CATEGORY_SUMMARY } from '@/data/tagCatalog'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return TAG_CATALOG.map(tag => ({ slug: tag.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params
  const tag = resolveTagDefinition(resolvedParams.slug)
  if (!tag) {
    return {
      title: 'タグが見つかりません',
    }
  }

  const category = CATEGORY_SUMMARY[tag.categorySlug]
  const title = `${tag.title} | ${category.title}タグ`
  const description = tag.description

  return {
    title,
    description,
  }
}

export default async function TagDetailPage({ params }: Props) {
  const resolvedParams = await params
  const tag = resolveTagDefinition(resolvedParams.slug)
  if (!tag) {
    notFound()
  }

  const posts = await getPostsByTagSlug(tag.slug, 40)

  const categoryInfo = CATEGORY_SUMMARY[tag.categorySlug]

  return (
    <>
      <Header />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 xl:px-0">
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:text-cyan-600 transition-colors">ホーム</Link>
          <span className="text-gray-300">/</span>
          <Link href="/tags" className="hover:text-cyan-600 transition-colors">タグ</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-medium">{tag.title}</span>
        </nav>

        <header className="mb-8">
          <p className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-700 mb-3">
            {categoryInfo.title}
          </p>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{tag.title}</h1>
          <p className="text-gray-600 leading-relaxed">{tag.description}</p>
        </header>

        {posts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">
            このタグに該当する記事は現在準備中です。別のタグもご覧ください。
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => {
              const { label } = formatPostDate(post)
              return (
                <article key={post._id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <Link href={`/posts/${post.slug.current}`} className="block">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2 hover:text-cyan-600 transition-colors">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-3">{post.excerpt}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{label}</span>
                      {post.categories && post.categories.length > 0 && (
                        <span>
                          {post.categories
                            .map(category =>
                              typeof category === 'string' ? category : category?.title
                            )
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      )}
                    </div>
                  </Link>
                </article>
              )
            })}
          </div>
        )}

        <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/tags"
            className="inline-flex items-center text-cyan-600 font-semibold hover:text-cyan-700"
          >
            ← タグ一覧に戻る
          </Link>
          <Link
            href="/posts"
            className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-700"
          >
            すべての記事を見る
          </Link>
        </div>
      </div>
      <Footer />
    </>
  )
}
