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
  <p style="margin: 0 0 12px 0; font-weight: bold; color: #2c9a9a;">【💡 「もう限界…」と感じている方へ】</p>
  <p style="margin: 0 0 12px 0; color: #3d3b38; line-height: 1.6;">心がすり減って壊れてしまう前に、「いつでもここから逃げられる」というカード（選択肢）を持っておくことは、自分を守る一番の薬になります。<br>履歴書不要・無資格からでもサポートしてくれる介護専門の窓口に、今のうちから少し頼ってみませんか？</p>
  <p style="margin: 0 0 8px 0;">
    [PR] 
    <a href="https://px.a8.net/svt/ejp?a8mat=2ZTT9A+D2Y8MQ+1W34+C8VWY" rel="nofollow" style="color: #0066cc; text-decoration: underline; font-weight: bold;">かいご畑で「自分に合う職場」を覗いてみる（無料）</a>
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

async function insertTopBlock(slug, affiliateBlock) {
    console.log(`\nProcessing: ${slug}...`)
    const post = await client.fetch(`*[_type == "post" && slug.current == $slug][0] { _id, title, body }`, { slug })
    if (!post) {
        console.log(`❌ Post not found: ${slug}`)
        return false
    }

    // Since we are adding to the TOP (under the Table of Contents / First H2), we need to find the first H2
    let insertIndex = post.body.findIndex(b => b._type === 'block' && b.style === 'h2')

    // If no H2, just put it near the top (e.g., after the second paragraph)
    if (insertIndex === -1) {
        insertIndex = 2; // Arbitrary safe guess
    } else {
        // Insert right *after* the first H2 usually makes sense conceptually, or right before it.
        // Putting it right BEFORE the first H2 is physically right underneath the Table of Contents plugin (if automatic).
        // Let's go with BEFORE the first H2 for maximum visibility.
    }

    // Check if we ALREADY placed our new CRO block near the top
    const existingTopBlockIndex = post.body.findIndex((b, idx) => idx < 5 && b._type === 'affiliateEmbed' && b.provider === affiliateBlock.provider)

    if (existingTopBlockIndex !== -1) {
        console.log(`⚠️ CRO block already at the top. Skipping.`)
        return true
    }

    // Assign a unique key for this *top* insertion
    const blockToInsert = { ...affiliateBlock, _key: generateKey(`affiliate-${affiliateBlock.linkKey}`) }
    const newBody = [...post.body]

    console.log(`Inserting top block at index: ${insertIndex}`)
    newBody.splice(insertIndex, 0, blockToInsert)

    try {
        console.log(`Patching post ID: ${post._id}...`)
        await client.patch(post._id).set({ body: newBody }).commit()
        console.log(`✅ Top block inserted successfully!`)
        return true
    } catch (err) {
        console.error(`❌ Update failed:`, err.message)
        return false
    }
}

async function main() {
    console.log("Starting CRO Sanity patch (Sandwich placement)...")

    // 1. nursing-assistant-resignation-advice-insights -> Kaigobatake
    await insertTopBlock('nursing-assistant-resignation-advice-insights', KAIGOBATAKE_CRO_BLOCK)

    // 2. nursing-assistant-colleague-relationships -> Kaigobatake
    await insertTopBlock('nursing-assistant-colleague-relationships', KAIGOBATAKE_CRO_BLOCK)

    // 3. nursing-assistant-interview-questions-answers -> Resu-map
    await insertTopBlock('nursing-assistant-interview-questions-answers', RESUMAP_CRO_BLOCK)

    console.log("\nDone!")
}

main().catch(console.error)
