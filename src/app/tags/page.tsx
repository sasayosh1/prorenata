import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getCuratedTagStats } from '@/lib/sanity'
import { CATEGORY_SUMMARY, type CategorySlug } from '@/data/tagCatalog'

export const metadata: Metadata = {
  title: 'タグ一覧 | ProReNata',
  description: '看護助手向けの情報をトピック別に整理。基礎知識や転職、メンタルケアなど気になるタグから記事を探せます。',
}

export default async function TagsPage() {
  const tagStats = await getCuratedTagStats()

  const grouped = tagStats.reduce<Record<CategorySlug, typeof tagStats>>((acc, tag) => {
    if (!acc[tag.categorySlug]) {
      acc[tag.categorySlug] = []
    }
    acc[tag.categorySlug].push(tag)
    return acc
  }, {} as Record<CategorySlug, typeof tagStats>)

  const categoryOrder: CategorySlug[] = ['work', 'wellbeing', 'career-change', 'salary', 'license', 'resignation', 'stories']

  return (
    <>
      <Header />
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 xl:px-0">
        <div className="mb-10">
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-3">
            <Link href="/" className="hover:text-cyan-600 transition-colors">ホーム</Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-medium">タグ</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">タグ一覧</h1>
          <p className="text-gray-600">
            看護助手としての暮らしを支えるキーワードを集めました。気になるテーマから記事を探してみてください。
          </p>
        </div>

        <div className="space-y-10">
          {categoryOrder.map(categorySlug => {
            const tags = grouped[categorySlug]?.filter(tag => tag.postCount > 0) ?? []
            if (tags.length === 0) return null
            const categoryInfo = CATEGORY_SUMMARY[categorySlug]

            return (
              <section key={categorySlug}>
                <div className="mb-4 flex flex-col gap-1">
                  <h2 className="text-2xl font-semibold text-gray-900">{categoryInfo.title}</h2>
                  <p className="text-sm text-gray-600">{categoryInfo.description}</p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {tags.map(tag => (
                    <Link
                      key={tag.slug}
                      href={`/tags/${tag.slug}`}
                      className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{tag.title}</h3>
                        <span className="text-sm text-blue-600 font-medium">{tag.postCount}記事</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {tag.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>
      <Footer />
    </>
  )
}
