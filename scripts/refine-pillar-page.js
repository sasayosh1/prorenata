require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

function generateKey(prefix) {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`
}

const KAIGOBATAKE_CRO_BLOCK = {
    _type: 'affiliateEmbed',
    provider: 'かいご畑',
    label: 'かいご畑',
    linkKey: 'kaigobatake-rel',
    html: `<div style="background: linear-gradient(135deg, #fdfbf7 0%, #f4eee1 100%); border: 1px solid #e2d2b5; border-radius: 8px; padding: 16px; margin: 16px 0;">
  <p style="margin: 0 0 12px 0; font-weight: bold; color: #2c9a9a;">【💡 「どうしても一人で面接にいくのが怖い」という方へ】</p>
  <p style="margin: 0 0 12px 0; color: #3d3b38; line-height: 1.6;">準備をしても、不安で押しつぶされそうになることはあります。そんな時は、派遣会社の担当者さんに「面接同行」をお願いするのも一つの手です。<br>かいご畑なら、無資格・未経験の方でも担当者さんが面接の場に一緒に座って、横からフォロー（長所のアピール等）をしてくれます。どうしても一人で無理なら、プロの杖を借りましょう。</p>
  <p style="margin: 0 0 8px 0;">
    [PR] 
    <a href="https://px.a8.net/svt/ejp?a8mat=2ZTT9A+D2Y8MQ+1W34+C8VWY" rel="nofollow" style="color: #0066cc; text-decoration: underline; font-weight: bold;">かいご畑で「自分に合う職場」を探してみる（完全無料）</a>
    <img border="0" width="1" height="1" src="https://www17.a8.net/0.gif?a8mat=2ZTT9A+D2Y8MQ+1W34+C8VWY" alt="">
  </p>
</div>`
};

const RESUMAP_CRO_BLOCK = {
    _type: 'affiliateEmbed',
    provider: 'レジュマップ',
    label: 'レジュマップ履歴書作成ツール',
    linkKey: 'resumap-interview',
    html: `<div style="background: linear-gradient(135deg, #fdfbf7 0%, #f4eee1 100%); border: 1px solid #e2d2b5; border-radius: 8px; padding: 16px; margin: 16px 0;">
  <p style="margin: 0 0 12px 0; font-weight: bold; color: #2c9a9a;">【💡 履歴書の前で手が止まっている方へ】</p>
  <p style="margin: 0 0 12px 0; color: #3d3b38; line-height: 1.6;">面接対策の第一歩は、綺麗な履歴書を作って自分の不安を取り除くことです。でも、手書きで何度も書き直すのは疲れますよね。<br>スマホでぽちぽち入力するだけで、すぐに見やすい履歴書・職務経歴書が完成するツールがあります。今日のうちにサクッと終わらせて、温かいお茶でも飲みませんか？</p>
  <p style="margin: 0 0 8px 0;">
    [PR] 
    <a href="//af.moshimo.com/af/c/click?a_id=5329936&p_id=7266&pc_id=20832&pl_id=91572" rel="nofollow" referrerpolicy="no-referrer-when-downgrade" style="color: #0066cc; text-decoration: underline; font-weight: bold;">レジュマップで履歴書を自動作成する</a>
    <img src="//i.moshimo.com/af/i/impression?a_id=5329936&p_id=7266&pc_id=20832&pl_id=91572" width="1" height="1" style="border:none;" loading="lazy">
  </p>
</div>`
};

async function main() {
    const draftId = 'drafts.nursing-assistant-interview-resume-roadmap'

    console.log(`Fetching draft: ${draftId}...`)
    const post = await client.getDocument(draftId)

    if (!post) {
        console.error("Draft not found.")
        return
    }

    let newBody = [...post.body]

    // 1. Remove the "導入" (Introduction) H2 block
    const introIndex = newBody.findIndex(b => b._type === 'block' && b.style === 'h2' && b.children[0].text === '導入')
    if (introIndex !== -1) {
        console.log(`Removing '導入' H2 block at index ${introIndex}`)
        newBody.splice(introIndex, 1)
    }

    // 2. Insert Resu-map block after "STEP1..." H2
    const step1Index = newBody.findIndex(b => b._type === 'block' && b.style === 'h2' && b.children[0].text.includes('STEP1'))

    if (step1Index !== -1 && !newBody.some(b => b._type === 'affiliateEmbed' && b.provider === 'レジュマップ')) {
        console.log(`Inserting Resumap block after STEP1...`)
        // Insert right after the Internal Link which is at index + 2 (H2, paragraph, InternalLink)
        // Let's insert it before the next H2 (STEP2) to be safe, or right after the current block.
        // We'll insert it at index + 1 (right below H2) or + 3 (below internal link)
        newBody.splice(step1Index + 3, 0, { ...RESUMAP_CRO_BLOCK, _key: generateKey('affilm') })
    }

    // 3. Insert Kaigobatake block after "STEP5..." H2
    const step5Index = newBody.findIndex(b => b._type === 'block' && b.style === 'h2' && b.children[0].text.includes('STEP5'))

    if (step5Index !== -1 && !newBody.some(b => b._type === 'affiliateEmbed' && b.provider === 'かいご畑')) {
        console.log(`Inserting Kaigobatake block after STEP5...`)
        newBody.splice(step5Index + 2, 0, { ...KAIGOBATAKE_CRO_BLOCK, _key: generateKey('affilk') })
    }

    // Also update Meta Description
    const newMeta = '看護助手の面接と履歴書作成に向けた完全ロードマップ。白紙の履歴書に悩む時間を減らす簡単な作り方から、面接で必ず聞かれる質問への回答の型、逆質問の賢いコツ、面接同行サポートの利用方法まで、未経験からでも採用を勝ち取るための5つのステップを現役の精神科看護助手セラが丁寧に解説します。'

    console.log(`Patching document ${draftId}...`)
    try {
        await client.patch(draftId)
            .set({ body: newBody, metaDescription: newMeta })
            .commit()
        console.log("✅ Success! Cleaned up draft and injected PR blocks & Meta Desc.")
    } catch (e) {
        console.error("Failed to patch:", e.message)
    }
}

main().catch(console.error)
