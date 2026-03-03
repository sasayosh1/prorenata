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

function createInternalLinkBlock(targetTitle, targetSlug) {
    const linkKey = generateKey('markDef')
    return {
        _key: generateKey('internal-link'),
        _type: 'block',
        style: 'normal',
        children: [
            {
                _key: generateKey('span-intro'),
                _type: 'span',
                marks: [],
                text: "📌 あわせて読みたい： "
            },
            {
                _key: generateKey('span-title'),
                _type: 'span',
                marks: [linkKey, "strong"],
                text: targetTitle
            }
        ],
        markDefs: [
            {
                _key: linkKey,
                _type: 'link',
                href: `/posts/${targetSlug.current}`
            }
        ]
    }
}

async function main() {
    console.log("Starting automated internal linking for interview/resume cluster...")

    const query = `*[_type == "post" && !(_id in path("drafts.**")) && (
        title match "*面接*" || 
        title match "*職務経歴書*" || 
        title match "*履歴書*" || 
        title match "*志望動機*"
    )] { _id, title, slug, body }`

    const posts = await client.fetch(query)
    console.log(`Found ${posts.length} posts in this cluster.`)

    if (posts.length < 2) {
        console.log("Not enough posts to cross-link. Aborting.")
        return
    }

    for (let i = 0; i < posts.length; i++) {
        const post = posts[i]
        console.log(`\nProcessing: ${post.title}`)

        // Find 2 other posts to link to
        const relatedPosts = posts.filter(p => p._id !== post._id).slice(0, 2)

        // Check if internal links already exist in this post to avoid duplicates
        const hasRelatedLinks = post.body.some(b =>
            b._type === 'block' &&
            b.children &&
            b.children.some(c => c.text && c.text.includes("あわせて読みたい"))
        )

        if (hasRelatedLinks) {
            console.log(`⚠️ Related links block already exists. Skipping.`)
            continue
        }

        const newBlocks = []
        for (const related of relatedPosts) {
            newBlocks.push(createInternalLinkBlock(related.title, related.slug))
        }

        let insertIndex = post.body.findIndex(b => b._type === 'block' && b.style === 'h2' && b.children && b.children[0] && b.children[0].text === 'まとめ')

        const newBody = [...post.body]
        if (insertIndex !== -1) {
            console.log(`Inserting before "まとめ" (index: ${insertIndex})`)
            newBody.splice(insertIndex, 0, ...newBlocks)
        } else {
            console.log(`"まとめ" not found, appending to the end`)
            newBody.push(...newBlocks)
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
