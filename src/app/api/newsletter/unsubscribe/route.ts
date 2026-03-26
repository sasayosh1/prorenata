import { NextResponse } from 'next/server'
import { sanityWriteClient } from '@/lib/sanity'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ message: '有効なメールアドレスを入力してください' }, { status: 400 })
    }

    // Sanityで該当するサブスクライバーを検索し、unsubscribedAtを更新する
    const query = `*[_type == "subscriber" && email == $email && !defined(unsubscribedAt)][0]`
    const subscriber = await sanityWriteClient.fetch(query, { email })

    if (subscriber) {
      await sanityWriteClient
        .patch(subscriber._id)
        .set({ unsubscribedAt: new Date().toISOString() })
        .commit()
    }

    // すでに解除されている場合や見つからない場合も、セキュリティとユーザー体験のために「解除しました」と返すのが一般的
    return NextResponse.json({ message: '解約手続きが完了しました' }, { status: 200 })
  } catch (error) {
    console.error('Unsubscribe Error:', error)
    return NextResponse.json({ message: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
