import { permanentRedirect } from 'next/navigation'
import { client } from '@/lib/sanity'

interface ArticleRedirectProps {
  params: Promise<{ slug: string }>
}

export default async function ArticleLegacyRedirect({ params }: ArticleRedirectProps) {
  const { slug } = await params

  if (!slug) {
    permanentRedirect('/posts')
  }

  const count = await client.fetch<number>(
    `count(*[_type == "post" && slug.current == $slug && defined(body[0])])`,
    { slug }
  )

  if (count > 0) {
    permanentRedirect(`/posts/${slug}`)
  }

  permanentRedirect('/posts')
}
