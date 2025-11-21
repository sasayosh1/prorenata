import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const playerName = searchParams.get('playerName')?.trim()

    if (!playerName) {
      return NextResponse.json(
        { error: 'playerName is required' },
        { status: 400 }
      )
    }

    const now = new Date()
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()

    const query = `*[_type == "quizScore"
      && playerName == $playerName
      && playedAt >= $dayStart
      && playedAt < $dayEnd
    ] | order(playedAt desc)[0]`

    const result = await client.fetch<{
      correctAnswers?: number
      totalQuestions?: number
      playedAt?: string
    } | null>(query, {
      playerName,
      dayStart,
      dayEnd,
    })

    if (!result) {
      return NextResponse.json({ completed: false })
    }

    return NextResponse.json({
      completed: true,
      correctAnswers: result.correctAnswers ?? 0,
      totalQuestions: result.totalQuestions ?? 10,
      playedAt: result.playedAt,
    })
  } catch (error) {
    console.error('Error fetching quiz progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    )
  }
}
