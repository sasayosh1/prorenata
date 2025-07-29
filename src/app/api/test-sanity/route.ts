import { getAllPosts } from '@/lib/sanity'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('API: Testing Sanity connection...')
    const posts = await getAllPosts()
    console.log('API: Posts fetched:', posts.length)
    
    return NextResponse.json({
      success: true,
      postsCount: posts.length,
      posts: posts,
      env: {
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
        apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION
      }
    })
  } catch (error) {
    console.error('API: Sanity connection error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}