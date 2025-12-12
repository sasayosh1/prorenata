require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const { createBackup } = require('./backup-utility')

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

const SLUG = 'nursing-assistant-real-salary-example'

async function main() {
    console.log(`🚀 Starting Critical Fix for ${SLUG}...\n`)

    const article = await client.fetch(`
    *[_type == "post" && slug.current == $slug][0] {
      _id,
      title,
      body
    }
  `, { slug: SLUG })

    if (!article) {
        console.error(`❌ Article not found: ${SLUG}`)
        return
    }

    await createBackup(article._id, 'fix-critical-summary')

    // Check if summary already exists (double check)
    const hasSummary = article.body.some(b =>
        b.style === 'h2' && b.children?.[0]?.text === 'まとめ'
    )

    if (hasSummary) {
        console.log('⚠️ Summary section already exists. Skipping.')
        return
    }

    // Create new summary section
    const summaryBlocks = [
        {
            _type: 'block',
            style: 'h2',
            _key: `summary-head-${Date.now()}`,
            children: [{ _type: 'span', text: 'まとめ' }]
        },
        {
            _type: 'block',
            style: 'normal',
            _key: `summary-body-${Date.now()}`,
            children: [{
                _type: 'span',
                text: '今回は、看護助手のリアルな給料明細と、収入を左右するポイントについて解説しました。'
            }]
        },
        {
            _type: 'block',
            style: 'normal',
            _key: `summary-list-intro-${Date.now()}`,
            children: [{ _type: 'span', text: '記事のポイントを振り返ります。' }]
        },
        {
            _type: 'block',
            listItem: 'bullet',
            level: 1,
            _key: `summary-point-1-${Date.now()}`,
            children: [{ _type: 'span', text: '看護助手の給料は、夜勤の有無や勤務形態（常勤・パート）によって大きく変わる' }]
        },
        {
            _type: 'block',
            listItem: 'bullet',
            level: 1,
            _key: `summary-point-2-${Date.now()}`,
            children: [{ _type: 'span', text: '手取り額は額面から約2割ほど引かれることを想定しておく' }]
        },
        {
            _type: 'block',
            listItem: 'bullet',
            level: 1,
            _key: `summary-point-3-${Date.now()}`,
            children: [{ _type: 'span', text: '賞与（ボーナス）や処遇改善加算の実績も、年収に大きく影響する' }]
        },
        {
            _type: 'block',
            style: 'normal',
            _key: `summary-closing-${Date.now()}`,
            children: [{
                _type: 'span',
                text: '給料は生活を支える大切な要素です。求人票を見る際は、月給だけでなく「手当」や「賞与」の欄もしっかり確認して、納得のいく職場選びをしてくださいね。'
            }]
        }
    ]

    // Insert before "Related Articles" or "Disclaimer" if they exist, otherwise at the end
    let insertIndex = article.body.length

    const relatedIndex = article.body.findIndex(b =>
        (b.style === 'h2' || b.style === 'h3') && b.children?.[0]?.text?.includes('あわせて読みたい')
    )

    const disclaimerIndex = article.body.findIndex(b =>
        JSON.stringify(b).includes('免責事項')
    )

    if (relatedIndex !== -1) {
        insertIndex = relatedIndex
    } else if (disclaimerIndex !== -1) {
        insertIndex = disclaimerIndex
    }

    const newBody = [...article.body]
    newBody.splice(insertIndex, 0, ...summaryBlocks)

    await client
        .patch(article._id)
        .set({ body: newBody })
        .commit()

    console.log(`✅ Successfully added summary section to ${article.title}`)
}

main().catch(console.error)
