require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const https = require('https')
const http = require('http')

const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

// Helper to check URL status
function checkUrlStatus(url) {
    return new Promise((resolve) => {
        // Skip affiliate tracking links as they often block programmatic access or redirect complexly
        if (url.includes('a8.net') || url.includes('moshimo.com') || url.includes('px.a8.net')) {
            return resolve({ status: 'Skipped (Affiliate)' })
        }

        const protocol = url.startsWith('https') ? https : http
        const req = protocol.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 5000 // 5 seconds
        }, (res) => {
            if (res.statusCode >= 400 && res.statusCode !== 403) { // 403 often means anti-bot
                resolve({ status: res.statusCode, ok: false })
            } else {
                resolve({ status: res.statusCode, ok: true })
            }
        }).on('error', (err) => {
            resolve({ status: err.message, ok: false })
        }).on('timeout', () => {
            req.destroy()
            resolve({ status: 'Timeout', ok: false })
        })
    })
}

async function main() {
    console.log("Starting Sub-zero Cost Site Audit for Links and Promotions...")

    // Fetch all posts (excluding drafts). 
    // Usually we would sort by Views internally if we had that, but we'll check all content.
    const query = `*[_type == "post" && !(_id in path("drafts.**"))] { _id, title, slug, body }`
    const posts = await client.fetch(query)

    console.log(`Fetched ${posts.length} live posts for auditing.\n`)

    const reports = {
        plaintextLinks: [],
        deadLinks: [],
        missingPromos: []
    }

    // Known PR keywords mapping to specific Affiliates
    const promoRules = [
        {
            keywords: ['面接', '履歴書', '志望動機', '職務経歴書'],
            requiredProvider: 'レジュマップ',
            type: 'interview'
        },
        {
            keywords: ['人間関係', '辞めたい', '限界', '最悪', 'いじめ'],
            requiredProvider: 'かいご畑',
            type: 'resignation'
        }
    ]

    for (const post of posts) {
        if (!post.body) continue;

        let postText = ''
        let hasKaigobatake = false
        let hasResumap = false
        const urlsToCheck = new Set()

        // 1. Analyze blocks
        for (const block of post.body) {
            // Check for PR blocks
            if (block._type === 'affiliateEmbed') {
                if (block.provider === 'かいご畑') hasKaigobatake = true
                if (block.provider === 'レジュマップ') hasResumap = true
            }

            if (block._type === 'block' && block.children) {
                for (const child of block.children) {
                    if (child.text) {
                        postText += child.text + ' '

                        // Detect plain-text HTTP URLs
                        // A URL might be plain text if an 'http' string exists but it lacks a link markDef.
                        const urlRegex = /(https?:\/\/[^\s]+)/g;
                        let match;
                        while ((match = urlRegex.exec(child.text)) !== null) {
                            const urlStr = match[0]

                            // Check if this child has marks that map to a 'link' def
                            const hasLinkMark = child.marks && block.markDefs && block.markDefs.some(def => def._type === 'link' && child.marks.includes(def._key))

                            if (!hasLinkMark) {
                                reports.plaintextLinks.push({
                                    title: post.title,
                                    slug: post.slug.current,
                                    textSnippet: urlStr
                                })
                            }
                        }
                    }
                }

                // Collect explicit URLs to check for 404s
                if (block.markDefs) {
                    for (const def of block.markDefs) {
                        if (def._type === 'link' && def.href) {
                            // Internal routing check
                            if (def.href.startsWith('/posts/')) {
                                // Assume it's an internal Sanity link
                                const targetSlug = def.href.replace('/posts/', '')
                                const targetExists = posts.some(p => p.slug.current === targetSlug)
                                if (!targetExists) {
                                    reports.deadLinks.push({
                                        title: post.title,
                                        slug: post.slug.current,
                                        url: def.href,
                                        status: '404 (Internal Missing)'
                                    })
                                }
                            } else if (def.href.startsWith('http')) {
                                urlsToCheck.add(def.href)
                            }
                        }
                    }
                }
            }
        }

        // 2. Check 404s for external explicit URLs
        for (const url of urlsToCheck) {
            const res = await checkUrlStatus(url)
            if (!res.ok && res.status !== 'Skipped (Affiliate)') {
                reports.deadLinks.push({
                    title: post.title,
                    slug: post.slug.current,
                    url: url,
                    status: res.status
                })
            }
        }

        // 3. Check for Missing PR Opportunities based on context
        const searchTarget = post.title + ' ' + postText
        for (const rule of promoRules) {
            const hasKeyword = rule.keywords.some(kw => searchTarget.includes(kw))
            if (hasKeyword) {
                if (rule.requiredProvider === 'レジュマップ' && !hasResumap) {
                    reports.missingPromos.push({
                        title: post.title,
                        slug: post.slug.current,
                        missing: 'レジュマップ',
                        reason: 'Interview/Resume keywords found'
                    })
                }
                if (rule.requiredProvider === 'かいご畑' && !hasKaigobatake) {
                    // Check if it has something equivalent to avoid false positives?
                    // Let's just flag it for review
                    reports.missingPromos.push({
                        title: post.title,
                        slug: post.slug.current,
                        missing: 'かいご畑',
                        reason: 'Resignation/Relationship keywords found'
                    })
                }
            }
        }
    }

    console.log("=== 🔍 AUDIT RESULTS ===")
    console.log(`\\n--- 🚨 プレーンテキスト化しているリンク (${reports.plaintextLinks.length}件) ---`)
    reports.plaintextLinks.slice(0, 5).forEach(r => console.log(`- [${r.title}] ${r.textSnippet}`))
    if (reports.plaintextLinks.length > 5) console.log(`...and ${reports.plaintextLinks.length - 5} more`)

    console.log(`\\n--- 💀 デッドリンク / 404エラー (${reports.deadLinks.length}件) ---`)
    reports.deadLinks.forEach(r => console.log(`- [${r.title}] ${r.url} (Status: ${r.status})`))

    console.log(`\\n--- 💰 収益化機会の損失 (PR未配置) (${reports.missingPromos.length}件) ---`)
    // Remove duplicates if the same post triggers multiple missing promos
    const uniqueMissing = {};
    reports.missingPromos.forEach(r => {
        if (!uniqueMissing[r.slug]) uniqueMissing[r.slug] = [];
        uniqueMissing[r.slug].push(r.missing);
    });

    Object.keys(uniqueMissing).forEach(slug => {
        const finding = reports.missingPromos.find(r => r.slug === slug)
        console.log(`- [${finding.title}] Missing: ${[...new Set(uniqueMissing[slug])].join(', ')}`)
    })

    console.log("\nAudit complete.")
}

main().catch(console.error)
