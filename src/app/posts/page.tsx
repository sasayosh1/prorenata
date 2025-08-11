
import { createClient } from 'next-sanity'
import Link from 'next/link'

const projectId = '72m8vhy2'
const dataset = 'production'
const apiVersion = '2024-01-01'

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
})

export const revalidate = 60 // Revalidate every 60 seconds

interface Post {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  excerpt: string;
}

export default async function PostsPage() {
  const query = `*[_type == "post" && defined(publishedAt)] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
  }`
  const posts: Post[] = await client.fetch(query)

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">記事一覧</h1>
      <ul>
        {posts.map((post: Post) => (
          <li key={post._id} className="mb-4 border-b pb-2">
            <Link href={`/posts/${post.slug.current}`}>
              <h2 className="text-2xl font-semibold hover:underline">{post.title}</h2>
            </Link>
            <p className="text-gray-600">{post.excerpt}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
