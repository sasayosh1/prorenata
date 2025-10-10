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

// Amazon & 楽天のリンクデータ
const PRODUCT_LINKS = {
  'ナースシューズ': {
    amazon: 'https://www.amazon.co.jp/s?k=%E3%82%A2%E3%82%B7%E3%83%83%E3%82%AF%E3%82%B9+%E3%83%8A%E3%83%BC%E3%82%B9%E3%82%A6%E3%82%A9%E3%83%BC%E3%82%AB%E3%83%BC&tag=ptb875pmj49-22',
    rakuten: 'https://search.rakuten.co.jp/search/mall/%E3%82%A2%E3%82%B7%E3%83%83%E3%82%AF%E3%82%B9+%E3%83%8A%E3%83%BC%E3%82%B9%E3%82%A6%E3%82%A9%E3%83%BC%E3%82%AB%E3%83%BC/'
  },
  'メモ帳': {
    amazon: 'https://www.amazon.co.jp/s?k=%E3%83%8A%E3%83%BC%E3%82%B9+%E3%83%A1%E3%83%A2%E5%B8%B3&tag=ptb875pmj49-22',
    rakuten: 'https://search.rakuten.co.jp/search/mall/%E3%83%8A%E3%83%BC%E3%82%B9+%E3%83%A1%E3%83%A2%E5%B8%B3/'
  }
}

function createAffiliateLinkBlock(productName) {
  const links = PRODUCT_LINKS[productName]
  if (!links) return null

  const blockKey = 'block-' + Math.random().toString(36).substr(2, 9)
  const amazonLinkKey = 'link-' + Math.random().toString(36).substr(2, 9)
  const rakutenLinkKey = 'link-' + Math.random().toString(36).substr(2, 9)

  return {
    _type: 'block',
    _key: blockKey,
    style: 'normal',
    markDefs: [
      {
        _key: amazonLinkKey,
        _type: 'link',
        href: links.amazon
      },
      {
        _key: rakutenLinkKey,
        _type: 'link',
        href: links.rakuten
      }
    ],
    children: [
      {
        _type: 'span',
        _key: 'span-' + Math.random().toString(36).substr(2, 9),
        text: '[PR] | [PR]',
        marks: []
      }
    ]
  }
}

async function findAndFixMissingLinks() {
  const line = '='.repeat(60)
  console.log(line)
  console.log('🔍 [PR]マーカーの調査と修正')
  console.log(line)
  console.log()

  const posts = await client.fetch('*[_type == "post"] { _id, title, "slug": slug.current, body }')
  
  const issues = []

  for (const post of posts) {
    if (!post.body) continue

    for (let i = 0; i < post.body.length; i++) {
      const block = post.body[i]
      
      if (block._type !== 'block' || !block.children) continue

      const blockText = block.children
        .filter(c => c._type === 'span')
        .map(c => c.text || '')
        .join('')

      // [PR]が含まれているかチェック
      if (blockText.includes('[PR]')) {
        // markDefsにリンクがあるかチェック
        const hasLinks = block.markDefs && block.markDefs.length > 0

        if (!hasLinks) {
          // リンクがない[PR]を発見
          issues.push({
            _id: post._id,
            title: post.title,
            slug: post.slug,
            blockIndex: i,
            text: blockText.substring(0, 100)
          })
        }
      }
    }
  }

  console.log('📊 調査結果:')
  console.log('総記事数: ' + posts.length + '件')
  console.log('リンクなし[PR]箇所: ' + issues.length + '箇所')
  console.log()

  if (issues.length > 0) {
    console.log('⚠️  リンクが設置されていない箇所:')
    console.log(line)
    issues.forEach((issue, index) => {
      console.log((index + 1) + '. ' + issue.title)
      console.log('   スラッグ: ' + issue.slug)
      console.log('   ブロック位置: ' + issue.blockIndex)
      console.log('   テキスト: ' + issue.text + '...')
      console.log()
    })

    console.log(line)
    console.log('💡 これらは手動で確認・修正が必要です')
    console.log('   記事を開いて適切なアフィリエイトリンクを設置してください')
  } else {
    console.log('✅ 全ての[PR]マーカーにリンクが設置されています')
  }

  console.log()

  // レポート出力
  const reportPath = require('path').resolve(__dirname, '../internal-links-analysis/missing-affiliate-links.json')
  fs.writeFileSync(reportPath, JSON.stringify(issues, null, 2))
  console.log('📄 レポート: ' + reportPath)
  console.log()
}

findAndFixMissingLinks().catch(console.error)
