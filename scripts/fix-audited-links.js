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

const KAIGOBATAKE_CRO_BLOCK = {
    _type: 'affiliateEmbed',
    provider: 'かいご畑',
    label: 'かいご畑',
    linkKey: 'kaigobatake-rel',
    html: `<div style="background: linear-gradient(135deg, #fdfbf7 0%, #f4eee1 100%); border: 1px solid #e2d2b5; border-radius: 8px; padding: 16px; margin: 16px 0;">
  <p style="margin: 0 0 12px 0; font-weight: bold; color: #2c9a9a;">【💡 「もう限界…」と感じている方へ】</p>
  <p style="margin: 0 0 12px 0; color: #3d3b38; line-height: 1.6;">心がすり減って壊れてしまう前に、「いつでもここから逃げられる」というカード（選択肢）を持っておくことは、自分を守る一番の薬になります。<br>履歴書不要・無資格からでもサポートしてくれる専門の窓口に、今のうちから少し頼ってみませんか？</p>
  <p style="margin: 0 0 8px 0;">
    [PR] 
    <a href="https://px.a8.net/svt/ejp?a8mat=2ZTT9A+D2Y8MQ+1W34+C8VWY" rel="nofollow" style="color: #0066cc; text-decoration: underline; font-weight: bold;">かいご畑で「自分に合う職場」を覗いてみる（無料）</a>
    <img border="0" width="1" height="1" src="https://www17.a8.net/0.gif?a8mat=2ZTT9A+D2Y8MQ+1W34+C8VWY" alt="">
  </p>
</div>`
}

const RESUMAP_CRO_BLOCK = {
    _type: 'affiliateEmbed',
    provider: 'レジュマップ',
    label: 'レジュマップ履歴書作成ツール',
    linkKey: 'resumap-interview',
    html: `<div style="background: linear-gradient(135deg, #fdfbf7 0%, #f4eee1 100%); border: 1px solid #e2d2b5; border-radius: 8px; padding: 16px; margin: 16px 0;">
  <p style="margin: 0 0 12px 0; font-weight: bold; color: #2c9a9a;">【💡 履歴書の前で手が止まっている方へ】</p>
  <p style="margin: 0 0 12px 0; color: #3d3b38; line-height: 1.6;">面接対策の第一歩は、綺麗な履歴書を作って自分の不安を取り除くことです。でも、手書きで何度も書き直すのは疲れますよね。<br>スマホでぽちぽち入力するだけで、すぐに見やすい履歴書・職務経歴書が完成するツールがあります。今日のうちにサクッと終わらせて、温かいお茶でも飲みませんか？</p>
  <p style="margin: 0 0 8px 0;">
    [PR] 
    <a href="//af.moshimo.com/af/c/click?a_id=5329936&p_id=7266&pc_id=20832&pl_id=91572" rel="nofollow" referrerpolicy="no-referrer-when-downgrade" style="color: #0066cc; text-decoration: underline; font-weight: bold;">レジュマップで履歴書を自動作成する</a>
    <img src="//i.moshimo.com/af/i/impression?a_id=5329936&p_id=7266&pc_id=20832&pl_id=91572" width="1" height="1" style="border:none;" loading="lazy">
  </p>
</div>`
}

const DEAD_LINKS_MAPPING = {
    '/posts/nursing-assistant-qualification-study-career': '/posts/nursing-assistant-interview-resume-roadmap',
    '/posts/nursing-assistant-interview-tips-compass': '/posts/nursing-assistant-interview-resume-roadmap',
    '/posts/nursing-assistant-motivation-fulfillment': '/posts/nursing-assistant-interview-resume-roadmap',
    '/posts/nursing-assistant-motivation-letter-samples': '/posts/nursing-assistant-interview-resume-roadmap',
    '/posts/nursing-assistant-mental-care-interview': '/posts/nursing-assistant-interview-resume-roadmap',
    '/posts/nursing-assistant-job-role-practical': '/posts/nursing-assistant-interview-resume-roadmap',
    'https://www.mhlw.go.jp/content/10904750/001193976.pdf': 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/',
    'https://www.mhlw.go.jp/toukei/list/79-1.html': 'https://www.mhlw.go.jp/toukei_hakusho/toukei/index.html',
    'https://www.mhlw.go.jp/toukei_hakusho/toukei/index.html': 'https://www.mhlw.go.jp/toukei_hakusho/toukei/'
}

async function main() {
    console.log("Starting Link Fixer & PR Block Injector...")
    const query = `*[_type == "post" && !(_id in path("drafts.**"))] { _id, title, slug, body }`
    const posts = await client.fetch(query)

    let totalFixed = 0

    for (const post of posts) {
        if (!post.body) continue

        let newBody = JSON.parse(JSON.stringify(post.body))
        let modified = false

        for (let i = 0; i < newBody.length; i++) {
            const block = newBody[i]
            if (block.markDefs && block.markDefs.length > 0) {
                block.markDefs.forEach(def => {
                    if (def._type === 'link' && def.href) {
                        if (DEAD_LINKS_MAPPING[def.href]) {
                            console.log(`[${post.slug.current}] Replacing dead link ${def.href} -> ${DEAD_LINKS_MAPPING[def.href]}`)
                            def.href = DEAD_LINKS_MAPPING[def.href]
                            modified = true
                        }
                    }
                })
            }
        }

        let postText = newBody.filter(b => b.children).map(b => b.children.map(c => c.text).join(' ')).join(' ')
        const searchTarget = post.title + ' ' + postText
        let hasKaigobatake = newBody.some(b => b._type === 'affiliateEmbed' && b.provider === 'かいご畑')
        let hasResumap = newBody.some(b => b._type === 'affiliateEmbed' && b.provider === 'レジュマップ')

        const needsResumap = !hasResumap && ['面接', '履歴書', '志望動機', '職務経歴書'].some(kw => searchTarget.includes(kw))
        const needsKaigobatake = !hasKaigobatake && ['人間関係', '辞めたい', '限界', '最悪', 'いじめ'].some(kw => searchTarget.includes(kw))

        if (needsResumap || needsKaigobatake) {
            let insertIndex = newBody.findIndex(b => b._type === 'block' && b.style === 'h2')
            if (insertIndex === -1) {
                insertIndex = Math.min(2, newBody.length)
            }

            if (needsResumap) {
                console.log(`[${post.slug.current}] Injecting Resumap block at index ${insertIndex}`)
                newBody.splice(insertIndex, 0, { ...RESUMAP_CRO_BLOCK, _key: generateKey('affiliate-resumap') })
                insertIndex++
                modified = true
            }

            if (needsKaigobatake) {
                console.log(`[${post.slug.current}] Injecting Kaigobatake block at index ${insertIndex}`)
                newBody.splice(insertIndex, 0, { ...KAIGOBATAKE_CRO_BLOCK, _key: generateKey('affiliate-kaigo') })
                modified = true
            }
        }

        if (modified) {
            try {
                await client.patch(post._id).set({ body: newBody }).commit()
                console.log(`✅ Patched ${post.slug.current}`)
                totalFixed++
            } catch (e) {
                console.error(`❌ Failed to patch ${post.slug.current}: ${e.message}`)
            }
        }
    }

    console.log(`\nAll done! Patched ${totalFixed} posts.`)
}

main().catch(console.error)
