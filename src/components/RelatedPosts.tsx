import Link from 'next/link'

interface RelatedPost {
  title: string
  slug: string
  categories: string[]
}

interface RelatedPostsProps {
  posts: RelatedPost[]
}

export default function RelatedPosts({ posts }: RelatedPostsProps) {
  if (!posts || posts.length === 0) {
    return null
  }

  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <h3 className="text-2xl font-bold mb-6 text-gray-900">関連記事</h3>
      <ul className="space-y-4">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/posts/${post.slug}`} className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <h4 className="text-lg font-semibold text-blue-600 hover:underline">{post.title}</h4>
              {post.categories && post.categories.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  カテゴリ: {post.categories.join(', ')}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
