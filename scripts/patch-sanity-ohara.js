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

const OHARA_BLOCK = {
    _type: 'affiliateEmbed',
    provider: '資格の大原',
    label: '資格の大原（介護福祉士実務者研修）',
    linkKey: 'ohara-qualification',
    html: `<div style="background: linear-gradient(135deg, #fdfbf7 0%, #f4eee1 100%); border: 1px solid #e2d2b5; border-radius: 8px; padding: 16px; margin: 16px 0;">
  <p style="margin: 0 0 12px 0; color: #3d3b38; line-height: 1.6;">看護助手から一歩踏み出して、給与アップや正社員への「出口（キャリアアップ）」を考えたとき、介護の国家資格は一番の武器になります。大原なら通信教育と最短6日間のスクーリングでサクッと資格を目指せるので、まずはどんなものかパンフレットだけ取り寄せてみるのも良い手です。</p>
  <p style="margin: 0 0 8px 0;">
    [PR] 
    <a href="https://px.a8.net/svt/ejp?a8mat=3Z9NZY+4C1QHM+4O3S+5ZMCH" rel="nofollow" style="color: #0066cc; text-decoration: underline; font-weight: bold;">「資格の大原」介護福祉士実務者研修（無料資料請求）</a>
    <img border="0" width="1" height="1" src="https://www16.a8.net/0.gif?a8mat=3Z9NZY+4C1QHM+4O3S+5ZMCH" alt="">
  </p>
</div>`
};

async function main() {
    console.log("Starting bulk insertion of Ohara affiliate links...")

    // Find articles related to career up, qualifications, future, salary
    const query = `*[_type == "post" && !(_id in path("drafts.**")) && (
        title match "*資格*" || 
        title match "*キャリア*" || 
        title match "*給料*" || 
        title match "*正社員*" ||
        title match "*将来*"
    )] { _id, title, slug, body }`

    const posts = await client.fetch(query)
    console.log(`Found ${posts.length} target posts for Ohara link.`)

    for (const post of posts) {
        console.log(`\nProcessing: ${post.title}`)

        // Ensure body is an array before processing
        if (!post.body || !Array.isArray(post.body)) {
            console.log(`⚠️ No body array found. Skipping.`)
            continue
        }

        // Check if the Ohara block or similar already exists
        const hasBlock = post.body.some(b => b._type === 'affiliateEmbed' && (b.provider === '資格の大原' || b.provider.includes('大原')))
        if (hasBlock) {
            console.log(`⚠️ Ohara affiliate block already exists. Skipping.`)
            continue
        }

        // Assign a unique key
        const blockToInsert = { ...OHARA_BLOCK, _key: generateKey(`affiliate-ohara`) }

        // Insert before the "まとめ" section if it exists
        let insertIndex = post.body.findIndex(b => b._type === 'block' && b.style === 'h2' && b.children && b.children[0] && b.children[0].text === 'まとめ')

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
        } catch (err) {
            console.error(`❌ Update failed:`, err.message)
        }
    }

    console.log("\nDone!")
}

main().catch(console.error)
