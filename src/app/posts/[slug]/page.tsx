
import { createClient } from 'next-sanity'
import { PortableText } from '@portabletext/react'

const projectId = '72m8vhy2'
const dataset = 'production'
const apiVersion = '2024-01-01'

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
})

export async function generateStaticParams() {
  const query = `*[_type == "post" && defined(slug.current)]{ "slug": slug.current }`
  const slugs: { slug: string }[] = await client.fetch(query)
  return slugs.map((s: { slug: string }) => ({ slug: s.slug }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function PostDetailPage({ params }: any) {
  const query = `*[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    publishedAt,
    body,
    "author": author->name,
  }`
  const post = await client.fetch(query, { slug: params.slug })

  if (!post) {
    return <div>記事が見つかりません。</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-2">{post.title}</h1>
      <p className="text-gray-500 mb-4">
        {new Date(post.publishedAt).toLocaleDateString()} by {post.author}
      </p>
      <div className="prose max-w-none">
        <PortableText value={post.body} />
      </div>
    </div>
  )
}
