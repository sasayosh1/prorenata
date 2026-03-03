require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

const FIX_MAPPINGS = {
    'nursing-assistant-night-shift-journey': {
        targetPhrase: '夜勤・交代制勤務に関するガイドライン',
        newHref: 'https://www.nurse.or.jp/nursing/shuroanzen/yakin/guideline/index.html' // Highly relevant JNA Guideline
    },
    'nursing-assistant-stressful-relationships-solutions': {
        targetPhrase: '厚生労働省の調査によると',
        newHref: 'https://www.mhlw.go.jp/toukei/list/14-1.html' // 雇用動向調査 (Employment Trends)
    },
    'nursing-assistant-daily-schedule': {
        targetPhrase: '医療施設調査',
        newHref: 'https://www.mhlw.go.jp/toukei/list/79-1.html' // 医療施設調査
    },
    'nursing-assistant-no-experience-insights': {
        targetPhrase: '厚生労働省のデータ',
        newHref: 'https://www.mhlw.go.jp/toukei/list/l1-1.html' // 賃金構造基本統計調査 (Has age data)
    },
    'nursing-assistant-nursing-school-prep': {
        targetPhrase: '職業情報提供サイト',
        newHref: 'https://shigoto.mhlw.go.jp/User/Occupation/Detail/135' // O-NET job tag for Nursing Assistant
    },
    'nursing-assistant-night-shift-practical': {
        targetPhrase: 'ガイドラインや',
        newHref: 'https://www.nurse.or.jp/nursing/shuroanzen/yakin/guideline/index.html' // JNA Night shift guidelines
    }
}

async function main() {
    console.log("Restoring pinpoint accurate MHLW / Evidence links...")

    // Fetch the specific posts
    const slugs = Object.keys(FIX_MAPPINGS)
    const query = `*[_type == "post" && slug.current in $slugs] { _id, title, slug, body }`
    const posts = await client.fetch(query, { slugs })

    for (const post of posts) {
        if (!post.body) continue

        const slug = post.slug.current
        const rule = FIX_MAPPINGS[slug]
        let newBody = JSON.parse(JSON.stringify(post.body))
        let modified = false

        for (let i = 0; i < newBody.length; i++) {
            const block = newBody[i]

            // If the block contains text that matches our target phrase...
            const blockText = block.children ? block.children.map(c => c.text).join('') : ''

            if (block.markDefs && block.markDefs.length > 0 && blockText.includes(rule.targetPhrase)) {
                block.markDefs.forEach(def => {
                    if (def._type === 'link' && def.href && def.href.includes('mhlw.go.jp')) {
                        console.log(`[${slug}] Changing generic MHLW link to precise evidence: ${rule.newHref}`)
                        def.href = rule.newHref
                        modified = true
                    }
                })
            }

            // Fallback: Just replace any generic MHLW top page link in this document if we missed the exact block
            if (!modified && block.markDefs && block.markDefs.length > 0) {
                block.markDefs.forEach(def => {
                    if (def._type === 'link' && def.href && (def.href === 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/' || def.href === 'https://www.mhlw.go.jp/toukei_hakusho/toukei/index.html' || def.href === 'https://www.mhlw.go.jp/toukei_hakusho/toukei/')) {
                        console.log(`[${slug}] Changing generic MHLW link (fallback) to precise evidence: ${rule.newHref}`)
                        def.href = rule.newHref
                        modified = true
                    }
                })
            }
        }

        if (modified) {
            try {
                await client.patch(post._id).set({ body: newBody }).commit()
                console.log(`✅ Restored context link for ${slug}`)
            } catch (e) {
                console.error(`❌ Failed to patch ${slug}: ${e.message}`)
            }
        } else {
            console.log(`⚠️ No generic MHLW link found to restore in ${slug}`)
        }
    }

    console.log("Finished restoring precise URLs.")
}

main().catch(console.error)
