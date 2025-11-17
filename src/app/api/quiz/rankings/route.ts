import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'weekly' // 'weekly' or 'monthly'

    // Calculate date range
    const now = new Date()
    const startDate = new Date()

    if (period === 'weekly') {
      startDate.setDate(now.getDate() - 7)
    } else if (period === 'monthly') {
      startDate.setMonth(now.getMonth() - 1)
    } else {
      return NextResponse.json(
        { error: '無効な期間パラメータです' },
        { status: 400 }
      )
    }

    // Fetch rankings from Sanity
    const query = `*[_type == "quizScore" && playedAt >= $startDate] | order(score desc, playedAt desc) [0...20] {
      playerName,
      score,
      correctAnswers,
      totalQuestions,
      playedAt
    }`

    const rankings = await client.fetch(query, { startDate: startDate.toISOString() })

    return NextResponse.json({
      period,
      rankings,
      count: rankings.length
    })
  } catch (error) {
    console.error('Error fetching rankings:', error)
    return NextResponse.json(
      { error: 'ランキングの取得に失敗しました' },
      { status: 500 }
    )
  }
}
