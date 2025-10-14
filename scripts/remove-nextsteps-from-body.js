/**
 * 記事本文から「次のステップ」セクションを削除するスクリプト
 *
 * フロントエンド側でRelatedPostsコンポーネントが「次のステップ」を表示するため、
 * Sanityのbodyフィールドに含まれる「次のステップ」セクションは不要です。
 * このスクリプトは、bodyから「次のステップ」H2見出しとそれ以降のブロックを削除します。
 */

const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

/**
 * 全記事から「次のステップ」セクションを削除
 */
async function removeNextStepsFromAllPosts() {
  console.log('📝 全記事を取得中...\n')

  const query = `*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body
  }`

  try {
    const posts = await client.fetch(query)
    console.log(`✅ ${posts.length}件の記事を取得しました\n`)

    let updatedCount = 0
    let skippedCount = 0

    for (const post of posts) {
      if (!post.body || !Array.isArray(post.body)) {
        skippedCount++
        continue
      }

      // 「次のステップ」H2見出しを探す
      const nextStepsIndex = post.body.findIndex(block =>
        block._type === 'block' &&
        block.style === 'h2' &&
        block.children?.some(child =>
          child.text?.includes('次のステップ')
        )
      )

      if (nextStepsIndex === -1) {
        // 「次のステップ」セクションが見つからない
        skippedCount++
        continue
      }

      // 「次のステップ」セクション以降のブロックを削除
      const newBody = post.body.slice(0, nextStepsIndex)

      console.log(`🔄 ${post.title}`)
      console.log(`   元のブロック数: ${post.body.length}`)
      console.log(`   新しいブロック数: ${newBody.length}`)
      console.log(`   削除するブロック数: ${post.body.length - newBody.length}`)
      console.log(`   URL: /posts/${post.slug}\n`)

      // Sanityに更新を送信
      await client
        .patch(post._id)
        .set({ body: newBody })
        .commit()

      updatedCount++
    }

    console.log('\n='.repeat(60))
    console.log('📊 処理結果サマリー\n')
    console.log(`  ✅ 更新: ${updatedCount}件`)
    console.log(`  ⏭️  スキップ: ${skippedCount}件`)
    console.log(`  📝 合計: ${posts.length}件`)
    console.log('='.repeat(60))

    if (updatedCount > 0) {
      console.log('\n✅ すべての記事から「次のステップ」セクションを削除しました')
    } else {
      console.log('\n✨ 「次のステップ」セクションを含む記事は見つかりませんでした')
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
    process.exit(1)
  }
}

/**
 * 特定の記事から「次のステップ」セクションを削除
 */
async function removeNextStepsFromPost(slug) {
  console.log(`📝 記事を取得中: ${slug}\n`)

  const query = `*[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    body
  }`

  try {
    const post = await client.fetch(query, { slug })

    if (!post) {
      console.error('❌ 記事が見つかりません')
      return
    }

    console.log(`✅ 記事を取得: ${post.title}\n`)

    if (!post.body || !Array.isArray(post.body)) {
      console.log('⚠️  この記事にはbodyフィールドがありません')
      return
    }

    // 「次のステップ」H2見出しを探す
    const nextStepsIndex = post.body.findIndex(block =>
      block._type === 'block' &&
      block.style === 'h2' &&
      block.children?.some(child =>
        child.text?.includes('次のステップ')
      )
    )

    if (nextStepsIndex === -1) {
      console.log('✨ 「次のステップ」セクションは見つかりませんでした')
      return
    }

    // 「次のステップ」セクション以降のブロックを削除
    const newBody = post.body.slice(0, nextStepsIndex)

    console.log(`📊 変更内容:`)
    console.log(`   元のブロック数: ${post.body.length}`)
    console.log(`   新しいブロック数: ${newBody.length}`)
    console.log(`   削除するブロック数: ${post.body.length - newBody.length}\n`)

    // Sanityに更新を送信
    console.log('💾 Sanityに更新を送信中...')
    await client
      .patch(post._id)
      .set({ body: newBody })
      .commit()

    console.log('✅ 更新完了!')

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
    process.exit(1)
  }
}

// CLI実行
if (require.main === module) {
  const args = process.argv.slice(2)
  const command = args[0]

  if (command === 'all') {
    // 全記事から削除
    removeNextStepsFromAllPosts().catch(console.error)
  } else if (command) {
    // 特定の記事から削除（slugを指定）
    removeNextStepsFromPost(command).catch(console.error)
  } else {
    console.log(`
📝 「次のステップ」セクション削除ツール

使い方:
  SANITY_API_TOKEN=<token> node scripts/remove-nextsteps-from-body.js <コマンド>

コマンド:
  all                全記事から「次のステップ」セクションを削除
  <slug>             特定の記事から削除（記事のslugを指定）

例:
  # 全記事から削除
  SANITY_API_TOKEN=<token> node scripts/remove-nextsteps-from-body.js all

  # 特定の記事から削除
  SANITY_API_TOKEN=<token> node scripts/remove-nextsteps-from-body.js nursing-assistant-quit-retirement

環境変数:
  SANITY_API_TOKEN が必要です
    `)
  }
}

module.exports = {
  removeNextStepsFromAllPosts,
  removeNextStepsFromPost
}
