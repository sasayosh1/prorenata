import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import fs from 'fs/promises'
import path from 'path'
import { sanityWriteClient } from '@/lib/sanity'

// 送信元の設定（環境変数などで管理するのが理想的）
const MAIL_USER = process.env.MAIL_USER
const MAIL_PASS = process.env.MAIL_PASS
const GH_TOKEN = process.env.GH_TOKEN
const GITHUB_REPOSITORY = 'sasayosh1/prorenata'

export async function POST(req: Request) {
  try {
    const { email, hp_middle_name } = await req.json()

    // ハニーポット（スパム対策）: 値が入っていたら処理をスキップ（正常終了を装う）
    if (hp_middle_name) {
      console.log('Spam bot detected (honeypot):', email)
      return NextResponse.json({ message: 'Success' }, { status: 200 })
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json({ message: '有効なメールアドレスを入力してください' }, { status: 400 })
    }

    // 1. サブスクライバーリストの保存 (CSV: ローカル開発用 / Sanity: 本番用)
    try {
      const dataDir = path.join(process.cwd(), '06_メルマガ/リスト')
      const filePath = path.join(dataDir, 'subscribers.csv')

      // ディレクトリがない場合は作成（ローカル環境のみ成功する）
      try {
        await fs.access(dataDir)
      } catch {
        await fs.mkdir(dataDir, { recursive: true })
      }

      const timestamp = new Date().toISOString()
      const csvLine = `${timestamp},${email}\n`
      await fs.appendFile(filePath, csvLine)
    } catch (csvError) {
      // Vercel環境など、ファイルシステムが読み取り専用の場合はここに来る
      console.warn('CSV write skipped (expected in production):', csvError)
    }

    // Sanityへの保存（本番・ローカル共通の永続ストレージ）
    try {
      await sanityWriteClient.create({
        _type: 'subscriber',
        email,
        subscribedAt: new Date().toISOString(),
      })
    } catch (sanityError) {
      console.error('Sanity save error:', sanityError)
      // Sanityへの保存に失敗した場合は重大なエラーとして扱う
      throw new Error('データの保存に失敗しました')
    }

    // 2. ウェルカムメールの送信
    if (MAIL_USER && MAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: 'gmail', // または他のサービス
        auth: {
          user: MAIL_USER,
          pass: MAIL_PASS,
        },
      })

      const mailOptions = {
        from: `"白崎セラ" <${MAIL_USER}>`,
        to: email,
        subject: '登録ありがとうございます。ささやかですが、贈り物です',
        text: `はじめまして。
白崎（しらさき）セラ
といいます。

わたしのメルマガへ
足を運んでくださって
ありがとうございます。

登録のお礼に
2種類の「スマホ壁紙」を贈ります。
お守りのように
持っていたいただけたら嬉しいです。

1. 元気に始まる一日
https://prorenata.jp/gift/wallpaper-sera-1.png

2. ご褒美タイム
https://prorenata.jp/gift/wallpaper-sera-2.png

両方とも受け取っていただいて
お好きな方を使ってくださいね。

ストアで検索しても
出てくるかもしれませんが
この場所だけで打ち明ける制作秘話や
このメールでしか受け取れない壁紙を
わたしからの感謝として受け取ってほしくて
こうしてお手紙を書いています。

---

この場所では
SNSでは書けない「本音」や
心がふっと軽くなるような
お話を届けていきます。

明日のメールでは
病院の廊下でずっと抱えていた
わたしの「胸の奥にある想い」を
少しだけ打ち明けさせてくださいね。

---

お返事について：
お一人ずつの返信は難しいのですが
メッセージはすべて
大切に読ませていただいています。

---

解約手続きはこちらから：
https://prorenata.jp/unsubscribe

ProReNata
白崎セラ`,
      }

      await transporter.sendMail(mailOptions)
    }

    // 3. GitHub Actions の自動同期をトリガー
    if (GH_TOKEN) {
      try {
        await fetch(`https://api.github.com/repos/${GITHUB_REPOSITORY}/dispatches`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${GH_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'ProReNata-App',
          },
          body: JSON.stringify({
            event_type: 'sync-subscribers',
          }),
        })
        console.log('GitHub Action triggered successfully')
      } catch (ghError) {
        console.error('GitHub trigger error:', ghError)
        // ここでの失敗は本質的な登録処理には影響しないため、エラーは投げない
      }
    }

    return NextResponse.json({ message: 'Success' }, { status: 200 })
  } catch (error) {
    console.error('Newsletter Error:', error)
    return NextResponse.json({ message: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
