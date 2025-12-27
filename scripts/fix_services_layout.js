const { createClient } = require('@sanity/client')

const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN
if (!token) {
    console.error('Error: Missing Sanity token. Set SANITY_WRITE_TOKEN (preferred) or SANITY_API_TOKEN / SANITY_TOKEN.')
    process.exit(1)
}

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
    token: token,
})

const SLUG = 'nursing-assistant-compare-services-perspective'

async function run() {
    console.log(`\n🔍 Fetching article: ${SLUG}`)

    try {
        const query = `*[_type == "post" && slug.current == $slug][0]`
        const doc = await client.fetch(query, { slug: SLUG })

        if (!doc) {
            console.error(`❌ Post not found: ${SLUG}`)
            return
        }

        let newBody = [...doc.body]
        let modifiedCount = 0

        // iterate carefully
        newBody = newBody.map(block => {
            // 1. Fix Speech Bubble
            if (block._type === 'speechBubble') {
                const needsFixSpeaker = block.speaker === 'セラ'
                const needsFixText = block.speech !== undefined && !block.text

                if (needsFixSpeaker || needsFixText) {
                    console.log(`\t🔧 Fixing Speech Bubble (${block._key})`)
                    const newBlock = { ...block }

                    if (needsFixSpeaker) {
                        newBlock.speaker = 'sera'
                        console.log('\t   - Fixed speaker: sera')
                    }
                    if (needsFixText) {
                        newBlock.text = block.speech
                        delete newBlock.speech
                        console.log('\t   - Fixed key: speech -> text')
                    }
                    modifiedCount++
                    return newBlock
                }
            }

            // 2. Fix Human Life Care Link
            if (block._type === 'affiliateEmbed' && block.linkKey === 'humanlifecare') {
                if (block.html && !block.html.includes('text-decoration: underline')) {
                    console.log(`\t🔧 Fixing Human Life Care Link Style (${block._key})`)
                    // Add style to the <a> tag
                    const fixedHtml = block.html.replace(
                        '<a href=',
                        '<a style="color: #0066cc; text-decoration: underline;" href='
                    )
                    modifiedCount++
                    return { ...block, html: fixedHtml }
                }
            }

            return block
        })

        if (modifiedCount > 0) {
            console.log(`\t📝 Applying ${modifiedCount} fixes...`)
            await client
                .patch(doc._id)
                .set({ body: newBody })
                .commit()
            console.log(`🎉 Successfully patched ${SLUG}.`)
        } else {
            console.log(`ℹ️ No fixes needed for ${SLUG}.`)
        }

    } catch (err) {
        console.error(`❌ Error: ${err.message}`)
    }
}

run()
