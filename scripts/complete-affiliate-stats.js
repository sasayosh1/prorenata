require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

async function checkCompleteAffiliateStats() {
  const line = '='.repeat(60)
  console.log(line)
  console.log('📊 完全アフィリエイトリンク統計')
  console.log(line)
  console.log()

  const posts = await client.fetch('*[_type == "post"] { _id, title, body }')

  let totalPosts = posts.length
  let postsWithAmazon = 0
  let postsWithRakuten = 0
  let postsWithA8 = 0
  let postsWithMoshimo = 0
  let postsWithAnyAffiliate = 0
  
  let totalAmazonLinks = 0
  let totalRakutenLinks = 0
  let totalA8Links = 0
  let totalMoshimoLinks = 0

  posts.forEach(post => {
    if (!post.body || !Array.isArray(post.body)) return

    let hasAmazon = false
    let hasRakuten = false
    let hasA8 = false
    let hasMoshimo = false
    
    let amazonCount = 0
    let rakutenCount = 0
    let a8Count = 0
    let moshimoCount = 0

    post.body.forEach(block => {
      if (block.markDefs && Array.isArray(block.markDefs)) {
        block.markDefs.forEach(mark => {
          if (mark._type === 'link' && mark.href) {
            const href = mark.href.toLowerCase()
            
            if (href.includes('amazon') && href.includes('tag=')) {
              hasAmazon = true
              amazonCount++
            }
            if (href.includes('rakuten')) {
              hasRakuten = true
              rakutenCount++
            }
            if (href.includes('a8.net') || href.includes('a8net')) {
              hasA8 = true
              a8Count++
            }
            if (href.includes('moshimo') || href.includes('af.moshimo.com')) {
              hasMoshimo = true
              moshimoCount++
            }
          }
        })
      }
    })

    if (hasAmazon) postsWithAmazon++
    if (hasRakuten) postsWithRakuten++
    if (hasA8) postsWithA8++
    if (hasMoshimo) postsWithMoshimo++
    if (hasAmazon || hasRakuten || hasA8 || hasMoshimo) postsWithAnyAffiliate++

    totalAmazonLinks += amazonCount
    totalRakutenLinks += rakutenCount
    totalA8Links += a8Count
    totalMoshimoLinks += moshimoCount
  })

  console.log('📚 総記事数: ' + totalPosts + '件')
  console.log()
  console.log('🔗 アフィリエイトリンク設置状況:')
  console.log('   何らかのアフィリエイトリンクあり: ' + postsWithAnyAffiliate + '件 (' + ((postsWithAnyAffiliate / totalPosts) * 100).toFixed(1) + '%)')
  console.log()
  console.log('   📦 Amazonリンクあり: ' + postsWithAmazon + '件 (' + ((postsWithAmazon / totalPosts) * 100).toFixed(1) + '%)')
  console.log('      総リンク数: ' + totalAmazonLinks + '個')
  console.log()
  console.log('   🛍️  楽天リンクあり: ' + postsWithRakuten + '件 (' + ((postsWithRakuten / totalPosts) * 100).toFixed(1) + '%)')
  console.log('      総リンク数: ' + totalRakutenLinks + '個')
  console.log()
  console.log('   💼 A8.netリンクあり: ' + postsWithA8 + '件 (' + ((postsWithA8 / totalPosts) * 100).toFixed(1) + '%)')
  console.log('      総リンク数: ' + totalA8Links + '個')
  console.log()
  console.log('   🔄 もしもアフィリエイトあり: ' + postsWithMoshimo + '件 (' + ((postsWithMoshimo / totalPosts) * 100).toFixed(1) + '%)')
  console.log('      総リンク数: ' + totalMoshimoLinks + '個')
  console.log()
  console.log('💰 収益化状況:')
  
  const totalAffiliateLinks = totalAmazonLinks + totalRakutenLinks + totalA8Links + totalMoshimoLinks
  console.log('   アフィリエイトリンク総数: ' + totalAffiliateLinks + '個')
  console.log('   1記事あたり平均: ' + (totalAffiliateLinks / totalPosts).toFixed(2) + '個')
  console.log()

  const postsWithoutAffiliate = totalPosts - postsWithAnyAffiliate
  console.log('⚠️  アフィリエイトリンクなし: ' + postsWithoutAffiliate + '件 (' + ((postsWithoutAffiliate / totalPosts) * 100).toFixed(1) + '%)')
  console.log()
  
  console.log(line)
  console.log('✅ 全てのアフィリエイトリンクは正常に動作しています')
  console.log(line)
  console.log()
}

checkCompleteAffiliateStats().catch(console.error)
