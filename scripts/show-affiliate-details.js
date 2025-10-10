require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

async function showAffiliateDetails() {
  console.log('🔍 アフィリエイトリンクの詳細を確認中...\n')

  // アフィリエイトリンクがある記事を取得
  const post = await client.fetch(`*[_type == "post" && _id == "VcGv9zZ6obDRZ14YHcUUg1o"][0] {
    _id,
    title,
    body
  }`)

  console.log(`📝 記事: ${post.title}\n`)

  post.body.forEach((block, index) => {
    if (block.markDefs && block.markDefs.length > 0) {
      const affiliateLinks = block.markDefs.filter(mark => {
        if (mark._type !== 'link' || !mark.href) return false
        const href = mark.href.toLowerCase()
        return href.includes('amazon') || href.includes('rakuten') || href.includes('a8') || href.includes('moshimo')
      })

      if (affiliateLinks.length > 0) {
        console.log(`\n--- ブロック ${index + 1} ---`)
        affiliateLinks.forEach((link, i) => {
          console.log(`\n🔗 リンク ${i + 1}:`)
          console.log(`   URL: ${link.href}`)
          
          // リンクテキストを取得
          const linkMark = block.children?.find(child => 
            child.marks && child.marks.includes(link._key)
          )
          if (linkMark) {
            console.log(`   テキスト: "${linkMark.text}"`)
          }

          // リンクの種類を判定
          const href = link.href.toLowerCase()
          if (href.includes('amazon')) console.log('   種類: 📦 Amazon')
          if (href.includes('rakuten')) console.log('   種類: 🛍️  楽天')
          if (href.includes('a8')) console.log('   種類: 💼 A8.net')
          if (href.includes('moshimo')) console.log('   種類: 🔄 もしも')
        })
      }
    }
  })
}

showAffiliateDetails().catch(console.error)
