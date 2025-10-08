import Link from 'next/link'
import { createClient } from 'next-sanity'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})

interface PopularPost {
  title: string
  slug: string
  views: number
  categories: string[]
}

async function getPopularPosts(limit: number = 5): Promise<PopularPost[]> {
  const query = `*[_type == "post" && defined(views)]
    | order(views desc) [0...${limit}] {
      title,
      "slug": slug.current,
      views,
      "categories": categories[]->title
    }`

  try {
    const posts = await client.fetch(query)
    return posts
  } catch (error) {
    console.error('人気記事の取得に失敗しました:', error)
    return []
  }
}

interface PopularPostsProps {
  limit?: number
  title?: string
}

export default async function PopularPosts({
  limit = 5,
  title = '人気記事ランキング'
}: PopularPostsProps) {
  const posts = await getPopularPosts(limit)

  if (posts.length === 0) {
    return null
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-2xl">🏆</span>
        {title}
      </h3>
      <div className="space-y-4">
        {posts.map((post, index) => (
          <Link
            key={post.slug}
            href={`/posts/${post.slug}`}
            className="block group"
          >
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              {/* ランキング番号 */}
              <div className={`
                flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                ${index === 0 ? 'bg-yellow-100 text-yellow-700' : ''}
                ${index === 1 ? 'bg-gray-100 text-gray-700' : ''}
                ${index === 2 ? 'bg-orange-100 text-orange-700' : ''}
                ${index >= 3 ? 'bg-cyan-50 text-cyan-700' : ''}
              `}>
                {index + 1}
              </div>

              {/* 記事情報 */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 group-hover:text-cyan-600 transition-colors duration-200 line-clamp-2 mb-1">
                  {post.title}
                </h4>

                {/* カテゴリと閲覧数 */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {post.categories && post.categories.length > 0 && (
                    <span className="bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full">
                      {post.categories[0]}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {post.views.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
