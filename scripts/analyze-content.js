/**
 * 記事内容分析・タグ生成ツール
 *
 * 記事本文を分析し、適切なタグを自動生成します。
 * - 頻出キーワードの抽出
 * - カテゴリとの整合性確認
 * - SEO最適化のための推奨タグ提示
 */

const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

// 看護助手関連の基本キーワード辞書
const NURSING_KEYWORDS = {
  業務: ['業務内容', '仕事内容', '介護', '看護', '医療', 'サポート', '補助', '患者', 'ケア'],
  資格: ['資格', '免許', '試験', '取得', '勉強', '講習', '認定'],
  転職: ['転職', '求人', '就職', '採用', '面接', '履歴書', '職務経歴書'],
  給与: ['給料', '給与', '年収', '月収', '手取り', '昇給', '賞与', 'ボーナス', '待遇'],
  職場: ['病院', 'クリニック', '施設', '介護施設', '老人ホーム', '診療所', '医療機関'],
  スキル: ['スキル', '能力', '経験', 'コミュニケーション', '技術', 'ノウハウ'],
  キャリア: ['キャリア', 'キャリアアップ', '昇進', '成長', 'ステップアップ'],
  勤務: ['勤務', 'シフト', '夜勤', '日勤', '残業', '休日', '有給']
}

// 除外する一般的すぎる単語
const STOP_WORDS = [
  'こと', 'もの', 'ため', 'など', 'よう', 'とき', 'ところ', 'ほう',
  'あり', 'なし', 'です', 'ます', 'ある', 'する', 'なる', 'できる',
  'いる', 'られる', 'される', 'として', 'について', 'において'
]

/**
 * 記事本文からテキストを抽出
 */
function extractTextFromBody(body) {
  if (!body || !Array.isArray(body)) return ''

  let text = ''

  body.forEach(block => {
    if (block._type === 'block' && block.children) {
      block.children.forEach(child => {
        if (child.text) {
          text += child.text + ' '
        }
      })
    }
  })

  return text
}

/**
 * テキストから候補キーワードを抽出
 */
function extractKeywords(text, title, categories) {
  const allText = `${title} ${text}`
  const words = {}

  // カテゴリから推奨キーワードを追加
  const categoryKeywords = new Set()
  if (categories && categories.length > 0) {
    categories.forEach(cat => {
      if (cat) categoryKeywords.add(cat)
    })
  }

  // 看護助手関連キーワードの出現をチェック
  Object.values(NURSING_KEYWORDS).flat().forEach(keyword => {
    const count = (allText.match(new RegExp(keyword, 'g')) || []).length
    if (count > 0) {
      words[keyword] = (words[keyword] || 0) + count * 2 // 重み付け
    }
  })

  // 2文字以上の単語を抽出（カタカナ・漢字）
  const matches = allText.match(/[ァ-ヶー一-龠々]+/g) || []
  matches.forEach(word => {
    if (word.length >= 2 && !STOP_WORDS.includes(word)) {
      words[word] = (words[word] || 0) + 1
    }
  })

  // 頻度でソート
  const sorted = Object.entries(words)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)

  // カテゴリを最優先、その後頻出キーワード
  const tags = [...categoryKeywords, ...sorted.filter(w => !categoryKeywords.has(w))]

  return tags.slice(0, 15) // 最大15個
}

/**
 * タグの品質をチェック
 */
function validateTags(tags, title, categories) {
  const issues = []
  const recommendations = []

  // タグ数のチェック
  if (!tags || tags.length === 0) {
    issues.push('タグが設定されていません')
    recommendations.push('記事内容に基づいたタグを10個程度追加してください')
  } else if (tags.length < 5) {
    issues.push(`タグが少なすぎます（現在${tags.length}個）`)
    recommendations.push('SEO効果向上のため、最低5個以上のタグを設定してください')
  } else if (tags.length > 15) {
    issues.push(`タグが多すぎます（現在${tags.length}個）`)
    recommendations.push('タグは10個程度が最適です。重要度の低いタグを削除してください')
  }

  // カテゴリとの整合性チェック
  if (categories && categories.length > 0) {
    const hasCategory = categories.some(cat => tags && tags.includes(cat))
    if (!hasCategory) {
      issues.push('カテゴリがタグに含まれていません')
      recommendations.push(`カテゴリ「${categories.join(', ')}」をタグに追加してください`)
    }
  }

  // 「看護助手」が含まれているかチェック
  if (tags && !tags.some(tag => tag.includes('看護助手'))) {
    recommendations.push('基本キーワード「看護助手」を含めることを推奨します')
  }

  return { issues, recommendations }
}

/**
 * 記事を分析してタグを提案
 */
async function analyzePost(postId) {
  try {
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
      return null
    }

    console.log(`\n📝 記事: ${post.title}`)
    console.log(`📁 カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
    console.log(`🏷️  現在のタグ: ${post.tags?.join(', ') || 'なし'}\n`)

    // 本文からテキスト抽出
    const text = extractTextFromBody(post.body)
    console.log(`📊 本文文字数: ${text.length}文字\n`)

    // キーワード抽出
    const suggestedTags = extractKeywords(text, post.title, post.categories)

    // タグ品質チェック
    const validation = validateTags(post.tags, post.title, post.categories)

    console.log('💡 推奨タグ（優先度順）:')
    suggestedTags.slice(0, 10).forEach((tag, i) => {
      const isCurrent = post.tags?.includes(tag)
      console.log(`  ${i + 1}. ${tag} ${isCurrent ? '✓' : ''}`)
    })

    if (validation.issues.length > 0) {
      console.log('\n⚠️  問題点:')
      validation.issues.forEach(issue => console.log(`  - ${issue}`))
    }

    if (validation.recommendations.length > 0) {
      console.log('\n📌 改善提案:')
      validation.recommendations.forEach(rec => console.log(`  - ${rec}`))
    }

    return {
      postId: post._id,
      title: post.title,
      currentTags: post.tags || [],
      suggestedTags: suggestedTags.slice(0, 10),
      validation
    }

  } catch (error) {
    console.error('❌ エラー:', error.message)
    return null
  }
}

/**
 * 全記事を分析
 */
async function analyzeAllPosts(limit = 10) {
  try {
    console.log(`\n🔍 記事分析を開始（最大${limit}件）\n`)

    const posts = await client.fetch(
      `*[_type == "post"] | order(publishedAt desc) [0...${limit}] {
        _id,
        title,
        tags,
        "categories": categories[]->title
      }`
    )

    console.log(`📚 対象記事数: ${posts.length}件\n`)

    const stats = {
      total: posts.length,
      noTags: 0,
      fewTags: 0,
      manyTags: 0,
      optimal: 0
    }

    const needsImprovement = []

    for (const post of posts) {
      const tagCount = post.tags?.length || 0

      if (tagCount === 0) {
        stats.noTags++
        needsImprovement.push({ ...post, issue: 'タグなし' })
      } else if (tagCount < 5) {
        stats.fewTags++
        needsImprovement.push({ ...post, issue: `タグ不足（${tagCount}個）` })
      } else if (tagCount > 15) {
        stats.manyTags++
        needsImprovement.push({ ...post, issue: `タグ過多（${tagCount}個）` })
      } else {
        stats.optimal++
      }
    }

    console.log('📊 タグ設定状況:')
    console.log(`  ✅ 最適（5〜15個）: ${stats.optimal}件`)
    console.log(`  ⚠️  タグなし: ${stats.noTags}件`)
    console.log(`  ⚠️  タグ不足（<5個）: ${stats.fewTags}件`)
    console.log(`  ⚠️  タグ過多（>15個）: ${stats.manyTags}件`)

    if (needsImprovement.length > 0) {
      console.log(`\n🔧 改善が必要な記事（${needsImprovement.length}件）:\n`)
      needsImprovement.slice(0, 10).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   問題: ${post.issue}`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}\n`)
      })
    }

    return { stats, needsImprovement }

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
📝 ProReNata タグ分析ツール

使い方:
  node scripts/analyze-content.js <記事ID>    # 特定記事を分析
  node scripts/analyze-content.js --all        # 全記事の統計を表示
  node scripts/analyze-content.js --all 20     # 最新20件の統計を表示

環境変数:
  SANITY_API_TOKEN が必要です
    `)
    process.exit(1)
  }

  if (args[0] === '--all') {
    const limit = parseInt(args[1]) || 10
    analyzeAllPosts(limit).catch(console.error)
  } else {
    analyzePost(args[0]).catch(console.error)
  }
}

module.exports = {
  extractTextFromBody,
  extractKeywords,
  validateTags,
  analyzePost,
  analyzeAllPosts
}
