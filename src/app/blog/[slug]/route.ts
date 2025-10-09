import type { NextRequest } from 'next/server'
import { client } from '@/lib/sanity'
import { SITE_URL } from '@/lib/constants'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  if (!slug) {
    return new Response('Gone', { status: 410, headers: { 'Cache-Control': 'public, max-age=3600' } })
  }

  const count = await client.fetch<number>(
    `count(*[_type == "post" && slug.current == $slug && defined(body[0])])`,
    { slug }
  )

  if (count > 0) {
    const baseUrl = SITE_URL
    return Response.redirect(`${baseUrl}/posts/${slug}`, 308)
  }

  return new Response('Gone', { status: 410, headers: { 'Cache-Control': 'public, max-age=3600' } })
}
