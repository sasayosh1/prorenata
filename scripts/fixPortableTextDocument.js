require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const fs = require('fs').promises
const crypto = require('crypto')

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

// ★ここを書き換えて、実際の _id を入れてください
const DOCUMENT_ID = process.argv[2] || 'post;564dbbc5-46a3-45bd-8261-9c1fc88d1948'

function makeKey() {
    // Portable Text の _key は 12〜16 文字くらいの英数字が多いのでそれっぽく生成
    return crypto.randomBytes(8).toString('hex')
}

async function main() {
    if (!client.config().token) {
        throw new Error('SANITY_API_TOKEN が設定されていません')
    }

    console.log(`Fetching document: ${DOCUMENT_ID}`)
    const doc = await client.getDocument(DOCUMENT_ID)

    if (!doc) {
        throw new Error(`Document not found: ${DOCUMENT_ID}`)
    }

    // バックアップ保存
    const backupPath = `backup-${DOCUMENT_ID.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`
    await fs.writeFile(backupPath, JSON.stringify(doc, null, 2), 'utf8')
    console.log(`Backup saved to ${backupPath}`)

    const originalBody = Array.isArray(doc.body) ? doc.body : []

    const filtered = originalBody.filter((block) => {
        if (!block) return false

        // speechBubble は schema に無いので一旦削除してエラー回避
        if (block._type === 'speechBubble') {
            console.log('Removed speechBubble block with key:', block._key)
            return false
        }

        return true
    })

    const fixedBody = filtered.map((block) => {
        if (!block._key) {
            const newKey = makeKey()
            console.log('Added missing _key:', newKey, 'for block type:', block._type)
            return { ...block, _key: newKey }
        }
        return block
    })

    console.log(`Original body length: ${originalBody.length}`)
    console.log(`Fixed body length   : ${fixedBody.length}`)

    console.log('Patching document in Sanity...')
    const updated = await client
        .patch(DOCUMENT_ID)
        .set({ body: fixedBody })
        .commit()

    console.log('Patch committed. Document _rev:', updated._rev)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
