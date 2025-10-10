/**
 * 記事本文に内部リンクを挿入するスクリプト
 *
 * ルール:
 * - テキストリンクのみ（カードなし）
 * - 1記事あたり2-4個程度
 * - 自然な文脈でリンクを挿入
 * - リンクだらけにならないようバランス調整
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const fs = require('fs')
const path = require('path')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

/**
 * リンク挿入に適したキーワードパターンと自然な表現
 */
const LINK_INSERTION_PATTERNS = {
  '給料': {
    keywords: ['給料', '年収', '収入', '待遇', '時給', '月給'],
    linkTexts: {
      '給料': '給料について詳しくはこちら',
      '年収': '年収について詳しくはこちら',
      '収入': '収入について詳しくはこちら',
      '待遇': '待遇について詳しくはこちら',
      '時給': '時給について詳しくはこちら',
      '月給': '月給について詳しくはこちら'
    }
  },
  'なるには': {
    keywords: ['なるには', '始め方', '未経験', '資格取得'],
    linkTexts: {
      'なるには': '看護助手になる方法はこちら',
      '始め方': '始め方について詳しくはこちら',
      '未経験': '未経験からのスタート方法はこちら',
      '資格取得': '資格取得について詳しくはこちら'
    }
  },
  '仕事内容': {
    keywords: ['仕事内容', '業務', '役割', '職務'],
    linkTexts: {
      '仕事内容': '仕事内容について詳しくはこちら',
      '業務': '業務について詳しくはこちら',
      '役割': '役割について詳しくはこちら',
      '職務': '職務について詳しくはこちら'
    }
  },
  '1日の流れ': {
    keywords: ['1日', 'スケジュール', '勤務時間', 'シフト'],
    linkTexts: {
      '1日': '1日の流れについて詳しくはこちら',
      'スケジュール': 'スケジュールについて詳しくはこちら',
      '勤務時間': '勤務時間について詳しくはこちら',
      'シフト': 'シフトについて詳しくはこちら'
    }
  },
  '辞めたい': {
    keywords: ['辞めたい', '退職', '転職'],
    linkTexts: {
      '辞めたい': '辞めたいと感じた時の対処法はこちら',
      '退職': '退職について詳しくはこちら',
      '転職': '転職について詳しくはこちら'
    }
  },
  'きつい・大変': {
    keywords: ['きつい', '大変', 'しんどい', '辛い'],
    linkTexts: {
      'きつい': 'きつい時の対処法はこちら',
      '大変': '大変な時の乗り越え方はこちら',
      'しんどい': 'しんどい時の対処法はこちら',
      '辛い': '辛い時の対処法はこちら'
    }
  },
  '夜勤': {
    keywords: ['夜勤'],
    linkTexts: {
      '夜勤': '夜勤について詳しくはこちら'
    }
  },
  '人間関係': {
    keywords: ['人間関係', '悩み', 'トラブル'],
    linkTexts: {
      '人間関係': '人間関係について詳しくはこちら',
      '悩み': '悩みの解決方法はこちら',
      'トラブル': 'トラブル対処法はこちら'
    }
  },
  '看護師との違い': {
    keywords: ['看護師との違い', '看護師と', '准看護師'],
    linkTexts: {
      '看護師との違い': '看護師との違いについて詳しくはこちら',
      '看護師と': '看護師との違いについて詳しくはこちら',
      '准看護師': '准看護師との違いについて詳しくはこちら'
    }
  }
}

/**
 * 記事本文から適切な挿入ポイントを検出
 */
function findInsertionPoints(body, suggestions) {
  const insertionPoints = []

  if (!body || !Array.isArray(body)) return insertionPoints

  body.forEach((block, blockIndex) => {
    if (block._type !== 'block' || !block.children) return

    const blockText = block.children
      .filter(child => child._type === 'span')
      .map(child => child.text || '')
      .join('')

    // 各リンク候補について、適切なキーワードがあるかチェック
    suggestions.forEach(suggestion => {
      const patternConfig = LINK_INSERTION_PATTERNS[suggestion.category]
      if (!patternConfig) return

      const { keywords, linkTexts } = patternConfig

      keywords.forEach((keyword, index) => {
        if (blockText.includes(keyword)) {
          // すでにリンクが含まれていないかチェック
          const hasLink = block.children.some(child =>
            child.marks && child.marks.some(mark => typeof mark === 'object' && mark._type === 'link')
          )

          if (!hasLink) {
            insertionPoints.push({
              blockIndex,
              keyword,
              linkText: linkTexts[keyword] || `${keyword}について詳しくはこちら`,
              suggestion,
              blockText: blockText.substring(0, 100) + '...',
              priority: index // 優先度（パターン配列の順序）
            })
          }
        }
      })
    })
  })

  // 優先度でソートし、重複を除去
  return insertionPoints
    .sort((a, b) => a.priority - b.priority)
    .filter((point, index, self) =>
      index === self.findIndex(p =>
        p.blockIndex === point.blockIndex ||
        p.suggestion._id === point.suggestion._id
      )
    )
}

/**
 * ブロックにリンクを挿入
 */
function insertLinkIntoBlock(block, keyword, linkUrl, linkText) {
  if (!block.children) return block

  const newChildren = []
  let linkInserted = false

  block.children.forEach(child => {
    if (linkInserted || child._type !== 'span') {
      newChildren.push(child)
      return
    }

    const text = child.text || ''
    const keywordIndex = text.indexOf(keyword)

    if (keywordIndex === -1) {
      newChildren.push(child)
      return
    }

    // キーワードの前後でテキストを分割
    const beforeText = text.substring(0, keywordIndex)
    const afterText = text.substring(keywordIndex + keyword.length)

    // Before text
    if (beforeText) {
      newChildren.push({
        _type: 'span',
        _key: `${child._key || 'span'}-before-${Math.random().toString(36).substr(2, 9)}`,
        text: beforeText,
        marks: child.marks || []
      })
    }

    // Link
    const linkKey = `link-${Math.random().toString(36).substr(2, 9)}`
    newChildren.push({
      _type: 'span',
      _key: `${child._key || 'span'}-link-${Math.random().toString(36).substr(2, 9)}`,
      text: linkText,
      marks: [
        ...(child.marks || []),
        linkKey
      ]
    })

    // After text
    if (afterText) {
      newChildren.push({
        _type: 'span',
        _key: `${child._key || 'span'}-after-${Math.random().toString(36).substr(2, 9)}`,
        text: afterText,
        marks: child.marks || []
      })
    }

    // markDefs に link を追加
    if (!block.markDefs) {
      block.markDefs = []
    }
    block.markDefs.push({
      _key: linkKey,
      _type: 'link',
      href: linkUrl
    })

    linkInserted = true
  })

  return {
    ...block,
    children: newChildren
  }
}

/**
 * レビュー用のレポート生成
 */
function generateReviewReport(linkPlan) {
  const report = []

  report.push('# 内部リンク挿入プラン')
  report.push('')
  report.push(`総記事数: ${linkPlan.length}件`)
  report.push(`リンク挿入予定記事: ${linkPlan.filter(p => p.links.length > 0).length}件`)
  report.push('')
  report.push('---')
  report.push('')

  linkPlan.forEach((plan, index) => {
    if (plan.links.length === 0) return

    report.push(`## ${index + 1}. ${plan.title}`)
    report.push('')
    report.push(`**カテゴリ**: ${plan.category}`)
    report.push(`**挿入予定リンク数**: ${plan.links.length}個`)
    report.push('')

    plan.links.forEach((link, i) => {
      report.push(`### リンク ${i + 1}`)
      report.push(`- **リンク先**: ${link.targetTitle}`)
      report.push(`- **キーワード**: "${link.keyword}"`)
      report.push(`- **挿入箇所**: ${link.context}`)
      report.push(`- **理由**: ${link.reason}`)
      report.push('')
    })

    report.push('---')
    report.push('')
  })

  return report.join('\n')
}

/**
 * メイン処理
 */
async function main() {
  const args = process.argv.slice(2)
  const dryRun = !args.includes('--execute')

  console.log('=' .repeat(60))
  console.log('🔗 内部リンク挿入ツール')
  console.log('=' .repeat(60))
  console.log()

  if (dryRun) {
    console.log('🔍 [DRY RUN] レビュー用レポートを生成します\n')
  }

  // リンク提案を読み込み
  const suggestionsFile = path.resolve(__dirname, '../internal-links-analysis/link-suggestions.json')
  if (!fs.existsSync(suggestionsFile)) {
    console.error('❌ link-suggestions.json が見つかりません')
    console.error('   先に analyze-articles.js を実行してください')
    return
  }

  const linkSuggestions = JSON.parse(fs.readFileSync(suggestionsFile, 'utf8'))

  // 全記事取得
  const posts = await client.fetch(`*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body
  }`)

  console.log(`📚 総記事数: ${posts.length}件\n`)

  const linkPlan = []
  let totalLinksPlanned = 0

  // 各記事についてリンク挿入プランを作成
  for (const post of posts) {
    const suggestion = linkSuggestions.find(s => s._id === post._id)
    if (!suggestion || suggestion.suggestions.length === 0) {
      linkPlan.push({
        _id: post._id,
        title: post.title,
        slug: post.slug,
        category: suggestion?.category || 'その他',
        links: []
      })
      continue
    }

    // 挿入ポイントを検出
    const insertionPoints = findInsertionPoints(post.body, suggestion.suggestions)

    // バランスを考慮して最大3個まで
    const selectedPoints = insertionPoints.slice(0, 3)

    const plan = {
      _id: post._id,
      title: post.title,
      slug: post.slug,
      category: suggestion.category,
      links: selectedPoints.map(point => ({
        blockIndex: point.blockIndex,
        keyword: point.keyword,
        linkText: point.linkText,
        targetTitle: point.suggestion.title,
        targetSlug: point.suggestion.slug,
        targetCategory: point.suggestion.category,
        context: point.blockText,
        reason: point.suggestion.reason
      }))
    }

    linkPlan.push(plan)
    totalLinksPlanned += selectedPoints.length
  }

  console.log(`🔗 リンク挿入予定数: ${totalLinksPlanned}個`)
  console.log(`📝 リンク挿入予定記事: ${linkPlan.filter(p => p.links.length > 0).length}件\n`)

  // レビュー用レポート生成
  const report = generateReviewReport(linkPlan)
  const reportFile = path.resolve(__dirname, '../internal-links-analysis/link-insertion-plan.md')
  fs.writeFileSync(reportFile, report)

  console.log(`📄 レビュー用レポート: ${reportFile}`)
  console.log()

  if (dryRun) {
    console.log('💡 レポートを確認してから実行してください:')
    console.log('  node scripts/insert-internal-links.js --execute')
  } else {
    // 本番実行: Sanityに反映
    console.log('🚀 Sanityに反映開始...\n')

    let updatedCount = 0
    let errorCount = 0

    for (const plan of linkPlan) {
      if (plan.links.length === 0) continue

      try {
        // 記事を取得
        const post = posts.find(p => p._id === plan._id)
        if (!post) {
          console.error(`❌ 記事が見つかりません: ${plan.title}`)
          errorCount++
          continue
        }

        let newBody = [...post.body]

        // 各リンクを挿入（逆順で処理してインデックスのズレを防ぐ）
        const sortedLinks = [...plan.links].sort((a, b) => b.blockIndex - a.blockIndex)

        for (const link of sortedLinks) {
          const block = newBody[link.blockIndex]
          if (!block) continue

          const linkUrl = `/posts/${link.targetSlug}`
          const updatedBlock = insertLinkIntoBlock(
            block,
            link.keyword,
            linkUrl,
            link.linkText
          )
          newBody[link.blockIndex] = updatedBlock
        }

        // Sanityに更新
        await client
          .patch(plan._id)
          .set({ body: newBody })
          .commit()

        console.log(`✅ ${plan.title} (${plan.links.length}個のリンク追加)`)
        updatedCount++

      } catch (error) {
        console.error(`❌ エラー: ${plan.title}`)
        console.error(`   ${error.message}`)
        errorCount++
      }
    }

    console.log()
    console.log('=' .repeat(60))
    console.log('📊 実行結果')
    console.log('=' .repeat(60))
    console.log(`✅ 成功: ${updatedCount}件`)
    console.log(`❌ エラー: ${errorCount}件`)
    console.log(`🔗 追加されたリンク総数: ${totalLinksPlanned}個`)
    console.log()
    console.log('✨ 完了！')
  }
  console.log()
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { findInsertionPoints, insertLinkIntoBlock }
