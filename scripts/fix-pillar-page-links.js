require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

async function main() {
    const query = `*[_type == "post" && slug.current == "nursing-assistant-interview-resume-roadmap"][0]`
    const post = await client.fetch(query)

    if (!post) {
        console.error("Post not found.")
        return
    }
    const draftId = post._id

    let newBody = []

    // Map the references we set earlier to slugs
    // 'Jx7ptA0c3Aq7il8T99H2e2' -> nursing-assistant-resume-writing
    // 'kWkIvI7T6XFbABGiW9XxMs' -> nursing-assistant-appeal-physical-strength
    // 'G2Y6JXdwXQRnotb29XN0sj' -> nursing-assistant-interview-questions-answers

    const refToSlug = {
        'Jx7ptA0c3Aq7il8T99H2e2': 'nursing-assistant-resume-writing',
        'kWkIvI7T6XFbABGiW9XxMs': 'nursing-assistant-appeal-physical-strength',
        'G2Y6JXdwXQRnotb29XN0sj': 'nursing-assistant-interview-questions-answers'
    }

    for (let i = 0; i < post.body.length; i++) {
        const block = post.body[i]

        // Skip paragraphs that are just AI placeholder texts
        if (block._type === 'block' && block.children) {
            const isPlaceholder = block.children.some(c => c.text && (c.text.includes('※内部リンク予定箇所') || c.text.includes('※内部リンク')))
            if (isPlaceholder) {
                console.log('Removed placeholder block.')
                continue // don't push to newBody
            }
        }

        // Change internalLink to link
        if (block.markDefs && block.markDefs.length > 0) {
            const hasInternalLinks = block.markDefs.some(m => m._type === 'internalLink')
            if (hasInternalLinks) {
                block.markDefs = block.markDefs.map(def => {
                    if (def._type === 'internalLink') {
                        const refId = def.reference && def.reference._ref ? def.reference._ref : ''
                        const slug = refToSlug[refId]
                        if (slug) {
                            return {
                                _key: def._key,
                                _type: 'link',
                                href: `/posts/${slug}`
                            }
                        }
                    }
                    return def
                })
                console.log('Fixed an internal link markDef.')
            }
        }

        newBody.push(block)
    }

    console.log(`Patching document ${draftId}...`)
    try {
        await client.patch(draftId)
            .set({ body: newBody })
            .commit()
        console.log("✅ Success! Fixed internal links and stripped placeholders.")
    } catch (e) {
        console.error("Failed to patch:", e.message)
    }
}

main().catch(console.error)
