import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { client, formatPostDate } from '@/lib/sanity'

interface CategoryDocument {
  _id: string
  title: string
  description?: string
  slug: string
}

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

async function fetchCategoryBySlug(slug: string): Promise<CategoryDocument | null> {
  const category = await client.fetch<{
    _id: string
    title: string
    description?: string
  } | null>(
    `*[_type == "category" && slug.current == $slug][0]{
      _id,
      title,
      description
    }`,
    { slug }
  )

  if (!category) {
    return null
  }

  return {
    _id: category._id,
    title: category.title,
    description: category.description,
    slug,
  }
}

export async function generateStaticParams() {
  const categories = await client.fetch<{ slug?: { current?: string } }[]>(
    `*[_type == "category" && defined(slug.current)]{ "slug": slug.current }`
  )

  return categories
    .map((category) => category.slug?.current)
    .filter((slug): slug is string => Boolean(slug))
    .map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const category = await fetchCategoryBySlug(slug)

  if (!category) {
    return {
      title: 'カテゴリーが見つかりません | ProReNata',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  return {
    title: `${category.title} | ProReNata`,
    description: category.description || `「${category.title}」に関する看護助手向けの記事一覧です。`,
  }
}

export default async function CategoryDetailPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const category = await fetchCategoryBySlug(slug)

  if (!category) {
    notFound()
  }

  const posts = await client.fetch<{
    _id: string
    title: string
    slug: { current: string }
    excerpt?: string
    publishedAt?: string
    _createdAt?: string
  }[]>(
    `*[_type == "post" && references($categoryId) && defined(slug.current) && defined(body[0])]
      | order(coalesce(_updatedAt, publishedAt, _createdAt) desc) {
        _id,
        title,
        slug,
        excerpt,
        publishedAt,
        _createdAt
      }`,
    { categoryId: category._id }
  )

  return (
    <>
      <Header />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 xl:px-0">
        <div className="mb-8">
          <nav className="text-sm text-gray-500 mb-4 flex items-center space-x-2">
            <Link href="/" className="hover:text-cyan-600">ホーム</Link>
            <span>/</span>
            <Link href="/categories" className="hover:text-cyan-600">カテゴリー一覧</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{category.title}</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{category.title}</h1>
          {category.description && (
            <p className="text-gray-600">{category.description}</p>
          )}
        </div>

        {posts.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-600">
            このカテゴリーに関連する記事は準備中です。
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => {
              const { label } = formatPostDate(post)
              return (
                <article key={post._id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    <Link href={`/posts/${post.slug.current}`} className="hover:text-cyan-600">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="text-sm text-gray-500 mb-3">{label}</p>
                  {post.excerpt && (
                    <p className="text-gray-600 line-clamp-3">{post.excerpt}</p>
                  )}
                  <div className="mt-4">
                    <Link href={`/posts/${post.slug.current}`} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      記事を読む →
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
      <Footer />
    </>
  )
}
