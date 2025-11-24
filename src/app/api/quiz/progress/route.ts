import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity'

const JST_OFFSET_MS = 9 * 60 * 60 * 1000

function getJstDayRange(reference = new Date()) {
  const jstNow = new Date(reference.getTime() + JST_OFFSET_MS)
  const startUtc = Date.UTC(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), jstNow.getUTCDate()) - JST_OFFSET_MS
  const start = new Date(startUtc)
  const end = new Date(startUtc + 24 * 60 * 60 * 1000)
  return { start, end }
}

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

    const { start, end } = getJstDayRange()
    const dayStart = start.toISOString()
    const dayEnd = end.toISOString()

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
