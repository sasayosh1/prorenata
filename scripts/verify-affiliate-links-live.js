require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

async function verifyAffiliateLinks() {
  const line = '='.repeat(60)
  console.log(line)
  console.log('🔍 アフィリエイトリンク実装確認')
  console.log(line)
  console.log()

  // ランダムに5件の記事を取得
  const posts = await client.fetch(`*[_type == "post"] | order(_createdAt desc) [0..4] {
    _id,
    title,
    "slug": slug.current,
    body
  }`)

  console.log('📝 確認対象記事（最新5件）:\n')

  for (const post of posts) {
    console.log('━'.repeat(60))
    console.log('📄 記事: ' + post.title)
    console.log('   URL: https://prorenata.jp/posts/' + post.slug)
    console.log()

    if (!post.body || !Array.isArray(post.body)) {
      console.log('   ⚠️  本文なし\n')
      continue
    }

    let amazonCount = 0
    let rakutenCount = 0
    let moshimoCount = 0
    let a8Count = 0
    const foundLinks = []

    post.body.forEach((block, blockIndex) => {
      if (!block.markDefs || !Array.isArray(block.markDefs)) return

      block.markDefs.forEach(mark => {
        if (mark._type !== 'link' || !mark.href) return

        const href = mark.href.toLowerCase()

        // リンクテキストを取得
        const linkChild = block.children?.find(child => 
          child.marks && child.marks.includes(mark._key)
        )
        const linkText = linkChild ? linkChild.text : '(テキストなし)'

        if (href.includes('amazon') && href.includes('tag=')) {
          amazonCount++
          foundLinks.push({
            type: 'Amazon',
            text: linkText,
            url: mark.href,
            blockIndex
          })
        } else if (href.includes('rakuten')) {
          rakutenCount++
          foundLinks.push({
            type: '楽天',
            text: linkText,
            url: mark.href,
            blockIndex
          })
        } else if (href.includes('moshimo') || href.includes('af.moshimo.com')) {
          moshimoCount++
          foundLinks.push({
            type: 'もしも',
            text: linkText,
            url: mark.href.substring(0, 80) + '...',
            blockIndex
          })
        } else if (href.includes('a8.net') || href.includes('a8net')) {
          a8Count++
          foundLinks.push({
            type: 'A8.net',
            text: linkText,
            url: mark.href.substring(0, 80) + '...',
            blockIndex
          })
        }
      })
    })

    console.log('   📊 アフィリエイトリンク統計:')
    console.log('      📦 Amazon: ' + amazonCount + '個')
    console.log('      🛍️  楽天: ' + rakutenCount + '個')
    console.log('      💼 もしも: ' + moshimoCount + '個')
    console.log('      🔗 A8.net: ' + a8Count + '個')
    console.log()

    if (foundLinks.length > 0) {
      console.log('   🔗 検出されたリンク（最大3件表示）:')
      foundLinks.slice(0, 3).forEach((link, i) => {
        console.log('      ' + (i + 1) + '. [' + link.type + '] ' + link.text)
        console.log('         ブロック位置: ' + link.blockIndex)
        if (link.url.length < 100) {
          console.log('         URL: ' + link.url)
        }
      })
    } else {
      console.log('   ⚠️  アフィリエイトリンクが見つかりません')
    }
    console.log()
  }

  console.log(line)
  console.log('✨ 確認完了')
  console.log()
  console.log('💡 本番サイトで実際の表示を確認してください:')
  console.log('   https://prorenata.jp')
  console.log(line)
  console.log()
}

verifyAffiliateLinks().catch(console.error)
