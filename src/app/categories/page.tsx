import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { client } from '@/lib/sanity'

interface CategoryEntry {
  _id: string
  title: string
  slug: string
  description?: string
  postCount: number
}

export const metadata: Metadata = {
  title: 'カテゴリー一覧 | ProReNata',
  description: 'ProReNataで掲載中の看護助手向け記事カテゴリー一覧です。気になるテーマから記事をお探しいただけます。',
}

export default async function CategoryIndexPage() {
  let categoryList: CategoryEntry[] = []

  try {
    const categories = await client.fetch<{
      _id: string
      title: string
      slug?: string
      description?: string
      postCount: number
    }[]>(`
      *[_type == "category" && defined(slug.current) && slug.current != ""]{
        _id,
        title,
        "slug": slug.current,
        description,
        "postCount": count(*[_type == "post" && references(^._id) && defined(slug.current) && defined(body[0])])
      } | order(postCount desc)
    `)

    const unique = new Map<string, CategoryEntry>()
    for (const category of categories) {
      if (!category.slug) continue
      if (category.postCount === 0) continue
      const existing = unique.get(category.slug)
      if (!existing || category.postCount > existing.postCount) {
        unique.set(category.slug, {
          _id: category._id,
          title: category.title,
          slug: category.slug,
          description: category.description,
          postCount: category.postCount,
        })
      }
    }

    categoryList = Array.from(unique.values())
  } catch (error) {
    console.error('Failed to load categories:', error)
  }

  return (
    <>
      <Header />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 xl:px-0">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">カテゴリー一覧</h1>
          <p className="text-gray-600">
            看護助手として働く皆さまのために、テーマ別に情報を整理しています。関心のあるカテゴリーから記事をお探しください。
          </p>
        </div>

        {categoryList.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-600">
            カテゴリー情報を読み込んでいます。しばらく経ってから再度アクセスしてください。
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categoryList.map((category) => (
              <Link
                key={category._id}
                href={`/categories/${category.slug}`}
                className="block bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {category.title}
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  {category.description || '看護助手として知っておきたい情報をまとめています。'}
                </p>
                <span className="inline-flex items-center text-sm font-medium text-blue-600">
                  記事数: {category.postCount}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  )
}
