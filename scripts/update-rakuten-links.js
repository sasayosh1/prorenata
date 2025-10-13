import { createClient } from '@sanity/client'

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

const query = `*[_type == "post"] {
  _id,
  title,
  "slug": slug.current,
  body
}`

// 新しい楽天市場リンク（もしも経由）
const NEW_RAKUTEN_URL = '//af.moshimo.com/af/c/click?a_id=5207851&p_id=54&pc_id=54&pl_id=621'

async function updateRakutenLinks() {
  console.log('📊 楽天市場リンクの更新を開始\n')

  const posts = await client.fetch(query)

  let updatedCount = 0
  let totalLinksUpdated = 0
  const updatedPosts = []

  for (const post of posts) {
    if (!post.body) continue

    let postUpdated = false
    let linksInPost = 0

    post.body.forEach(block => {
      if (block._type === 'block' && block.markDefs) {
        block.markDefs.forEach(mark => {
          if (mark._type === 'link' && mark.href) {
            // 楽天市場の既存リンクを検出
            if (/search\.rakuten\.co\.jp/i.test(mark.href)) {
              console.log(`\n📝 更新: ${post.title}`)
              console.log(`   旧URL: ${mark.href}`)
              console.log(`   新URL: ${NEW_RAKUTEN_URL}`)

              // URLを更新
              mark.href = NEW_RAKUTEN_URL
              postUpdated = true
              linksInPost++
              totalLinksUpdated++
            }
          }
        })
      }
    })

    if (postUpdated) {
      updatedPosts.push({
        _id: post._id,
        title: post.title,
        slug: post.slug,
        linksUpdated: linksInPost,
        body: post.body
      })
      updatedCount++
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log(`\n更新対象記事: ${updatedCount}件`)
  console.log(`更新リンク数: ${totalLinksUpdated}件`)

  if (updatedPosts.length === 0) {
    console.log('\n✅ 更新が必要な記事はありません')
    return
  }

  console.log('\n🔄 Sanityに変更を保存中...\n')

  let successCount = 0
  let failCount = 0

  for (const post of updatedPosts) {
    try {
      await client
        .patch(post._id)
        .set({ body: post.body })
        .commit()

      console.log(`✅ ${post.title} (${post.linksUpdated}件のリンクを更新)`)
      successCount++
    } catch (error) {
      console.error(`❌ ${post.title}: ${error.message}`)
      failCount++
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log(`\n✅ 更新成功: ${successCount}件`)
  console.log(`❌ 更新失敗: ${failCount}件`)
  console.log(`📊 総更新リンク数: ${totalLinksUpdated}件`)
}

updateRakutenLinks().catch(console.error)
