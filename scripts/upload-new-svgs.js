require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const fs = require('fs')
const path = require('path')
const { createBackup } = require('./backup-utility')
const { inboxDir } = require('./utils/antigravityPaths.cjs')

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

// Read from the local inbox (generated assets live outside the repo).
const DIAGRAM_DIR = inboxDir('prorenata', 'diagrams')

const MAPPINGS = [
    {
        filename: 'resume_checklist.svg',
        slug: 'nursing-assistant-resume-writing',
        alt: '履歴書作成の重要チェックポイント',
        targetSection: '履歴書' // Keyword to find section
    },
    {
        filename: 'interview_flow.svg',
        slug: 'nursing-assistant-interview-questions-answers',
        alt: '面接当日の流れ',
        targetSection: '面接' // Keyword to find section
    },
    {
        filename: 'transfer_safety.svg',
        slug: 'nursing-assistant-patient-transfer-safety',
        alt: '移乗介助の安全確認フロー',
        targetSection: '基本' // Keyword to find section
    }
]

async function uploadImage(filename) {
    const filePath = path.join(DIAGRAM_DIR, filename)
    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`)
        return null
    }

    console.log(`📤 Uploading ${filename}...`)
    const buffer = fs.readFileSync(filePath)
    return client.assets.upload('image', buffer, {
        filename: filename
    })
}

async function insertImageToArticle(mapping, assetId) {
    console.log(`\n🔧 Processing ${mapping.slug}...`)

    const article = await client.fetch(`
    *[_type == "post" && slug.current == $slug][0] {
      _id,
      title,
      body
    }
  `, { slug: mapping.slug })

    if (!article) {
        console.error(`❌ Article not found: ${mapping.slug}`)
        return
    }

    await createBackup(article._id, 'insert-svg-diagram')

    // Check if diagram already exists
    const existingBlockIndex = article.body.findIndex(b =>
        b._type === 'image' && b.alt === mapping.alt
    )

    const newBody = [...article.body]

    if (existingBlockIndex !== -1) {
        console.log(`🔄 Updating existing diagram at index ${existingBlockIndex}`)
        newBody[existingBlockIndex] = {
            ...newBody[existingBlockIndex],
            asset: {
                _type: 'reference',
                _ref: assetId
            }
        }
    } else {
        // Find insertion point
        let insertIndex = 0

        // Try to find a relevant H2 section
        const sectionIndex = article.body.findIndex(b =>
            (b.style === 'h2' || b.style === 'h3') &&
            JSON.stringify(b).includes(mapping.targetSection)
        )

        if (sectionIndex !== -1) {
            insertIndex = sectionIndex + 1
            console.log(`📍 Inserting after section matching "${mapping.targetSection}"`)
        } else {
            // Default to after the first paragraph
            insertIndex = 1
            console.log(`📍 Inserting at top (section not found)`)
        }

        const imageBlock = {
            _type: 'image',
            _key: `diagram-${Date.now()}`,
            asset: {
                _type: 'reference',
                _ref: assetId
            },
            alt: mapping.alt
        }

        newBody.splice(insertIndex, 0, imageBlock)
    }

    await client
        .patch(article._id)
        .set({ body: newBody })
        .commit()

    console.log(`✅ Updated diagram in ${article.title}`)
}

async function main() {
    console.log('🚀 Starting SVG Diagram Integration...\n')

    for (const mapping of MAPPINGS) {
        try {
            const asset = await uploadImage(mapping.filename)
            if (asset) {
                await insertImageToArticle(mapping, asset._id)
            }
        } catch (error) {
            console.error(`❌ Error processing ${mapping.filename}:`, error.message)
        }
    }

    console.log('\n✨ All operations completed!')
}

main().catch(console.error)
