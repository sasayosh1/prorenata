import { NextRequest, NextResponse } from 'next/server'
import { createClient } from 'next-sanity'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = '2024-01-01'
const token = process.env.SANITY_API_TOKEN

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token,
})

// 閲覧数を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const query = `*[_type == "post" && slug.current == $slug][0] {
      views
    }`

    const post = await client.fetch(query, { slug })

    if (!post) {
      return NextResponse.json({ views: 0 })
    }

    return NextResponse.json({ views: post.views || 0 })
  } catch (error) {
    console.error('閲覧数取得エラー:', error)
    return NextResponse.json({ views: 0 }, { status: 500 })
  }
}

// 閲覧数を増やす
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // 記事を取得
    const query = `*[_type == "post" && slug.current == $slug][0] {
      _id,
      views
    }`

    const post = await client.fetch(query, { slug })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // 閲覧数を1増やす
    const currentViews = post.views || 0
    const newViews = currentViews + 1

    await client
      .patch(post._id)
      .set({ views: newViews })
      .commit()

    return NextResponse.json({ views: newViews })
  } catch (error) {
    console.error('閲覧数更新エラー:', error)
    return NextResponse.json(
      { error: 'Failed to update views' },
      { status: 500 }
    )
  }
}
