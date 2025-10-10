require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

async function checkAffiliateLinks() {
  console.log('🔍 アフィリエイトリンクの設置状況を確認中...\n')

  // 最新の記事を5件取得
  const posts = await client.fetch(`*[_type == "post"] | order(_createdAt desc) [0..4] {
    _id,
    title,
    body
  }`)

  let postsWithAmazon = 0
  let postsWithRakuten = 0
  let postsWithA8 = 0
  let postsWithMoshimo = 0
  let totalAffiliateLinks = 0

  posts.forEach(post => {
    console.log(`\n📝 記事: ${post.title}`)
    console.log(`   ID: ${post._id}`)

    if (!post.body || !Array.isArray(post.body)) {
      console.log('   ⚠️  本文なし')
      return
    }

    let amazonCount = 0
    let rakutenCount = 0
    let a8Count = 0
    let moshimoCount = 0
    let totalLinks = 0

    post.body.forEach(block => {
      if (block.markDefs && Array.isArray(block.markDefs)) {
        block.markDefs.forEach(mark => {
          if (mark._type === 'link' && mark.href) {
            totalLinks++
            const href = mark.href.toLowerCase()
            if (href.includes('amazon')) {
              amazonCount++
              totalAffiliateLinks++
            }
            if (href.includes('rakuten')) {
              rakutenCount++
              totalAffiliateLinks++
            }
            if (href.includes('a8.net') || href.includes('a8net')) {
              a8Count++
              totalAffiliateLinks++
            }
            if (href.includes('moshimo')) {
              moshimoCount++
              totalAffiliateLinks++
            }
          }
        })
      }
    })

    if (amazonCount > 0) postsWithAmazon++
    if (rakutenCount > 0) postsWithRakuten++
    if (a8Count > 0) postsWithA8++
    if (moshimoCount > 0) postsWithMoshimo++

    console.log(`   🔗 総リンク数: ${totalLinks}`)
    console.log(`   📦 Amazon: ${amazonCount}`)
    console.log(`   🛍️  楽天: ${rakutenCount}`)
    console.log(`   💼 A8.net: ${a8Count}`)
    console.log(`   🔄 もしも: ${moshimoCount}`)
  })

  console.log('\n' + '='.repeat(60))
  console.log('📊 集計結果')
  console.log('='.repeat(60))
  console.log(`調査記事数: ${posts.length}件`)
  console.log(`Amazonリンクあり: ${postsWithAmazon}件`)
  console.log(`楽天リンクあり: ${postsWithRakuten}件`)
  console.log(`A8.netリンクあり: ${postsWithA8}件`)
  console.log(`もしもリンクあり: ${postsWithMoshimo}件`)
  console.log(`アフィリエイトリンク総数: ${totalAffiliateLinks}個`)
  console.log()
}

checkAffiliateLinks().catch(console.error)
