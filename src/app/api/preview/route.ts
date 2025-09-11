import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const slug = searchParams.get('slug')
  const disable = searchParams.get('disable')

  // Check if this is a disable request
  if (disable) {
    ;(await draftMode()).disable()
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Check the secret token (optional security measure)
  if (secret !== process.env.SANITY_PREVIEW_SECRET && process.env.SANITY_PREVIEW_SECRET) {
    return new NextResponse('Invalid token', { status: 401 })
  }

  // Enable draft mode
  ;(await draftMode()).enable()

  // Redirect to the preview URL
  if (slug) {
    redirect(`/posts/${slug}`)
  }

  // Default redirect to home if no slug provided
  redirect('/')
}