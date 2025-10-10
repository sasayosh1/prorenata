require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const fs = require('fs')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

async function investigateBrokenLinks() {
  const line = '='.repeat(60)
  console.log(line)
  console.log('🔍 Amazon/楽天リンク詳細調査')
  console.log(line)
  console.log()

  const posts = await client.fetch('*[_type == "post"] { _id, title, "slug": slug.current, body }')

  const brokenLinks = []
  let totalAmazonRakuten = 0

  for (const post of posts) {
    if (!post.body || !Array.isArray(post.body)) continue

    for (let blockIndex = 0; blockIndex < post.body.length; blockIndex++) {
      const block = post.body[blockIndex]

      if (block._type !== 'block' || !block.markDefs || block.markDefs.length === 0) continue

      // Amazon/楽天リンクを探す
      const amazonRakutenLinks = block.markDefs.filter(mark => {
        if (mark._type !== 'link' || !mark.href) return false
        const href = mark.href.toLowerCase()
        return (href.includes('amazon') && href.includes('tag=')) || href.includes('rakuten')
      })

      if (amazonRakutenLinks.length === 0) continue

      totalAmazonRakuten += amazonRakutenLinks.length

      // 各リンクについて、対応するテキストがあるかチェック
      for (const link of amazonRakutenLinks) {
        const linkKey = link._key

        // このリンクを参照しているchildrenを探す
        const linkedChildren = block.children?.filter(child =>
          child.marks && child.marks.includes(linkKey)
        ) || []

        // テキストがあるかチェック
        const hasText = linkedChildren.some(child => child.text && child.text.trim().length > 0)

        if (!hasText) {
          const linkType = link.href.toLowerCase().includes('amazon') ? 'Amazon' : '楽天'

          brokenLinks.push({
            _id: post._id,
            title: post.title,
            slug: post.slug,
            blockIndex,
            linkKey,
            linkType,
            href: link.href,
            blockText: block.children?.map(c => c.text || '').join('').substring(0, 100),
            children: block.children,
            markDefs: block.markDefs
          })

          console.log(`❌ ${linkType}リンクのテキスト欠落`)
          console.log(`   記事: ${post.title}`)
          console.log(`   URL: https://prorenata.jp/posts/${post.slug}`)
          console.log(`   ブロック位置: ${blockIndex}`)
          console.log(`   ブロックテキスト: "${block.children?.map(c => c.text || '').join('')}"`)
          console.log(`   リンクURL: ${link.href.substring(0, 80)}...`)
          console.log()
        }
      }
    }
  }

  console.log(line)
  console.log('📊 調査結果サマリー')
  console.log(line)
  console.log(`総Amazon/楽天リンク数: ${totalAmazonRakuten}個`)
  console.log(`テキスト欠落リンク数: ${brokenLinks.length}個`)
  console.log(`修正が必要な記事数: ${new Set(brokenLinks.map(b => b._id)).size}件`)
  console.log()

  // 詳細レポート保存
  const reportPath = require('path').resolve(__dirname, '../internal-links-analysis/broken-amazon-rakuten-links.json')
  fs.writeFileSync(reportPath, JSON.stringify(brokenLinks, null, 2))
  console.log(`📄 詳細レポート: ${reportPath}`)
  console.log()
}

investigateBrokenLinks().catch(console.error)
