/**
 * アフィリエイトリンク最適化スクリプト
 *
 * 以下の問題を自動修正します：
 * 1. 連続するアフィリエイトリンク（2個以上連続）
 * 2. リンク数が多すぎる記事（4個以上）
 * 3. 記事内容と関連性が低いリンク（退職系記事以外の退職代行リンク）
 */

// .env.local から環境変数を読み込む
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })

const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

// アフィリエイトリンクのドメインパターン
const AFFILIATE_DOMAINS = [
  'af.moshimo.com',
  'tcs-asp.net',
  'amazon.co.jp',
  'a8.net',
  'valuecommerce.com'
]

// 退職代行サービスのURLパターン
const RETIREMENT_SERVICE_PATTERNS = [
  'tcs-asp.net', // 汐留パートナーズ
  '退職代行',
  'taishoku'
]

/**
 * ブロックがアフィリエイトリンクを含むかチェック
 */
function hasAffiliateLink(block) {
  if (block._type !== 'block' || !block.markDefs) return false

  return block.markDefs.some(mark => {
    if (mark._type !== 'link' || !mark.href) return false
    return AFFILIATE_DOMAINS.some(domain => mark.href.includes(domain))
  })
}

/**
 * ブロックが退職代行リンクを含むかチェック
 */
function hasRetirementServiceLink(block) {
  if (block._type !== 'block' || !block.markDefs) return false

  return block.markDefs.some(mark => {
    if (mark._type !== 'link' || !mark.href) return false
    return RETIREMENT_SERVICE_PATTERNS.some(pattern => mark.href.includes(pattern))
  })
}

/**
 * ブロックが見出しかチェック
 */
function isHeading(block) {
  return block._type === 'block' && block.style && block.style.startsWith('h')
}

/**
 * 連続するアフィリエイトリンクを検出
 */
function findConsecutiveAffiliateLinks(body) {
  const consecutive = []
  let consecutiveCount = 0
  let startIndex = -1

  body.forEach((block, index) => {
    if (hasAffiliateLink(block)) {
      if (consecutiveCount === 0) {
        startIndex = index
      }
      consecutiveCount++
    } else if (!isHeading(block)) { // 見出しは区切りとしてカウントしない
      if (consecutiveCount >= 2) {
        consecutive.push({
          startIndex,
          count: consecutiveCount,
          endIndex: index - 1
        })
      }
      consecutiveCount = 0
      startIndex = -1
    }
  })

  // 最後まで連続している場合
  if (consecutiveCount >= 2) {
    consecutive.push({
      startIndex,
      count: consecutiveCount,
      endIndex: body.length - 1
    })
  }

  return consecutive
}

/**
 * アフィリエイトリンクの総数をカウント
 */
function countAffiliateLinks(body) {
  return body.filter(block => hasAffiliateLink(block)).length
}

/**
 * 記事タイトルに退職・辞めるが含まれるかチェック
 */
function isRetirementRelatedArticle(title) {
  const keywords = ['退職', '辞め', '辞める', 'やめ', 'やめる', '転職']
  return keywords.some(keyword => title.includes(keyword))
}

/**
 * 連続するアフィリエイトリンクを削減（2個に1個削除）
 */
function reduceConsecutiveLinks(body) {
  const consecutive = findConsecutiveAffiliateLinks(body)
  if (consecutive.length === 0) return { body, removed: 0 }

  let modifiedBody = [...body]
  let totalRemoved = 0

  // 後ろから処理（インデックスのズレを防ぐ）
  consecutive.reverse().forEach(({ startIndex, count }) => {
    let removed = 0
    // 2個に1個削除（奇数番目のリンクを削除）
    for (let i = startIndex + 1; i < startIndex + count; i += 2 - removed) {
      if (hasAffiliateLink(modifiedBody[i])) {
        modifiedBody.splice(i, 1)
        removed++
        totalRemoved++
      }
    }
  })

  return { body: modifiedBody, removed: totalRemoved }
}

/**
 * リンク数が多すぎる場合、後半のリンクを削除（推奨2-3個まで削減）
 */
function reduceTotalLinks(body, maxLinks = 3) {
  const affiliateBlocks = []

  body.forEach((block, index) => {
    if (hasAffiliateLink(block)) {
      affiliateBlocks.push(index)
    }
  })

  if (affiliateBlocks.length <= maxLinks) {
    return { body, removed: 0 }
  }

  // 後半のリンクを削除
  const toRemove = affiliateBlocks.slice(maxLinks)
  let modifiedBody = [...body]

  // 後ろから削除（インデックスのズレを防ぐ）
  toRemove.reverse().forEach(index => {
    modifiedBody.splice(index, 1)
  })

  return { body: modifiedBody, removed: toRemove.length }
}

/**
 * 記事内容と関連性が低いリンクを削除
 */
function removeIrrelevantLinks(body, title, categories = []) {
  const isRetirementArticle = isRetirementRelatedArticle(title) ||
    categories.some(cat => cat.includes('退職') || cat.includes('転職'))

  if (isRetirementArticle) {
    return { body, removed: 0 } // 退職関連記事はそのまま
  }

  // 退職関連記事でない場合、退職代行リンクを削除
  const modifiedBody = body.filter(block => !hasRetirementServiceLink(block))
  const removed = body.length - modifiedBody.length

  return { body: modifiedBody, removed }
}

/**
 * アフィリエイトリンクを最適化
 */
function optimizeAffiliateLinks(body, title, categories = []) {
  let currentBody = body
  let totalChanges = {
    consecutiveRemoved: 0,
    excessRemoved: 0,
    irrelevantRemoved: 0
  }

  // 1. 連続するリンクを削減
  const consecutiveResult = reduceConsecutiveLinks(currentBody)
  currentBody = consecutiveResult.body
  totalChanges.consecutiveRemoved = consecutiveResult.removed

  // 2. 関連性の低いリンクを削除
  const relevanceResult = removeIrrelevantLinks(currentBody, title, categories)
  currentBody = relevanceResult.body
  totalChanges.irrelevantRemoved = relevanceResult.removed

  // 3. 総リンク数を制限
  const totalResult = reduceTotalLinks(currentBody, 3)
  currentBody = totalResult.body
  totalChanges.excessRemoved = totalResult.removed

  const hasChanges = totalChanges.consecutiveRemoved > 0 ||
                     totalChanges.excessRemoved > 0 ||
                     totalChanges.irrelevantRemoved > 0

  return {
    body: currentBody,
    changes: totalChanges,
    hasChanges
  }
}

/**
 * 最適化が必要な記事を取得
 */
async function getArticlesNeedingOptimization() {
  const query = `*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body,
    "categories": categories[]->title
  }`

  const posts = await client.fetch(query)
  const needingOptimization = []

  posts.forEach(post => {
    if (!post.body || !Array.isArray(post.body)) return

    const consecutive = findConsecutiveAffiliateLinks(post.body)
    const totalLinks = countAffiliateLinks(post.body)
    const hasIrrelevant = !isRetirementRelatedArticle(post.title) &&
      post.body.some(block => hasRetirementServiceLink(block))

    if (consecutive.length > 0 || totalLinks > 3 || hasIrrelevant) {
      needingOptimization.push({
        ...post,
        issues: {
          consecutive: consecutive.length > 0,
          tooMany: totalLinks > 3,
          irrelevant: hasIrrelevant,
          totalLinks
        }
      })
    }
  })

  return needingOptimization
}

/**
 * 記事のアフィリエイトリンクを最適化
 */
async function optimizeArticleLinks(postId, dryRun = true) {
  const query = `*[_id == $postId][0]{_id, title, body, "categories": categories[]->title}`
  const post = await client.fetch(query, { postId })

  if (!post || !post.body) {
    console.log(`⚠️  記事 ${postId} が見つからないか、本文がありません`)
    return null
  }

  const result = optimizeAffiliateLinks(post.body, post.title, post.categories || [])

  if (!result.hasChanges) {
    console.log(`✅ 記事「${post.title}」は既に最適化されています`)
    return null
  }

  console.log(`\n📝 記事「${post.title}」`)
  console.log(`   ID: ${postId}`)
  console.log(`   削除内容:`)
  if (result.changes.consecutiveRemoved > 0) {
    console.log(`     - 連続リンク削減: ${result.changes.consecutiveRemoved}件`)
  }
  if (result.changes.irrelevantRemoved > 0) {
    console.log(`     - 関連性低いリンク削除: ${result.changes.irrelevantRemoved}件`)
  }
  if (result.changes.excessRemoved > 0) {
    console.log(`     - 過剰リンク削除: ${result.changes.excessRemoved}件`)
  }

  if (dryRun) {
    console.log(`   ⚠️  DRY RUN: 実際には更新されていません`)
    return { postId, changes: result.changes, dryRun: true }
  }

  // 実際に更新
  await client
    .patch(postId)
    .set({ body: result.body })
    .commit()

  console.log(`   ✅ 更新完了`)

  return { postId, changes: result.changes, updated: true }
}

/**
 * 複数記事を一括処理
 */
async function optimizeMultipleArticles(postIds, dryRun = true) {
  console.log(`\n🚀 アフィリエイトリンク最適化を開始します`)
  console.log(`   対象記事: ${postIds.length}件`)
  console.log(`   モード: ${dryRun ? 'DRY RUN（確認のみ）' : '実際に更新'}`)
  console.log('='.repeat(60))

  const results = []

  for (const postId of postIds) {
    const result = await optimizeArticleLinks(postId, dryRun)
    if (result) {
      results.push(result)
    }
    console.log('='.repeat(60))
  }

  // サマリー
  console.log(`\n📊 最適化サマリー\n`)
  console.log(`   処理した記事: ${postIds.length}件`)
  console.log(`   最適化した記事: ${results.length}件`)

  const totalChanges = results.reduce((sum, r) => ({
    consecutive: sum.consecutive + (r.changes.consecutiveRemoved || 0),
    irrelevant: sum.irrelevant + (r.changes.irrelevantRemoved || 0),
    excess: sum.excess + (r.changes.excessRemoved || 0)
  }), { consecutive: 0, irrelevant: 0, excess: 0 })

  console.log(`   削除したリンク合計: ${totalChanges.consecutive + totalChanges.irrelevant + totalChanges.excess}件`)
  console.log(`     - 連続リンク: ${totalChanges.consecutive}件`)
  console.log(`     - 関連性低い: ${totalChanges.irrelevant}件`)
  console.log(`     - 過剰リンク: ${totalChanges.excess}件`)

  if (dryRun) {
    console.log(`\n⚠️  これはDRY RUNです。実際に更新するには --apply オプションを付けてください`)
  } else {
    console.log(`\n✅ すべての記事を最適化しました`)
  }

  return results
}

// CLI実行
if (require.main === module) {
  const args = process.argv.slice(2)
  const command = args[0]

  switch (command) {
    case 'check':
      // 最適化が必要な記事を一覧表示
      getArticlesNeedingOptimization()
        .then(articles => {
          console.log(`\n🔍 アフィリエイトリンク最適化が必要な記事: ${articles.length}件\n`)
          articles.slice(0, 20).forEach((article, i) => {
            console.log(`${i + 1}. ${article.title}`)
            console.log(`   ID: ${article._id}`)
            console.log(`   問題: ${[
              article.issues.consecutive ? '連続リンク' : '',
              article.issues.tooMany ? `リンク多すぎ(${article.issues.totalLinks}件)` : '',
              article.issues.irrelevant ? '関連性低い' : ''
            ].filter(Boolean).join(', ')}`)
            console.log(`   URL: /posts/${article.slug}\n`)
          })
          if (articles.length > 20) {
            console.log(`   ... 他${articles.length - 20}件\n`)
          }
        })
        .catch(console.error)
      break

    case 'optimize':
      // 特定の記事を最適化
      const postId = args[1]
      const apply = args.includes('--apply')

      if (!postId) {
        console.error('❌ 記事IDを指定してください')
        console.log('使い方: node scripts/optimize-affiliate-links.js optimize <POST_ID> [--apply]')
        process.exit(1)
      }

      optimizeArticleLinks(postId, !apply).catch(console.error)
      break

    case 'optimize-all':
      // 検出されたすべての記事を最適化
      const applyAll = args.includes('--apply')

      getArticlesNeedingOptimization()
        .then(articles => {
          const postIds = articles.map(a => a._id)
          return optimizeMultipleArticles(postIds, !applyAll)
        })
        .catch(console.error)
      break

    case 'optimize-top':
      // 上位N件を最適化
      const count = parseInt(args[1]) || 10
      const applyTop = args.includes('--apply')

      getArticlesNeedingOptimization()
        .then(articles => {
          const postIds = articles.slice(0, count).map(a => a._id)
          return optimizeMultipleArticles(postIds, !applyTop)
        })
        .catch(console.error)
      break

    default:
      console.log(`
🔗 アフィリエイトリンク最適化ツール

使い方:
  node scripts/optimize-affiliate-links.js <コマンド> [オプション]

コマンド:
  check                最適化が必要な記事を一覧表示
  optimize <POST_ID>   特定の記事を最適化（DRY RUN）
  optimize <POST_ID> --apply  特定の記事を実際に更新
  optimize-all         すべての記事を最適化（DRY RUN）
  optimize-all --apply すべての記事を実際に更新
  optimize-top [数]    上位N件を最適化（デフォルト: 10件）（DRY RUN）
  optimize-top [数] --apply   上位N件を実際に更新

最適化内容:
  1. 連続するアフィリエイトリンクを削減（2個に1個削除）
  2. リンク数を推奨範囲（2-3個）に削減
  3. 記事内容と関連性が低いリンクを削除
     （退職関連記事以外の退職代行リンクなど）

例:
  # 最適化が必要な記事を確認
  node scripts/optimize-affiliate-links.js check

  # 上位10件を確認（実際には更新しない）
  node scripts/optimize-affiliate-links.js optimize-top 10

  # 全記事を実際に最適化
  node scripts/optimize-affiliate-links.js optimize-all --apply

注意:
  --apply オプションなしで実行すると DRY RUN モードになります
  DRY RUN では実際には更新せず、削除内容のプレビューのみ表示します
  .env.localからSANITY_API_TOKENを自動読み込みします
      `)
  }
}

module.exports = {
  hasAffiliateLink,
  hasRetirementServiceLink,
  findConsecutiveAffiliateLinks,
  countAffiliateLinks,
  isRetirementRelatedArticle,
  optimizeAffiliateLinks,
  getArticlesNeedingOptimization,
  optimizeArticleLinks,
  optimizeMultipleArticles
}
