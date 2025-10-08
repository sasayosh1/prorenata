/**
 * コンテンツ拡充支援ツール
 *
 * 文字数不足の記事を検出し、拡充のための提案を生成します
 * - 文字数カウント
 * - 不足している見出し構造の提案
 * - 追加すべきコンテンツのアイデア
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
 * Portable Text形式のbodyからテキストと見出しを抽出
 */
function analyzeBody(body) {
  if (!body || !Array.isArray(body)) {
    return {
      charCount: 0,
      headings: [],
      paragraphs: 0,
      lists: 0,
      images: 0
    }
  }

  let charCount = 0
  const headings = []
  let paragraphs = 0
  let lists = 0
  let images = 0

  body.forEach(block => {
    if (block._type === 'block') {
      if (block.style && block.style.startsWith('h')) {
        // 見出し
        const text = block.children?.map(c => c.text).join('') || ''
        headings.push({
          level: block.style,
          text: text
        })
        charCount += text.length
      } else if (block.style === 'normal') {
        // 通常段落
        const text = block.children?.map(c => c.text).join('') || ''
        if (text.trim().length > 0) {
          paragraphs++
          charCount += text.length
        }
      }

      // リストマーカー
      if (block.listItem) {
        lists++
      }
    } else if (block._type === 'image') {
      images++
    }
  })

  return {
    charCount,
    headings,
    paragraphs,
    lists,
    images
  }
}

/**
 * コンテンツ拡充の提案を生成
 */
function generateExpansionSuggestions(analysis, title, categories, targetChars = 1500) {
  const suggestions = []
  const deficit = targetChars - analysis.charCount

  // 文字数不足
  if (deficit > 0) {
    suggestions.push({
      type: 'length',
      priority: 'high',
      message: `文字数が${deficit}文字不足しています（現在${analysis.charCount}文字 / 目標${targetChars}文字）`
    })
  }

  // 見出し構造
  const h2Count = analysis.headings.filter(h => h.level === 'h2').length
  const h3Count = analysis.headings.filter(h => h.level === 'h3').length

  if (h2Count < 3) {
    suggestions.push({
      type: 'structure',
      priority: 'high',
      message: `H2見出しが少なすぎます（現在${h2Count}個 / 推奨3-5個）`,
      action: 'トピックを細分化し、H2見出しを追加してください'
    })
  }

  if (h2Count > 0 && h3Count === 0) {
    suggestions.push({
      type: 'structure',
      priority: 'medium',
      message: 'H3見出しがありません',
      action: '各H2セクション内で詳細トピックをH3で区切ってください'
    })
  }

  // 段落数
  if (analysis.paragraphs < 5) {
    suggestions.push({
      type: 'content',
      priority: 'high',
      message: `段落が少なすぎます（現在${analysis.paragraphs}段落）`,
      action: '具体例、体験談、データなどを追加してください'
    })
  }

  // 画像
  if (analysis.images === 0) {
    suggestions.push({
      type: 'media',
      priority: 'low',
      message: '画像がありません',
      action: 'メイン画像を設定してください（本文画像は後回しでOK）'
    })
  }

  // カテゴリ別の追加提案
  const category = categories?.[0] || ''

  if (category.includes('基礎知識') || category.includes('入門')) {
    suggestions.push({
      type: 'topic',
      priority: 'medium',
      message: '基礎知識記事に追加すべき内容',
      ideas: [
        '用語の定義を詳しく',
        '初心者によくある誤解の解説',
        '具体的な数字やデータ',
        'よくある質問（FAQ）セクション'
      ]
    })
  }

  if (category.includes('給料') || category.includes('年収')) {
    suggestions.push({
      type: 'topic',
      priority: 'medium',
      message: '給料・年収記事に追加すべき内容',
      ideas: [
        '地域別の給料比較表',
        '経験年数別の給料推移',
        '手当の詳細（夜勤手当、資格手当など）',
        '給料アップのための具体的方法'
      ]
    })
  }

  if (category.includes('転職') || category.includes('求人')) {
    suggestions.push({
      type: 'topic',
      priority: 'medium',
      message: '転職・求人記事に追加すべき内容',
      ideas: [
        '成功事例・失敗事例',
        '転職タイミングの判断基準',
        '転職エージェント活用法',
        '履歴書・職務経歴書の書き方'
      ]
    })
  }

  if (category.includes('悩み') || category.includes('ストレス')) {
    suggestions.push({
      type: 'topic',
      priority: 'medium',
      message: '悩み・ストレス記事に追加すべき内容',
      ideas: [
        '具体的な体験談',
        '解決策の手順を詳しく',
        '専門家のアドバイス',
        'チェックリスト形式の診断'
      ]
    })
  }

  return suggestions
}

/**
 * 1件の記事を分析
 */
async function analyzePost(postId) {
  try {
    const post = await client.fetch(
      `*[_type == "post" && _id == $postId][0] {
        _id,
        title,
        "slug": slug.current,
        body,
        "categories": categories[]->title
      }`,
      { postId }
    )

    if (!post) {
      console.log(`❌ 記事が見つかりません: ${postId}`)
      return null
    }

    const analysis = analyzeBody(post.body)
    const suggestions = generateExpansionSuggestions(analysis, post.title, post.categories)

    console.log(`\n${'='.repeat(70)}`)
    console.log(`📄 ${post.title}`)
    console.log(`   URL: /posts/${post.slug}`)
    console.log(`${'='.repeat(70)}`)
    console.log(`\n📊 現状分析:`)
    console.log(`   文字数: ${analysis.charCount}文字`)
    console.log(`   段落数: ${analysis.paragraphs}段落`)
    console.log(`   見出し: H2×${analysis.headings.filter(h => h.level === 'h2').length}, H3×${analysis.headings.filter(h => h.level === 'h3').length}`)
    console.log(`   画像: ${analysis.images}枚`)

    if (analysis.headings.length > 0) {
      console.log(`\n📝 現在の見出し構造:`)
      analysis.headings.forEach(h => {
        const indent = h.level === 'h2' ? '  ' : '    '
        console.log(`${indent}${h.level.toUpperCase()}: ${h.text}`)
      })
    }

    if (suggestions.length > 0) {
      console.log(`\n💡 改善提案:`)
      suggestions.forEach((s, i) => {
        const priority = s.priority === 'high' ? '🔴' : s.priority === 'medium' ? '🟡' : '⚪'
        console.log(`\n${i + 1}. ${priority} [${s.type}] ${s.message}`)
        if (s.action) {
          console.log(`   → ${s.action}`)
        }
        if (s.ideas) {
          console.log(`   推奨追加内容:`)
          s.ideas.forEach(idea => console.log(`     • ${idea}`))
        }
      })
    }

    return { post, analysis, suggestions }

  } catch (error) {
    console.error(`❌ エラー (${postId}):`, error.message)
    return null
  }
}

/**
 * 短い記事を一括分析
 */
async function analyzeShortPosts(minChars = 1500, limit = null) {
  console.log(`\n🔍 文字数不足の記事を検索中（${minChars}文字未満）...\n`)

  const query = `*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body,
    "categories": categories[]->title
  }`

  const posts = await client.fetch(query)
  const shortPosts = []

  // 文字数を計算してフィルタリング
  posts.forEach(post => {
    const analysis = analyzeBody(post.body)
    if (analysis.charCount < minChars) {
      shortPosts.push({
        ...post,
        charCount: analysis.charCount,
        deficit: minChars - analysis.charCount
      })
    }
  })

  // 文字数の少ない順にソート
  shortPosts.sort((a, b) => a.charCount - b.charCount)

  const targetPosts = limit ? shortPosts.slice(0, limit) : shortPosts

  console.log(`📊 対象記事: ${shortPosts.length}件`)
  if (limit) {
    console.log(`   表示: ${targetPosts.length}件（文字数の少ない順）\n`)
  }

  console.log(`\n📋 文字数不足記事リスト:`)
  console.log(`${'='.repeat(70)}`)

  targetPosts.forEach((post, i) => {
    console.log(`\n${i + 1}. ${post.title}`)
    console.log(`   現在: ${post.charCount}文字 / 不足: ${post.deficit}文字`)
    console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
    console.log(`   URL: /posts/${post.slug}`)
  })

  console.log(`\n${'='.repeat(70)}`)
  console.log(`\n💡 次のステップ:`)
  console.log(`   個別の詳細分析を実行:`)
  console.log(`   node scripts/expand-content.js analyze <記事ID>\n`)

  return shortPosts
}

// CLI実行
if (require.main === module) {
  const args = process.argv.slice(2)
  const command = args[0]

  switch (command) {
    case 'analyze':
      const postId = args[1]
      if (!postId) {
        console.log('❌ 記事IDを指定してください')
        process.exit(1)
      }
      analyzePost(postId).catch(console.error)
      break

    case 'list':
      const minChars = args.includes('--min')
        ? parseInt(args[args.indexOf('--min') + 1])
        : 1500
      const limit = args.includes('--limit')
        ? parseInt(args[args.indexOf('--limit') + 1])
        : null

      analyzeShortPosts(minChars, limit).catch(console.error)
      break

    default:
      console.log(`
📝 ProReNata コンテンツ拡充支援ツール

使い方:
  node scripts/expand-content.js <コマンド> [オプション]

コマンド:
  list                文字数不足の記事一覧を表示
  analyze <記事ID>    1件の記事を詳細分析し、改善提案を生成

オプション（listコマンド）:
  --min <文字数>      最低文字数の基準（デフォルト: 1500）
  --limit <数>        表示件数を制限

例:
  # 1500文字未満の記事を全て表示
  node scripts/expand-content.js list

  # 2000文字未満の記事を10件まで表示
  node scripts/expand-content.js list --min 2000 --limit 10

  # 特定記事の詳細分析
  node scripts/expand-content.js analyze <記事ID>

環境変数:
  SANITY_API_TOKEN が必要です
      `)
  }
}

module.exports = {
  analyzeBody,
  generateExpansionSuggestions,
  analyzePost,
  analyzeShortPosts
}
