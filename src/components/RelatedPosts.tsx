import Link from 'next/link'
import type { RelatedPostSummary } from '@/lib/sanity'
import { sanitizeTitle } from '@/lib/title'

interface RelatedPostsProps {
  posts: RelatedPostSummary[]
}

export default function RelatedPosts({ posts }: RelatedPostsProps) {
  if (!posts || posts.length === 0) {
    return null
  }

  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <h3 className="text-2xl font-bold mb-6 text-gray-900">次のステップ</h3>
      <ul className="space-y-3">
        {posts.map(post => (
          <li key={post.slug}>
            <Link
              href={`/posts/${post.slug}`}
              className="text-lg text-cyan-700 hover:text-cyan-900 font-semibold transition-colors duration-200"
            >
              {sanitizeTitle(post.title)}
            </Link>
            {post.categories && post.categories.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-2 text-sm text-gray-600">
                {post.categories.slice(0, 2).map((category, idx) => {
                  const key = category.slug || `${category.title}-${idx}`
                  if (category.slug) {
                    return (
                      <Link
                        key={key}
                        href={`/categories/${category.slug}`}
                        className="underline decoration-dotted hover:text-cyan-700"
                      >
                        {category.title}
                      </Link>
                    )
                  }
                  return (
                    <span key={key} className="text-gray-600">
                      {category.title}
                    </span>
                  )
                })}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
