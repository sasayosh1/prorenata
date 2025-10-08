/**
 * 「次のステップ」セクションを関連記事カードに統一
 *
 * 現在の構造:
 * ## 次のステップ
 * - テキストリンク1
 * - テキストリンク2
 *
 * [関連記事カード]
 *
 * 修正後:
 * [関連記事カードを次のステップ内に配置、テキストリンク削除]
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const token = process.env.SANITY_API_TOKEN
console.log('🔑 Token length:', token ? token.length : 0)
console.log('🔑 Token prefix:', token ? token.substring(0, 10) + '...' : 'undefined')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: token,
  useCdn: false
})

async function analyzeNextSteps() {
  console.log('\n🔍 「次のステップ」セクションを分析中...\n')

  const posts = await client.fetch(`*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body
  }`)

  console.log(`📊 総記事数: ${posts.length}件\n`)

  let postsWithNextSteps = 0
  let postsWithRelatedArticles = 0
  let postsWithBoth = 0

  posts.forEach(post => {
    if (!post.body) return

    const bodyText = JSON.stringify(post.body)
    const hasNextStep = bodyText.includes('次のステップ')
    const hasRelatedArticles = bodyText.includes('関連記事')

    if (hasNextStep) postsWithNextSteps++
    if (hasRelatedArticles) postsWithRelatedArticles++
    if (hasNextStep && hasRelatedArticles) postsWithBoth++
  })

  console.log('📈 統計:')
  console.log(`  「次のステップ」を含む記事: ${postsWithNextSteps}件`)
  console.log(`  「関連記事」を含む記事: ${postsWithRelatedArticles}件`)
  console.log(`  両方を含む記事: ${postsWithBoth}件`)
  console.log()

  return { postsWithNextSteps, postsWithRelatedArticles, postsWithBoth }
}

async function removeNextStepsSections(dryRun = true) {
  console.log(`\n${dryRun ? '🔍 [DRY RUN]' : '✏️ '} 「次のステップ」セクションを削除中...\n`)

  const posts = await client.fetch(`*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body
  }`)

  let updated = 0

  for (const post of posts) {
    if (!post.body || !Array.isArray(post.body)) continue

    // 「次のステップ」見出しとその直後のリストを削除
    const newBody = []
    let skipNext = false
    let foundNextStep = false

    for (let i = 0; i < post.body.length; i++) {
      const block = post.body[i]

      // H2またはH3見出し「次のステップ」をチェック
      if (
        block._type === 'block' &&
        (block.style === 'h2' || block.style === 'h3') &&
        block.children &&
        block.children.some(child => child.text && child.text.includes('次のステップ'))
      ) {
        foundNextStep = true
        skipNext = true
        console.log(`  📌 ${post.title}`)
        console.log(`     削除: 「次のステップ」見出し (${block.style})`)
        continue
      }

      // 「次のステップ」見出しの直後のリストを削除
      if (skipNext && block.listItem) {
        console.log(`     削除: リスト項目`)
        continue
      }

      // リストが終わったらスキップ解除
      if (skipNext && !block.listItem) {
        skipNext = false
      }

      newBody.push(block)
    }

    // 変更があった場合のみ更新
    if (foundNextStep && !dryRun) {
      await client
        .patch(post._id)
        .set({ body: newBody })
        .commit()
      updated++
    } else if (foundNextStep) {
      updated++
    }
  }

  console.log(`\n${dryRun ? '📊' : '✅'} 対象記事: ${updated}件`)

  if (dryRun) {
    console.log('\n💡 実際に削除するには: node scripts/update-next-steps.js --execute')
  } else {
    console.log('\n✅ 削除完了')
  }

  return updated
}

async function main() {
  const args = process.argv.slice(2)
  const execute = args.includes('--execute')

  console.log('=' .repeat(60))
  console.log('📝 「次のステップ」セクション更新ツール')
  console.log('=' .repeat(60))

  // 分析
  await analyzeNextSteps()

  // 削除実行
  await removeNextStepsSections(!execute)

  console.log('\n' + '=' .repeat(60))
  console.log('✨ 完了')
  console.log('=' .repeat(60) + '\n')
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { analyzeNextSteps, removeNextStepsSections }
