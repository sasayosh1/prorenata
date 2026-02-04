

const fs = require('fs')
const path = require('path')
const { createClient } = require('@sanity/client')
const matter = require('gray-matter')
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

async function uploadDraft() {
    // Command line argument support: node scripts/upload-rewrite.js [filePath]
    const targetFile = process.argv[2] || 'drafts/nursing-assistant-nightshift-fatigue.md'
    const filePath = path.resolve(__dirname, '..', targetFile)

    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`)
        process.exit(1)
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const { data: frontmatter, content } = matter(fileContent)
    const lines = content.split('\n')

    let title = frontmatter.title || ''
    const blocks = []

    // Default slug fallback
    let currentSlug = frontmatter.slug || path.basename(filePath, '.md')

    // Helper to parse line for links and bold
    const parseLine = (text) => {
        const children = []
        const markDefs = []
        let lastIndex = 0

        // Robust Regex for markdown links: [Text](URL)
        // Groups: 1=Text, 2=URL
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
        let match

        while ((match = linkRegex.exec(text)) !== null) {
            // Push text before link
            if (match.index > lastIndex) {
                children.push({
                    _key: Math.random().toString(36).substring(7),
                    _type: 'span',
                    text: text.substring(lastIndex, match.index)
                })
            }

            // Process URL (Fix protocol relative)
            let href = match[2]
            if (href.startsWith('//')) {
                href = 'https:' + href
            }

            const linkKey = Math.random().toString(36).substring(7)
            markDefs.push({
                _key: linkKey,
                _type: 'link',
                href: href
            })

            children.push({
                _key: Math.random().toString(36).substring(7),
                _type: 'span',
                text: match[1],
                marks: [linkKey]
            })

            lastIndex = linkRegex.lastIndex
        }

        // Push remaining text
        if (lastIndex < text.length) {
            children.push({
                _type: 'span',
                text: text.substring(lastIndex)
            })
        }

        return { children, markDefs }
    }

    // Simple Markdown Parser (Body)
    lines.forEach(line => {
        // ... (Parsing logic remains mostly same, just ensuring we don't double-parse title if it's in body)
        // If the first line is H1 and matches frontmatter title, skip it to avoid duplication
        const trimmedLine = line.trim()
        if (line.startsWith('# ') && !title) {
            title = line.replace('# ', '').trim()
            return
        }
        if (line.startsWith('# ') && title && line.replace('# ', '').trim() === title) {
            return
        }

        if (!trimmedLine) return

        if (line.startsWith('## ')) {
            blocks.push({
                _type: 'block',
                style: 'h2',
                children: [{ _type: 'span', text: line.replace('## ', '').trim() }]
            })
        } else if (line.startsWith('### ')) {
            blocks.push({
                _type: 'block',
                style: 'h3',
                children: [{ _type: 'span', text: line.replace('### ', '').trim() }]
            })
        } else if (line.startsWith('- ')) {
            const { children, markDefs } = parseLine(line.replace('- ', '').trim())
            blocks.push({
                _type: 'block',
                style: 'normal',
                listItem: 'bullet',
                children,
                markDefs
            })
        } else {
            const { children, markDefs } = parseLine(trimmedLine)
            blocks.push({
                _type: 'block',
                style: 'normal',
                children,
                markDefs
            })
        }
    })

    // Add keys
    const body = blocks.map(block => ({
        ...block,
        _key: Math.random().toString(36).substring(7)
    }))

    console.log(`📝 Uploading: ${title} (Slug: ${currentSlug})`)
    if (frontmatter.excerpt) console.log(`   Excerpt: ${frontmatter.excerpt.substring(0, 30)}...`)

    // Fetch category
    let categoryMatches = []
    if (frontmatter.categories) {
        // Try to match category name provided in frontmatter
        const catName = Array.isArray(frontmatter.categories) ? frontmatter.categories[0] : frontmatter.categories
        categoryMatches = await client.fetch(`*[_type == "category" && title == $catName]`, { catName })
    }

    // Fallback category
    if (categoryMatches.length === 0) {
        categoryMatches = [await client.fetch('*[_type == "category"][0]')]
    }

    const author = await client.fetch('*[_type == "author" && slug.current == "sasayoshi"][0]') || await client.fetch('*[_type == "author"][0]')

    const doc = {
        _type: 'post',
        title: title,
        slug: { _type: 'slug', current: currentSlug },
        excerpt: frontmatter.excerpt, // Integrated User-Defined Excerpt
        metaDescription: frontmatter.metaDescription || frontmatter.excerpt,
        body: body,
        categories: categoryMatches.map(c => ({ _type: 'reference', _ref: c._id, _key: Math.random().toString(36).substring(7) })),
        tags: frontmatter.tags || [], // Integrated Tags
        author: author ? { _type: 'reference', _ref: author._id } : undefined,
        publishedAt: new Date().toISOString(),
        internalOnly: frontmatter.internalOnly || false,
        maintenanceLocked: true // Lock it immediately to prevent accidental overwrites if script is re-enabled
    }

    // Check if exists to update or create
    // First, check if there is an existing published document with this slug
    const existingDoc = await client.fetch('*[_type == "post" && slug.current == $slug && !(_id in path("drafts.**"))][0]', { slug: currentSlug })

    let targetId = `drafts.${currentSlug}`
    if (existingDoc) {
        console.log(`ℹ️  Found existing published document: ${existingDoc._id}`)
        targetId = `drafts.${existingDoc._id}`
    }

    const result = await client.createOrReplace({
        ...doc,
        _id: targetId
    })

    console.log('✅ Upload success:', result._id)
}

uploadDraft().catch(err => {
    console.error('❌ Error:', err)
    process.exit(1)
})
