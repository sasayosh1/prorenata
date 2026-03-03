require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

/**
 * Helper to extract plain text from Portable Text blocks
 */
function toPlainText(blocks = []) {
    return blocks
        // loop through each block
        .map(block => {
            // if it's not a text block with children, 
            // return nothing
            if (block._type !== 'block' || !block.children) {
                return ''
            }
            // loop through the children spans, and join the
            // text strings
            return block.children.map(child => child.text || '').join('')
        })
        // join the paragraphs leaving split by two linebreaks
        .join('\n\n')
}

async function main() {
    console.log("Starting missing meta description audit and update...")

    // Find articles that are missing a metaDescription
    const query = `*[_type == "post" && !(_id in path("drafts.**")) && (!defined(metaDescription) || metaDescription == "")] { _id, title, slug, body }`

    const posts = await client.fetch(query)
    console.log(`Found ${posts.length} posts missing a meta description.`)

    if (posts.length === 0) {
        console.log("All posts have meta descriptions. Nothing to do!")
        return;
    }

    for (const post of posts) {
        console.log(`\nProcessing: ${post.title}`)

        if (!post.body || !Array.isArray(post.body)) {
            console.log(`⚠️ No body array found to extract text from. Skipping.`)
            continue
        }

        const plainText = toPlainText(post.body)

        // Target around 120-140 characters for SEO, ensuring we don't cut off words awkwardly if possible
        let newDescription = plainText.replace(/[\n\r]+/g, ' ').trim().substring(0, 130)

        // Add ellipsis if it was cut off
        if (plainText.length > 130) {
            newDescription += '...'
        }

        if (!newDescription) {
            console.log(`⚠️ Could not extract text. Skipping.`)
            continue
        }

        console.log(`Generated Meta: "${newDescription}"`)

        try {
            console.log(`Patching post ID: ${post._id}...`)
            await client.patch(post._id).set({ metaDescription: newDescription }).commit()
            console.log(`✅ Update successful!`)
        } catch (err) {
            console.error(`❌ Update failed:`, err.message)
        }
    }

    console.log("\nDone!")
}

main().catch(console.error)
