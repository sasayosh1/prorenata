/**
 * タグ最適化適用ツール
 *
 * 記事分析結果を基に、実際にタグを更新します。
 * - 全記事または個別記事のタグを最適化
 * - ドライランモード対応（実際の更新なし）
 * - 更新前後の比較表示
 */

const { createClient } = require('@sanity/client')
const { analyzePost, extractTextFromBody, extractKeywords } = require('./analyze-content')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

/**
 * 記事のタグを最適化して更新
 */
async function optimizePostTags(postId, dryRun = false) {
  try {
    // 記事データを取得
    const post = await client.fetch(
      `*[_type == "post" && _id == $postId][0] {
        _id,
        title,
        body,
        tags,
        "categories": categories[]->title
      }`,
      { postId }
    )

    if (!post) {
      console.error('❌ 記事が見つかりません')
      return { success: false, error: 'Post not found' }
    }

    // 記事内容から最適なタグを生成
    const text = extractTextFromBody(post.body)
    const suggestedTags = extractKeywords(text, post.title, post.categories)
    const optimizedTags = suggestedTags.slice(0, 10) // 推奨10個

    console.log(`\n📝 記事: ${post.title}`)
    console.log(`🏷️  現在のタグ (${post.tags?.length || 0}個): ${post.tags?.join(', ') || 'なし'}`)
    console.log(`✨ 最適化タグ (${optimizedTags.length}個): ${optimizedTags.join(', ')}`)

    // タグの変更がない場合
    const currentTags = post.tags || []
    const hasChanges = JSON.stringify(currentTags.sort()) !== JSON.stringify(optimizedTags.sort())

    if (!hasChanges) {
      console.log('✅ タグは既に最適化されています')
      return { success: true, updated: false }
    }

    // ドライランモードの場合は更新しない
    if (dryRun) {
      console.log('🔍 [DRY RUN] 実際の更新はスキップされます\n')
      return { success: true, updated: false, dryRun: true }
    }

    // 記事を更新
    await client
      .patch(postId)
      .set({ tags: optimizedTags })
      .commit()

    console.log('✅ タグを更新しました\n')
    return {
      success: true,
      updated: true,
      before: currentTags,
      after: optimizedTags
    }

  } catch (error) {
    console.error('❌ エラー:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * 複数記事のタグを一括最適化
 */
async function optimizeBulkTags(options = {}) {
  const {
    limit = 10,
    dryRun = false,
    filter = 'all' // 'all' | 'no-tags' | 'few-tags'
  } = options

  try {
    console.log(`\n🚀 タグ一括最適化を開始`)
    console.log(`📊 設定: ${dryRun ? '[DRY RUN] ' : ''}最大${limit}件\n`)

    // フィルタ条件を構築
    let filterCondition = ''
    if (filter === 'no-tags') {
      filterCondition = '&& !defined(tags) || length(tags) == 0'
    } else if (filter === 'few-tags') {
      filterCondition = '&& defined(tags) && length(tags) < 5'
    }

    // 対象記事を取得
    const posts = await client.fetch(
      `*[_type == "post" ${filterCondition}] | order(publishedAt desc) [0...${limit}] {
        _id,
        title,
        tags
      }`
    )

    console.log(`📚 対象記事: ${posts.length}件\n`)

    const results = {
      total: posts.length,
      success: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    }

    // 各記事を順次処理
    for (let i = 0; i < posts.length; i++) {
      console.log(`[${i + 1}/${posts.length}] 処理中...`)

      const result = await optimizePostTags(posts[i]._id, dryRun)

      if (result.success) {
        results.success++
        if (result.updated) {
          results.updated++
        } else {
          results.skipped++
        }
      } else {
        results.failed++
        results.errors.push({
          postId: posts[i]._id,
          title: posts[i].title,
          error: result.error
        })
      }

      // API制限を考慮して少し待機
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // 結果サマリーを表示
    console.log('\n' + '='.repeat(60))
    console.log('📊 最適化完了サマリー')
    console.log('='.repeat(60))
    console.log(`✅ 成功: ${results.success}件`)
    console.log(`   - 更新: ${results.updated}件`)
    console.log(`   - スキップ: ${results.skipped}件`)
    console.log(`❌ 失敗: ${results.failed}件`)

    if (results.errors.length > 0) {
      console.log('\n⚠️  エラー詳細:')
      results.errors.forEach(err => {
        console.log(`  - ${err.title}: ${err.error}`)
      })
    }

    if (dryRun) {
      console.log('\n🔍 [DRY RUN] 実際の更新は行われていません')
    }

    console.log('='.repeat(60) + '\n')

    return results

  } catch (error) {
    console.error('❌ エラー:', error.message)
    throw error
  }
}

/**
 * タグ最適化が必要な記事をリストアップ
 */
async function listPostsNeedingOptimization() {
  try {
    console.log('\n🔍 タグ最適化が必要な記事を検索中...\n')

    const posts = await client.fetch(
      `*[_type == "post"] | order(publishedAt desc) {
        _id,
        title,
        tags,
        "categories": categories[]->title
      }`
    )

    const needsOptimization = {
      noTags: [],
      fewTags: [],
      noCategory: []
    }

    posts.forEach(post => {
      const tagCount = post.tags?.length || 0

      if (tagCount === 0) {
        needsOptimization.noTags.push(post)
      } else if (tagCount < 5) {
        needsOptimization.fewTags.push(post)
      }

      // カテゴリがタグに含まれていない
      if (post.categories && post.categories.length > 0) {
        const hasCategory = post.categories.some(cat =>
          post.tags && post.tags.includes(cat)
        )
        if (!hasCategory) {
          needsOptimization.noCategory.push(post)
        }
      }
    })

    console.log('📊 タグ最適化が必要な記事:')
    console.log(`  🔴 タグなし: ${needsOptimization.noTags.length}件`)
    console.log(`  🟡 タグ不足 (<5個): ${needsOptimization.fewTags.length}件`)
    console.log(`  🟠 カテゴリ未含: ${needsOptimization.noCategory.length}件`)

    const total = new Set([
      ...needsOptimization.noTags.map(p => p._id),
      ...needsOptimization.fewTags.map(p => p._id),
      ...needsOptimization.noCategory.map(p => p._id)
    ]).size

    console.log(`\n✅ 合計: ${total}件 / 全${posts.length}件\n`)

    // 最優先の5件を表示
    const topPriority = [
      ...needsOptimization.noTags.slice(0, 3),
      ...needsOptimization.fewTags.slice(0, 2)
    ].slice(0, 5)

    if (topPriority.length > 0) {
      console.log('🎯 優先度の高い記事（最大5件）:\n')
      topPriority.forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   タグ: ${post.tags?.length || 0}個 - ${post.tags?.join(', ') || 'なし'}`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}\n`)
      })
    }

    return needsOptimization

  } catch (error) {
    console.error('❌ エラー:', error.message)
    throw error
  }
}

// CLI実行
if (require.main === module) {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log(`
📝 ProReNata タグ最適化ツール

使い方:
  # 最適化が必要な記事をリストアップ
  node scripts/optimize-tags.js --list

  # 特定記事のタグを最適化（実際に更新）
  node scripts/optimize-tags.js <記事ID>

  # 特定記事のタグを最適化（DRY RUN）
  node scripts/optimize-tags.js <記事ID> --dry-run

  # タグなし記事を一括最適化（実際に更新）
  node scripts/optimize-tags.js --bulk --filter no-tags --limit 10

  # 全記事を一括最適化（DRY RUN）
  node scripts/optimize-tags.js --bulk --limit 20 --dry-run

オプション:
  --list              最適化が必要な記事をリストアップ
  --bulk              一括最適化モード
  --dry-run           実際の更新を行わずに確認のみ
  --limit <数>        処理する記事数（デフォルト: 10）
  --filter <条件>     フィルタ（all | no-tags | few-tags）

環境変数:
  SANITY_API_TOKEN が必要です
    `)
    process.exit(1)
  }

  const dryRun = args.includes('--dry-run')
  const limitIndex = args.indexOf('--limit')
  const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : 10
  const filterIndex = args.indexOf('--filter')
  const filter = filterIndex !== -1 ? args[filterIndex + 1] : 'all'

  if (args[0] === '--list') {
    listPostsNeedingOptimization().catch(console.error)
  } else if (args[0] === '--bulk') {
    optimizeBulkTags({ limit, dryRun, filter }).catch(console.error)
  } else {
    optimizePostTags(args[0], dryRun).catch(console.error)
  }
}

module.exports = {
  optimizePostTags,
  optimizeBulkTags,
  listPostsNeedingOptimization
}
