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

// 記事カテゴリ別の訴求文パターン
const LINK_PATTERNS = {
  '給料': {
    appeal: '💰 給料や待遇について詳しく知りたい方は、こちらの記事もご覧ください',
    keywords: ['給料', '年収', '収入', '待遇', '時給', '月給', 'ボーナス']
  },
  'なるには': {
    appeal: '📝 看護助手になる方法について詳しく知りたい方は、こちらの記事もご覧ください',
    keywords: ['なるには', '始め方', '未経験', '資格取得', '志望動機', '面接']
  },
  '仕事内容': {
    appeal: '💼 看護助手の仕事内容について詳しく知りたい方は、こちらの記事もご覧ください',
    keywords: ['仕事内容', '業務', '役割', '職務', '仕事']
  },
  '1日の流れ': {
    appeal: '⏰ 看護助手の1日の流れについて詳しく知りたい方は、こちらの記事もご覧ください',
    keywords: ['1日', 'スケジュール', '勤務', 'シフト', '流れ']
  },
  '辞めたい': {
    appeal: '💭 看護助手を辞めたい時の対処法について詳しく知りたい方は、こちらの記事もご覧ください',
    keywords: ['辞めたい', '退職', '転職', '辞める']
  },
  'きつい・大変': {
    appeal: '💪 看護助手の大変さや対処法について詳しく知りたい方は、こちらの記事もご覧ください',
    keywords: ['きつい', '大変', 'しんどい', '辛い', 'ストレス']
  },
  '夜勤': {
    appeal: '🌙 看護助手の夜勤について詳しく知りたい方は、こちらの記事もご覧ください',
    keywords: ['夜勤']
  },
  '人間関係': {
    appeal: '🤝 看護助手の人間関係について詳しく知りたい方は、こちらの記事もご覧ください',
    keywords: ['人間関係', '悩み', 'トラブル', 'コミュニケーション']
  },
  '看護師との違い': {
    appeal: '👥 看護師との違いについて詳しく知りたい方は、こちらの記事もご覧ください',
    keywords: ['看護師との違い', '看護師と', '准看護師', '違い', '比較']
  }
}

// 記事の自然な流れを定義
const ARTICLE_FLOW = {
  'なるには': ['仕事内容', '1日の流れ', '給料', '看護師との違い'],
  '仕事内容': ['なるには', '1日の流れ', '給料'],
  '1日の流れ': ['仕事内容', '夜勤', 'きつい・大変'],
  '給料': ['仕事内容', '辞めたい', '看護師との違い'],
  'きつい・大変': ['辞めたい', '人間関係', '1日の流れ'],
  '辞めたい': ['給料', '人間関係', 'なるには'],
  '夜勤': ['1日の流れ', 'きつい・大変', '給料'],
  '人間関係': ['辞めたい', 'きつい・大変'],
  '看護師との違い': ['なるには', '給料', '仕事内容']
}

function categorizeArticle(title) {
  const categories = {
    '仕事内容': ['仕事内容', '業務', '役割', '職務'],
    'なるには': ['なるには', '未経験', '資格', '取得'],
    '給料': ['給料', '年収', '時給', '収入', '待遇'],
    '1日の流れ': ['1日', 'スケジュール', '勤務', 'シフト'],
    '辞めたい': ['辞めたい', '退職', '転職'],
    'きつい・大変': ['きつい', '大変', 'しんどい', '辛い'],
    '夜勤': ['夜勤'],
    '人間関係': ['人間関係', '悩み'],
    '看護師との違い': ['看護師', '違い', '比較'],
    'その他': []
  }

  for (const category in categories) {
    if (categories[category].some(keyword => title.includes(keyword))) {
      return category
    }
  }
  return 'その他'
}

// H2セクションを検出して、そのセクションの内容に関連するリンクを提案
function findSectionLinkOpportunities(body, suggestions) {
  if (!body || !Array.isArray(body)) return []

  const opportunities = []
  let currentSection = null
  let sectionStartIndex = 0
  let sectionBlocks = []

  body.forEach((block, index) => {
    // H2見出しを検出
    if (block.style === 'h2') {
      // 前のセクションを処理
      if (currentSection && sectionBlocks.length > 2) {
        // セクション内容からキーワードを検出
        const sectionText = sectionBlocks
          .filter(b => b._type === 'block' && b.children)
          .map(b => b.children.filter(c => c._type === 'span').map(c => c.text || '').join(''))
          .join(' ')

        // 関連する提案を見つける
        for (const suggestion of suggestions) {
          const pattern = LINK_PATTERNS[suggestion.category]
          if (!pattern) continue

          // セクション内容にキーワードが含まれているか
          const hasKeyword = pattern.keywords.some(keyword => sectionText.includes(keyword))
          
          if (hasKeyword) {
            opportunities.push({
              sectionTitle: currentSection,
              insertAfterIndex: sectionStartIndex + sectionBlocks.length - 1,
              suggestion: suggestion,
              appeal: pattern.appeal
            })
            break // 1セクションに1つまで
          }
        }
      }

      // 新しいセクション開始
      currentSection = block.children?.filter(c => c._type === 'span').map(c => c.text || '').join('') || ''
      sectionStartIndex = index
      sectionBlocks = [block]
    } else {
      sectionBlocks.push(block)
    }
  })

  // 最大2-3個まで
  return opportunities.slice(0, 3)
}

// 訴求付きリンクブロックを作成
function createAppealLinkBlock(appeal, linkText, linkUrl) {
  const linkKey = 'link-' + Math.random().toString(36).substr(2, 9)
  const spanKey = 'span-' + Math.random().toString(36).substr(2, 9)

  return {
    _type: 'block',
    _key: 'block-' + Math.random().toString(36).substr(2, 9),
    style: 'normal',
    markDefs: [
      {
        _key: linkKey,
        _type: 'link',
        href: linkUrl
      }
    ],
    children: [
      {
        _type: 'span',
        _key: spanKey,
        text: appeal + '： ',
        marks: []
      },
      {
        _type: 'span',
        _key: spanKey + '-link',
        text: linkText,
        marks: [linkKey]
      }
    ]
  }
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = !args.includes('--execute')

  const line = '='.repeat(60)
  console.log(line)
  console.log('🔗 セクション末尾リンク挿入ツール')
  console.log(line)
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
  const posts = await client.fetch('*[_type == "post"] { _id, title, "slug": slug.current, body }')
  console.log('📚 総記事数: ' + posts.length + '件\n')

  let totalLinksPlanned = 0
  const plan = []

  for (const post of posts) {
    const suggestion = linkSuggestions.find(s => s._id === post._id)
    if (!suggestion || suggestion.suggestions.length === 0) continue

    const opportunities = findSectionLinkOpportunities(post.body, suggestion.suggestions)
    if (opportunities.length === 0) continue

    plan.push({
      _id: post._id,
      title: post.title,
      slug: post.slug,
      links: opportunities.map(opp => ({
        sectionTitle: opp.sectionTitle,
        insertAfterIndex: opp.insertAfterIndex,
        appeal: opp.appeal,
        linkText: opp.suggestion.title,
        linkUrl: '/posts/' + opp.suggestion.slug,
        category: opp.suggestion.category
      }))
    })

    totalLinksPlanned += opportunities.length
  }

  console.log('🔗 リンク挿入予定数: ' + totalLinksPlanned + '個')
  console.log('📝 リンク挿入予定記事: ' + plan.filter(p => p.links.length > 0).length + '件\n')

  if (dryRun) {
    console.log('💡 レポートを確認してから実行してください:')
    console.log('  node scripts/insert-contextual-links.js --execute')
  } else {
    console.log('🚀 Sanityに反映開始...\n')

    let updatedCount = 0

    for (const item of plan) {
      try {
        const post = posts.find(p => p._id === item._id)
        if (!post) continue

        const newBody = [...post.body]

        // 挿入位置の調整（後ろから挿入してインデックスがずれないように）
        const sortedLinks = [...item.links].sort((a, b) => b.insertAfterIndex - a.insertAfterIndex)

        for (const link of sortedLinks) {
          const linkBlock = createAppealLinkBlock(link.appeal, link.linkText, link.linkUrl)
          newBody.splice(link.insertAfterIndex + 1, 0, linkBlock)
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
