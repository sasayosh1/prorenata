require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

const CORRECT_CODE = '2ZTT9A+D2Y8MQ+1W34+C8VWY'
const CORRECT_TRACKING = 'https://www17.a8.net/0.gif?a8mat=2ZTT9A+D2Y8MQ+1W34+C8VWY'
const CORRECT_AFFILIATE_URL = 'https://px.a8.net/svt/ejp?a8mat=2ZTT9A+D2Y8MQ+1W34+C8VWY'
const CORRECT_HTML = '<a href="https://px.a8.net/svt/ejp?a8mat=2ZTT9A+D2Y8MQ+1W34+C8VWY" rel="nofollow">かいご畑で介護職・看護助手の求人を探す</a><img border="0" width="1" height="1" src="https://www17.a8.net/0.gif?a8mat=2ZTT9A+D2Y8MQ+1W34+C8VWY" alt="">'

async function fixKaigobatakeTracking() {
  console.log('🔧 「かいご畑」トラッキングピクセルを修正中...\n')

  // 全記事を取得
  const posts = await client.fetch(`*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body
  }`)

  let updatedCount = 0

  for (const post of posts) {
    if (!post.body || !Array.isArray(post.body)) continue

    let modified = false
    const newBody = [...post.body]

    for (let i = 0; i < newBody.length; i++) {
      const block = newBody[i]

      // affiliateEmbed タイプの修正
      if (block._type === 'affiliateEmbed' && block.html) {
        const originalHtml = block.html

        // かいご畑のリンクを含む場合
        if (originalHtml.includes('かいご畑') || originalHtml.includes(CORRECT_CODE)) {
          let updatedHtml = originalHtml

          // 間違ったトラッキングドメインを修正
          updatedHtml = updatedHtml.replace(/https:\/\/www15\.a8\.net\/0\.gif\?a8mat=2ZTT9A\+D2Y8MQ\+1W34\+C8VWY/g, CORRECT_TRACKING)
          updatedHtml = updatedHtml.replace(/https:\/\/www18\.a8\.net\/0\.gif\?a8mat=2ZTT9A\+D2Y8MQ\+1W34\+C8VWY/g, CORRECT_TRACKING)

          if (updatedHtml !== originalHtml) {
            newBody[i] = {
              ...block,
              html: updatedHtml
            }
            modified = true
          }
        }
      }

      // block タイプの markDefs 修正（念のため）
      if (block._type === 'block' && block.markDefs && Array.isArray(block.markDefs)) {
        let blockModified = false
        const newMarkDefs = [...block.markDefs]

        for (let j = 0; j < newMarkDefs.length; j++) {
          const mark = newMarkDefs[j]
          if (mark._type === 'link' && mark.href) {
            let updatedHref = mark.href

            // かいご畑のリンクを修正
            if (updatedHref.includes('1W34+C8VWY')) {
              // 間違ったコードを修正
              updatedHref = updatedHref.replace(/a8mat=3ZAXGX\+DKVSUA\+5OUU\+5YZ77/g, 'a8mat=' + CORRECT_CODE)

              if (updatedHref !== mark.href) {
                newMarkDefs[j] = {
                  ...mark,
                  href: updatedHref
                }
                blockModified = true
              }
            }
          }
        }

        if (blockModified) {
          newBody[i] = {
            ...block,
            markDefs: newMarkDefs
          }
          modified = true
        }
      }
    }

    if (modified) {
      try {
        await client.patch(post._id).set({ body: newBody }).commit()
        updatedCount++
        console.log(`✅ ${updatedCount}. ${post.title}`)
      } catch (error) {
        console.error(`❌ エラー: ${post.title}`)
        console.error(error)
      }
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 修正完了')
  console.log('='.repeat(60))
  console.log(`修正した記事: ${updatedCount}件`)
  console.log('\n✅ すべての「かいご畑」リンクが正しいコードに統一されました！')
}

fixKaigobatakeTracking().catch(console.error)
