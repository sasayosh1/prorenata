require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const { MOSHIMO_LINKS, suggestLinksForArticle, createMoshimoLinkBlock } = require('./moshimo-affiliate-links')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

function extractTextFromBody(body) {
  if (!body || !Array.isArray(body)) return ''
  
  return body
    .filter(block => block._type === 'block')
    .map(block => {
      if (!block.children) return ''
      return block.children
        .filter(child => child._type === 'span')
        .map(child => child.text || '')
        .join('')
    })
    .join(' ')
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = !args.includes('--execute')

  const line = '='.repeat(60)
  console.log(line)
  console.log('🔗 もしもアフィリエイトリンク配置ツール')
  console.log(line)
  console.log()

  if (dryRun) {
    console.log('🔍 [DRY RUN] 配置プランを確認します\n')
  }

  // 全記事を取得
  const posts = await client.fetch('*[_type == "post"] { _id, title, "slug": slug.current, body }')
  console.log('📚 総記事数: ' + posts.length + '件\n')

  const plan = []
  let totalLinksPlanned = 0

  for (const post of posts) {
    const bodyText = extractTextFromBody(post.body)
    const suggestions = suggestLinksForArticle(post.title, bodyText)

    if (suggestions.length === 0) continue

    // 最適なリンクを1-2個選択
    const selectedLinks = suggestions.slice(0, 2)

    plan.push({
      _id: post._id,
      title: post.title,
      slug: post.slug,
      links: selectedLinks.map(s => ({
        key: s.key,
        name: s.name,
        appealText: s.appealText,
        linkText: s.linkText,
        matchScore: s.matchScore
      }))
    })

    totalLinksPlanned += selectedLinks.length
  }

  console.log('🔗 リンク配置予定数: ' + totalLinksPlanned + '個')
  console.log('📝 リンク配置予定記事: ' + plan.length + '件\n')

  if (dryRun) {
    // サンプル表示
    console.log('📋 配置プラン（最初の5記事）:')
    console.log(line)
    plan.slice(0, 5).forEach((item, index) => {
      console.log('\n' + (index + 1) + '. ' + item.title)
      item.links.forEach((link, i) => {
        console.log('   リンク' + (i + 1) + ': ' + link.name + ' (マッチ度: ' + link.matchScore + ')')
        console.log('   訴求: ' + link.appealText)
        console.log('   テキスト: ' + link.linkText)
      })
    })

    console.log('\n' + line)
    console.log('💡 実行するには:')
    console.log('  node scripts/add-moshimo-links.js --execute')
  } else {
    console.log('🚀 Sanityに反映開始...\n')

    let updatedCount = 0

    for (const item of plan) {
      try {
        const post = posts.find(p => p._id === item._id)
        if (!post || !post.body) continue

        const newBody = [...post.body]

        // 記事末尾にリンクを追加
        for (const link of item.links) {
          const linkBlock = createMoshimoLinkBlock(link.key)
          if (linkBlock) {
            newBody.push(linkBlock)
          }
        }

        await client.patch(item._id).set({ body: newBody }).commit()

        console.log('✅ ' + item.title + ' (' + item.links.length + '個のリンク追加)')
        updatedCount++
      } catch (error) {
        console.error('❌ エラー: ' + item.title)
        console.error('   ' + error.message)
      }
    }

    console.log()
    console.log(line)
    console.log('📊 実行結果')
    console.log(line)
    console.log('✅ 成功: ' + updatedCount + '件')
    console.log('🔗 追加されたリンク総数: ' + totalLinksPlanned + '個')
    console.log()
    console.log('✨ 完了！')
  }
  console.log()
}

if (require.main === module) {
  main().catch(console.error)
}
