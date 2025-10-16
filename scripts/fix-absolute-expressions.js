/**
 * YMYL対策：断定表現の一括修正スクリプト
 *
 * 「絶対」「必ず」「確実に」などの断定表現を
 * YMYL基準に適した推奨表現に自動置換します
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

// 断定表現と推奨表現のマッピング
// 文脈を壊さないよう、より自然な表現に置換
const EXPRESSION_REPLACEMENTS = {
  // 基本的な断定表現（順序重要：長い表現から先に処理）
  '絶対に': '非常に',
  '必ず': '多くの場合',
  '確実に': '高い確率で',
  '100%': 'ほぼすべての場合',

  // 対象範囲の断定
  '誰でも': '多くの人が',
  'すべての人が': '多くの人が',
  '全員が': '多くの人が',
  '間違いなく': '高い確率で',

  // 完璧性の断定
  '完璧': 'より良い状態',

  // 保証の断定
  '保証します': '期待できます',
  '保証される': '期待できます',
}

/**
 * テキストから断定表現を検出
 */
function detectAbsoluteExpressions(text) {
  const detected = []

  Object.keys(EXPRESSION_REPLACEMENTS).forEach(expression => {
    if (text.includes(expression)) {
      detected.push(expression)
    }
  })

  return detected
}

/**
 * テキスト内の断定表現を推奨表現に置換
 */
function replaceAbsoluteExpressions(text) {
  let modifiedText = text
  let replacements = []

  // 基本的な置換
  Object.entries(EXPRESSION_REPLACEMENTS).forEach(([absolute, recommended]) => {
    if (modifiedText.includes(absolute)) {
      const count = (modifiedText.match(new RegExp(absolute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
      modifiedText = modifiedText.replace(new RegExp(absolute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), recommended)
      replacements.push({
        from: absolute,
        to: recommended,
        count
      })
    }
  })

  return {
    text: modifiedText,
    replacements,
    hasChanges: replacements.length > 0
  }
}

/**
 * 記事のbodyブロックを修正
 */
function fixArticleBody(body) {
  if (!body || !Array.isArray(body)) return { body, changes: [] }

  const changes = []
  const modifiedBody = body.map(block => {
    if (block._type === 'block' && block.children) {
      const modifiedChildren = block.children.map(child => {
        if (child.text) {
          const result = replaceAbsoluteExpressions(child.text)
          if (result.hasChanges) {
            changes.push({
              blockKey: block._key,
              original: child.text,
              modified: result.text,
              replacements: result.replacements
            })
            return { ...child, text: result.text }
          }
        }
        return child
      })

      return { ...block, children: modifiedChildren }
    }
    return block
  })

  return {
    body: modifiedBody,
    changes
  }
}

/**
 * 断定表現を含む記事を取得
 */
async function getArticlesWithAbsoluteExpressions() {
  const query = `*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body,
    _updatedAt,
    "categories": categories[]->title
  }`

  const posts = await client.fetch(query)
  const articlesWithIssues = []

  posts.forEach(post => {
    if (!post.body || !Array.isArray(post.body)) return

    const bodyText = post.body
      .filter(block => block._type === 'block' && block.children)
      .map(block => block.children.map(child => child.text || '').join(''))
      .join('\n')

    const detected = detectAbsoluteExpressions(bodyText)

    if (detected.length > 0) {
      articlesWithIssues.push({
        ...post,
        detectedExpressions: [...new Set(detected)]
      })
    }
  })

  return articlesWithIssues
}

/**
 * 記事を修正して更新
 */
async function fixArticle(postId, dryRun = true) {
  const post = await client.getDocument(postId)

  if (!post || !post.body) {
    console.log(`⚠️  記事 ${postId} が見つからないか、本文がありません`)
    return null
  }

  const result = fixArticleBody(post.body)

  if (!result.changes.length) {
    console.log(`✅ 記事「${post.title}」に修正箇所はありませんでした`)
    return null
  }

  console.log(`\n📝 記事「${post.title}」`)
  console.log(`   ID: ${postId}`)
  console.log(`   修正箇所: ${result.changes.length}件\n`)

  result.changes.forEach((change, i) => {
    console.log(`   ${i + 1}. ${change.replacements.map(r => `"${r.from}" → "${r.to}"`).join(', ')}`)
  })

  if (dryRun) {
    console.log(`\n   ⚠️  DRY RUN: 実際には更新されていません`)
    return { postId, changes: result.changes, dryRun: true }
  }

  // 実際に更新
  await client
    .patch(postId)
    .set({ body: result.body })
    .commit()

  console.log(`\n   ✅ 更新完了`)

  return { postId, changes: result.changes, updated: true }
}

/**
 * 複数記事を一括修正
 */
async function fixMultipleArticles(postIds, dryRun = true) {
  console.log(`\n🚀 断定表現の一括修正を開始します`)
  console.log(`   対象記事: ${postIds.length}件`)
  console.log(`   モード: ${dryRun ? 'DRY RUN（確認のみ）' : '実際に更新'}`)
  console.log('='.repeat(60))

  const results = []

  for (const postId of postIds) {
    const result = await fixArticle(postId, dryRun)
    if (result) {
      results.push(result)
    }
    console.log('='.repeat(60))
  }

  // サマリー
  console.log(`\n📊 修正サマリー\n`)
  console.log(`   処理した記事: ${postIds.length}件`)
  console.log(`   修正が必要な記事: ${results.length}件`)
  console.log(`   修正箇所の合計: ${results.reduce((sum, r) => sum + r.changes.length, 0)}件`)

  if (dryRun) {
    console.log(`\n⚠️  これはDRY RUNです。実際に更新するには --apply オプションを付けてください`)
  } else {
    console.log(`\n✅ すべての記事を更新しました`)
  }

  return results
}

// CLI実行
if (require.main === module) {
  const args = process.argv.slice(2)
  const command = args[0]

  // トークンの確認
  if (!process.env.SANITY_API_TOKEN) {
    console.error('❌ SANITY_API_TOKENが設定されていません')
    console.error('.env.localファイルを確認してください')
    process.exit(1)
  }

  switch (command) {
    case 'check':
      // 断定表現を含む記事を一覧表示
      getArticlesWithAbsoluteExpressions()
        .then(articles => {
          console.log(`\n🔍 断定表現を含む記事: ${articles.length}件\n`)
          articles.slice(0, 10).forEach((article, i) => {
            console.log(`${i + 1}. ${article.title}`)
            console.log(`   ID: ${article._id}`)
            console.log(`   検出: ${article.detectedExpressions.join(', ')}`)
            console.log(`   URL: /posts/${article.slug}\n`)
          })

          if (articles.length > 10) {
            console.log(`   ... 他${articles.length - 10}件\n`)
          }
        })
        .catch(console.error)
      break

    case 'fix':
      // 特定の記事を修正
      const postId = args[1]
      const apply = args.includes('--apply')

      if (!postId) {
        console.error('❌ 記事IDを指定してください')
        console.log('使い方: node scripts/fix-absolute-expressions.js fix <POST_ID> [--apply]')
        process.exit(1)
      }

      fixArticle(postId, !apply).catch(console.error)
      break

    case 'fix-all':
      // 検出されたすべての記事を修正
      const applyAll = args.includes('--apply')

      getArticlesWithAbsoluteExpressions()
        .then(articles => {
          const postIds = articles.map(a => a._id)
          return fixMultipleArticles(postIds, !applyAll)
        })
        .catch(console.error)
      break

    case 'fix-top':
      // 上位N件を修正
      const count = parseInt(args[1]) || 10
      const applyTop = args.includes('--apply')

      getArticlesWithAbsoluteExpressions()
        .then(articles => {
          const postIds = articles.slice(0, count).map(a => a._id)
          return fixMultipleArticles(postIds, !applyTop)
        })
        .catch(console.error)
      break

    default:
      console.log(`
📝 YMYL対策：断定表現の一括修正ツール

使い方:
  node scripts/fix-absolute-expressions.js <コマンド> [オプション]

コマンド:
  check              断定表現を含む記事を一覧表示
  fix <POST_ID>      特定の記事を修正（DRY RUN）
  fix <POST_ID> --apply  特定の記事を実際に修正
  fix-all            すべての記事を修正（DRY RUN）
  fix-all --apply    すべての記事を実際に修正
  fix-top [数]       上位N件を修正（デフォルト: 10件）（DRY RUN）
  fix-top [数] --apply   上位N件を実際に修正

例:
  # 断定表現を含む記事を確認
  node scripts/fix-absolute-expressions.js check

  # 上位10件を確認（実際には修正しない）
  node scripts/fix-absolute-expressions.js fix-top 10

  # 上位10件を実際に修正
  node scripts/fix-absolute-expressions.js fix-top 10 --apply

修正される表現の例:
  「絶対に」 → 「非常に」
  「必ず」 → 「多くの場合」
  「確実に」 → 「高い確率で」
  「誰でも」 → 「多くの人が」
  「完璧」 → 「より良い状態」

注意:
  --apply オプションなしで実行すると DRY RUN モードになります
  DRY RUN では実際には更新せず、修正内容のプレビューのみ表示します
  .env.localからSANITY_API_TOKENを自動読み込みします
      `)
  }
}

module.exports = {
  detectAbsoluteExpressions,
  replaceAbsoluteExpressions,
  fixArticleBody,
  getArticlesWithAbsoluteExpressions,
  fixArticle,
  fixMultipleArticles
}
