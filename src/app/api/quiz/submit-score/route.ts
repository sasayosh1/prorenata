import { NextRequest, NextResponse } from 'next/server'
import { sanityWriteClient } from '@/lib/sanity'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { playerName, score, correctAnswers, totalQuestions } = body

    // Validation
    if (!playerName || typeof score !== 'number' || typeof correctAnswers !== 'number' || typeof totalQuestions !== 'number') {
      return NextResponse.json(
        { error: '必須フィールドが不足しているか、データ型が正しくありません' },
        { status: 400 }
      )
    }

    const MAX_DAILY_QUESTIONS = 10
    if (
      score < 0 ||
      score > MAX_DAILY_QUESTIONS ||
      correctAnswers < 0 ||
      correctAnswers > MAX_DAILY_QUESTIONS ||
      totalQuestions !== MAX_DAILY_QUESTIONS
    ) {
      return NextResponse.json(
        { error: 'スコアまたは問題数が正しくありません' },
        { status: 400 }
      )
    }

    // Create quiz score document in Sanity
    const quizScore = await sanityWriteClient.create({
      _type: 'quizScore',
      playerName,
      score,
      correctAnswers,
      totalQuestions,
      playedAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, id: quizScore._id }, { status: 201 })
  } catch (error) {
    console.error('Error submitting quiz score:', error)
    return NextResponse.json(
      { error: 'スコアの保存に失敗しました' },
      { status: 500 }
    )
  }
}
