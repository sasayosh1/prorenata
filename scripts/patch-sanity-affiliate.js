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

const KAIGOBATAKE_BLOCK = {
    _type: 'affiliateEmbed',
    provider: 'かいご畑',
    label: 'かいご畑',
    linkKey: 'kaigobatake-rel',
    html: `<div style="background: linear-gradient(135deg, #fdfbf7 0%, #f4eee1 100%); border: 1px solid #e2d2b5; border-radius: 8px; padding: 16px; margin: 16px 0;">
  <p style="margin: 0 0 12px 0; color: #3d3b38; line-height: 1.6;">人間関係に疲れ果ててしまった時は、「環境を変える」という選択肢が自分を守る一番の薬になることもあります。無理して一人で抱え込まず、プロのサポートを借りてみるのも一つの手です。</p>
  <p style="margin: 0 0 8px 0;">
    [PR] 
    <a href="https://px.a8.net/svt/ejp?a8mat=2ZTT9A+D2Y8MQ+1W34+C8VWY" rel="nofollow" style="color: #0066cc; text-decoration: underline; font-weight: bold;">かいご畑（未経験・無資格からでも安心のサポート）</a>
    <img border="0" width="1" height="1" src="https://www17.a8.net/0.gif?a8mat=2ZTT9A+D2Y8MQ+1W34+C8VWY" alt="">
  </p>
</div>`
};

const RESUMAP_BLOCK = {
    _type: 'affiliateEmbed',
    provider: 'レジュマップ',
    label: 'レジュマップ履歴書作成ツール',
    linkKey: 'resumap-interview',
    html: `<div style="background: linear-gradient(135deg, #fdfbf7 0%, #f4eee1 100%); border: 1px solid #e2d2b5; border-radius: 8px; padding: 16px; margin: 16px 0;">
  <p style="margin: 0 0 12px 0; color: #3d3b38; line-height: 1.6;">面接対策の第一歩は、見やすく丁寧な履歴書・職務経歴書を用意することです。作成で悩んでいる場合は、スマホで簡単に作れるツールを使ってみると、少し心が軽くなりますよ。</p>
  <p style="margin: 0 0 8px 0;">
    [PR] 
    <a href="//af.moshimo.com/af/c/click?a_id=5329936&p_id=7266&pc_id=20832&pl_id=91572" rel="nofollow" referrerpolicy="no-referrer-when-downgrade" style="color: #0066cc; text-decoration: underline; font-weight: bold;">レジュマップ履歴書・職務経歴書作成ツール</a>
    <img src="//i.moshimo.com/af/i/impression?a_id=5329936&p_id=7266&pc_id=20832&pl_id=91572" width="1" height="1" style="border:none;" loading="lazy">
  </p>
</div>`
};

async function patchPost(slug, affiliateBlock) {
    console.log(`\nProcessing: ${slug}...`)
    const post = await client.fetch(`*[_type == "post" && slug.current == $slug][0] { _id, title, body }`, { slug })
    if (!post) {
        console.log(`❌ Post not found: ${slug}`)
        return false
    }
    console.log(`Found post: "${post.title}"`)

    // Check if the block is already there to avoid duplicates
    const hasBlock = post.body.some(b => b._type === 'affiliateEmbed' && b.provider === affiliateBlock.provider)
    if (hasBlock) {
        console.log(`⚠️ Affiliate block for ${affiliateBlock.provider} already exists. Skipping.`)
        return true
    }

    // Insert block specifically before the "まとめ" section if it exists
    let insertIndex = post.body.findIndex(b => b._type === 'block' && b.style === 'h2' && b.children && b.children[0] && b.children[0].text === 'まとめ')

    // Assign a unique key
    const blockToInsert = { ...affiliateBlock, _key: generateKey(`affiliate-${affiliateBlock.linkKey}`) }

    const newBody = [...post.body]
    if (insertIndex !== -1) {
        console.log(`Inserting before "まとめ" (index: ${insertIndex})`)
        newBody.splice(insertIndex, 0, blockToInsert)
    } else {
        console.log(`"まとめ" not found, appending to the end`)
        newBody.push(blockToInsert)
    }

    try {
        console.log(`Patching post ID: ${post._id}...`)
        await client.patch(post._id).set({ body: newBody }).commit()
        console.log(`✅ Update successful!`)
        return true
    } catch (err) {
        console.error(`❌ Update failed:`, err.message)
        return false
    }
}

async function main() {
    console.log("Starting Sanity patch...")

    // 1. nursing-assistant-colleague-relationships -> Kaigobatake
    await patchPost('nursing-assistant-colleague-relationships', KAIGOBATAKE_BLOCK)

    // 2. nursing-assistant-interview-tips-compass -> Resu-map (using correct slug found from GSC)
    await patchPost('nursing-assistant-interview-tips-compass', RESUMAP_BLOCK)

    // Additionally, checking nursing-assistant-interview-questions-answers just in case
    await patchPost('nursing-assistant-interview-questions-answers', RESUMAP_BLOCK)

    console.log("\nDone!")
}

main().catch(console.error)
