/**
 * YMYL対策：統計データに出典リンクを自動追加
 *
 * 統計キーワードを含む段落に公的機関の出典リンクを追加します
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

// 統計キーワード（出典が必要な表現）
// より具体的な統計表現のみを対象とする
const STATS_KEYWORDS = [
  '平均月給',
  '平均給与',
  '平均年収',
  '平均時給',
  '平均.*円',
  '約.*万円',
  '.*万円.*程度',
  '.*万円.*前後',
  '.*万円.*となっ',
  '.*円.*程度',
  '.*円から.*円',
  '統計.*によると',
  'データ.*によると',
  '調査.*によると',
  '.*によると.*万円',
  '.*によると.*円',
  '施設数.*約',
  '従事者数.*約',
  '.*%.*割合',
  '.*%.*占め',
  '相場.*円',
  '目安.*円'
]

// カテゴリ・内容別の推奨出典
const CITATION_TEMPLATES = {
  // 給与関連記事
  salary: {
    keywords: ['月給', '年収', '給料', '賃金', '収入', '手当', '処遇'],
    citation: {
      text: '厚生労働省 令和5年度介護従事者処遇状況等調査',
      url: 'https://www.mhlw.go.jp/toukei/list/176-1.html'
    }
  },
  // 施設・雇用統計
  facilities: {
    keywords: ['施設数', '病院数', '従事者数', '就業者数', '雇用'],
    citation: {
      text: '厚生労働省 医療施設調査',
      url: 'https://www.mhlw.go.jp/toukei/list/79-1.html'
    }
  },
  // 資格・教育関連
  education: {
    keywords: ['養成所', '入学', '卒業', '准看護師', '看護学校'],
    citation: {
      text: '厚生労働省 看護師等学校養成所調査',
      url: 'https://www.mhlw.go.jp/toukei/list/100-1.html'
    }
  }
}

/**
 * テキストに統計キーワードが含まれているかチェック
 */
function hasStatsKeyword(text) {
  // 正規表現パターンでマッチング
  return STATS_KEYWORDS.some(keyword => {
    const regex = new RegExp(keyword, 'g')
    return regex.test(text)
  })
}

/**
 * 段落に既に出典リンクが含まれているかチェック
 */
function hasCitation(block, nextBlock) {
  // 現在のブロックにリンクがあるか
  const hasLink = block.children?.some(child => child.marks?.includes('link'))

  // 次のブロックが「参考:」で始まっているか
  const nextHasCitation = nextBlock?.children?.[0]?.text?.startsWith('参考:')

  return hasLink || nextHasCitation
}

/**
 * テキスト内容から最適な出典を選択
 */
function selectCitation(text, categories = []) {
  // カテゴリから優先度を決定
  const categoryNames = categories.join(' ')

  if (categoryNames.includes('給与') || categoryNames.includes('待遇')) {
    return CITATION_TEMPLATES.salary.citation
  }

  // テキスト内容から判定
  for (const [type, template] of Object.entries(CITATION_TEMPLATES)) {
    if (template.keywords.some(keyword => text.includes(keyword))) {
      return template.citation
    }
  }

  // デフォルト（給与関連が最も多い）
  return CITATION_TEMPLATES.salary.citation
}

/**
 * 出典ブロックを生成
 */
function createCitationBlock(citation, blockKey) {
  // ランダムなキーを生成（Sanityの標準形式）
  const randomKey = Math.random().toString(36).substring(2, 15)
  const linkKey = Math.random().toString(36).substring(2, 15)

  return {
    _type: 'block',
    _key: randomKey,
    style: 'normal',
    children: [
      {
        _type: 'span',
        _key: Math.random().toString(36).substring(2, 15),
        text: '参考: ',
        marks: []
      },
      {
        _type: 'span',
        _key: Math.random().toString(36).substring(2, 15),
        text: citation.text,
        marks: [linkKey]
      }
    ],
    markDefs: [
      {
        _type: 'link',
        _key: linkKey,
        href: citation.url
      }
    ]
  }
}

/**
 * 記事本文に出典を追加
 */
function addCitationsToBody(body, categories = []) {
  if (!body || !Array.isArray(body)) return { body, changes: [] }

  const changes = []
  const modifiedBody = []

  for (let i = 0; i < body.length; i++) {
    const block = body[i]
    const nextBlock = body[i + 1]

    modifiedBody.push(block)

    // 通常の段落ブロックのみ対象
    if (block._type !== 'block' || !block.children) continue

    // 見出しやリストはスキップ
    if (block.style && (block.style.startsWith('h') || block.listItem)) continue

    // 段落のテキストを結合
    const text = block.children.map(child => child.text || '').join('')

    // スキップ条件
    // - 短すぎる段落（50文字未満）
    // - 「関連記事」を含む
    // - 箇条書き的な短い文（単発の項目）
    if (text.length < 50 ||
        text.includes('関連記事') ||
        text.includes('詳しくは') ||
        text.startsWith('・') ||
        text.startsWith('※')) {
      continue
    }

    // 統計キーワードを含み、まだ出典がない場合
    if (hasStatsKeyword(text) && !hasCitation(block, nextBlock)) {
      const citation = selectCitation(text, categories)
      const citationBlock = createCitationBlock(citation, block._key)

      modifiedBody.push(citationBlock)

      changes.push({
        blockKey: block._key,
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        citation: citation.text
      })
    }
  }

  return {
    body: modifiedBody,
    changes
  }
}

/**
 * 出典が不足している記事を取得
 */
async function getArticlesNeedingCitations() {
  const query = `*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body,
    "categories": categories[]->title,
    _updatedAt
  }`

  const posts = await client.fetch(query)
  const articlesNeeding = []

  posts.forEach(post => {
    if (!post.body || !Array.isArray(post.body)) return

    let hasStats = false
    let hasCitationLink = false

    post.body.forEach(block => {
      if (block._type === 'block' && block.children) {
        const text = block.children.map(child => child.text || '').join('')

        if (hasStatsKeyword(text)) {
          hasStats = true
        }

        if (block.markDefs?.some(mark => mark._type === 'link' &&
            (mark.href?.includes('mhlw.go.jp') ||
             mark.href?.includes('stat.go.jp') ||
             mark.href?.includes('jil.go.jp') ||
             mark.href?.includes('nurse.or.jp')))) {
          hasCitationLink = true
        }
      }
    })

    if (hasStats && !hasCitationLink) {
      articlesNeeding.push(post)
    }
  })

  return articlesNeeding
}

/**
 * 記事を修正して更新
 */
async function addCitationsToArticle(postId, dryRun = true) {
  const query = `*[_id == $postId][0]{_id, title, body, "categories": categories[]->title}`
  const post = await client.fetch(query, { postId })

  if (!post || !post.body) {
    console.log(`⚠️  記事 ${postId} が見つからないか、本文がありません`)
    return null
  }

  const result = addCitationsToBody(post.body, post.categories || [])

  if (!result.changes.length) {
    console.log(`✅ 記事「${post.title}」に追加する出典はありませんでした`)
    return null
  }

  console.log(`\n📝 記事「${post.title}」`)
  console.log(`   ID: ${postId}`)
  console.log(`   追加する出典: ${result.changes.length}件\n`)

  result.changes.forEach((change, i) => {
    console.log(`   ${i + 1}. 段落: "${change.text}"`)
    console.log(`      出典: ${change.citation}\n`)
  })

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
async function addCitationsToMultipleArticles(postIds, dryRun = true) {
  console.log(`\n🚀 出典リンクの一括追加を開始します`)
  console.log(`   対象記事: ${postIds.length}件`)
  console.log(`   モード: ${dryRun ? 'DRY RUN（確認のみ）' : '実際に更新'}`)
  console.log('='.repeat(60))

  const results = []

  for (const postId of postIds) {
    const result = await addCitationsToArticle(postId, dryRun)
    if (result) {
      results.push(result)
    }
    console.log('='.repeat(60))
  }

  // サマリー
  console.log(`\n📊 追加サマリー\n`)
  console.log(`   処理した記事: ${postIds.length}件`)
  console.log(`   出典を追加した記事: ${results.length}件`)
  console.log(`   追加した出典の合計: ${results.reduce((sum, r) => sum + r.changes.length, 0)}件`)

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

  switch (command) {
    case 'check':
      // 出典が必要な記事を一覧表示
      getArticlesNeedingCitations()
        .then(articles => {
          console.log(`\n🔍 出典が必要な記事: ${articles.length}件\n`)
          articles.forEach((article, i) => {
            console.log(`${i + 1}. ${article.title}`)
            console.log(`   ID: ${article._id}`)
            console.log(`   カテゴリ: ${article.categories?.join(', ') || 'なし'}`)
            console.log(`   URL: /posts/${article.slug}\n`)
          })
        })
        .catch(console.error)
      break

    case 'add':
      // 特定の記事に出典を追加
      const postId = args[1]
      const apply = args.includes('--apply')

      if (!postId) {
        console.error('❌ 記事IDを指定してください')
        console.log('使い方: node scripts/add-citations.js add <POST_ID> [--apply]')
        process.exit(1)
      }

      addCitationsToArticle(postId, !apply).catch(console.error)
      break

    case 'add-all':
      // 検出されたすべての記事に出典を追加
      const applyAll = args.includes('--apply')

      getArticlesNeedingCitations()
        .then(articles => {
          const postIds = articles.map(a => a._id)
          return addCitationsToMultipleArticles(postIds, !applyAll)
        })
        .catch(console.error)
      break

    case 'add-top':
      // 上位N件に出典を追加
      const count = parseInt(args[1]) || 10
      const applyTop = args.includes('--apply')

      getArticlesNeedingCitations()
        .then(articles => {
          const postIds = articles.slice(0, count).map(a => a._id)
          return addCitationsToMultipleArticles(postIds, !applyTop)
        })
        .catch(console.error)
      break

    default:
      console.log(`
📚 YMYL対策：統計データ出典リンク自動追加ツール

使い方:
  node scripts/add-citations.js <コマンド> [オプション]

コマンド:
  check              出典が必要な記事を一覧表示
  add <POST_ID>      特定の記事に出典を追加（DRY RUN）
  add <POST_ID> --apply  特定の記事を実際に更新
  add-all            すべての記事に出典を追加（DRY RUN）
  add-all --apply    すべての記事を実際に更新
  add-top [数]       上位N件に出典を追加（デフォルト: 10件）（DRY RUN）
  add-top [数] --apply   上位N件を実際に更新

例:
  # 出典が必要な記事を確認
  node scripts/add-citations.js check

  # 上位10件を確認（実際には更新しない）
  node scripts/add-citations.js add-top 10

  # 上位10件を実際に更新
  node scripts/add-citations.js add-top 10 --apply

追加される出典の例:
  - 給与データ → 厚生労働省 令和5年度介護従事者処遇状況等調査
  - 施設統計 → 厚生労働省 医療施設調査
  - 資格教育 → 厚生労働省 看護師等学校養成所調査

注意:
  --apply オプションなしで実行すると DRY RUN モードになります
  DRY RUN では実際には更新せず、追加内容のプレビューのみ表示します
  .env.localからSANITY_API_TOKENを自動読み込みします
      `)
  }
}

module.exports = {
  hasStatsKeyword,
  hasCitation,
  selectCitation,
  createCitationBlock,
  addCitationsToBody,
  getArticlesNeedingCitations,
  addCitationsToArticle,
  addCitationsToMultipleArticles
}
