/**
 * YMYL対策：医療行為の制限を明記
 *
 * 看護助手が「できないこと」を明確に記載するセクションを追加
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

// 医療行為の注意キーワード（メンテナンスツールと同じ）
const MEDICAL_KEYWORDS = [
  '注射',
  '採血',
  '点滴',
  '投薬',
  '診断',
  '処方',
  '医療行為',
  '治療'
]

/**
 * 「看護助手ができないこと」セクションのテンプレート
 */
function createMedicalRestrictionsSection() {
  const randomKey1 = Math.random().toString(36).substring(2, 15)
  const randomKey2 = Math.random().toString(36).substring(2, 15)
  const randomKey3 = Math.random().toString(36).substring(2, 15)
  const randomKey4 = Math.random().toString(36).substring(2, 15)
  const randomKey5 = Math.random().toString(36).substring(2, 15)

  return [
    // H2見出し
    {
      _type: 'block',
      _key: randomKey1,
      style: 'h2',
      children: [
        {
          _type: 'span',
          _key: Math.random().toString(36).substring(2, 15),
          text: '看護助手ができないこと（重要）',
          marks: []
        }
      ],
      markDefs: []
    },
    // 導入文
    {
      _type: 'block',
      _key: randomKey2,
      style: 'normal',
      children: [
        {
          _type: 'span',
          _key: Math.random().toString(36).substring(2, 15),
          text: '看護助手は医療現場で重要な役割を担っていますが、医療行為を行うことはできません。患者さんの安全を守るため、以下の行為は法律で禁止されています。',
          marks: []
        }
      ],
      markDefs: []
    },
    // 禁止事項リスト
    {
      _type: 'block',
      _key: randomKey3,
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          _key: Math.random().toString(36).substring(2, 15),
          text: '注射・点滴・採血などの医療処置',
          marks: []
        }
      ],
      markDefs: []
    },
    {
      _type: 'block',
      _key: Math.random().toString(36).substring(2, 15),
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          _key: Math.random().toString(36).substring(2, 15),
          text: '薬の投与や管理',
          marks: []
        }
      ],
      markDefs: []
    },
    {
      _type: 'block',
      _key: Math.random().toString(36).substring(2, 15),
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          _key: Math.random().toString(36).substring(2, 15),
          text: '傷の処置や医療器具の操作',
          marks: []
        }
      ],
      markDefs: []
    },
    {
      _type: 'block',
      _key: Math.random().toString(36).substring(2, 15),
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          _key: Math.random().toString(36).substring(2, 15),
          text: '診療の補助行為全般',
          marks: []
        }
      ],
      markDefs: []
    },
    // 補足説明
    {
      _type: 'block',
      _key: randomKey4,
      style: 'normal',
      children: [
        {
          _type: 'span',
          _key: Math.random().toString(36).substring(2, 15),
          text: 'これらの医療行為は、看護師または医師の資格が必要です。看護助手の業務範囲を正しく理解し、チーム医療の一員として適切に役割を果たすことが重要です。',
          marks: []
        }
      ],
      markDefs: []
    }
  ]
}

/**
 * 記事に「できないこと」セクションが既にあるかチェック
 */
function hasRestrictionsSection(body) {
  return body.some(block => {
    if (block._type === 'block' && block.children) {
      const text = block.children.map(c => c.text || '').join('')
      return text.includes('できないこと') ||
             text.includes('禁止') ||
             (text.includes('注意') && text.includes('医療行為'))
    }
    return false
  })
}

/**
 * 記事に医療行為の記述があるかチェック
 */
function hasMedicalContent(body) {
  const bodyText = body
    .filter(block => block._type === 'block' && block.children)
    .map(block => block.children.map(child => child.text || '').join(''))
    .join('\n')

  return MEDICAL_KEYWORDS.some(keyword => bodyText.includes(keyword))
}

/**
 * 「まとめ」セクションの直前に挿入位置を見つける
 */
function findInsertPosition(body) {
  // 「まとめ」「次のステップ」の直前を探す
  for (let i = body.length - 1; i >= 0; i--) {
    const block = body[i]
    if (block._type === 'block' && block.style?.startsWith('h') && block.children) {
      const text = block.children.map(c => c.text || '').join('')
      if (text.includes('まとめ') || text.includes('次のステップ')) {
        return i
      }
    }
  }
  // 見つからない場合は最後から2番目（最後のまとめ段落の前）
  return Math.max(0, body.length - 2)
}

/**
 * 記事に医療行為の制限セクションを追加
 */
function addMedicalRestrictions(body) {
  if (!body || !Array.isArray(body)) return { body, added: false }

  // 既にセクションがある場合はスキップ
  if (hasRestrictionsSection(body)) {
    return { body, added: false, reason: '既に制限セクションあり' }
  }

  // 医療行為の記述がない場合はスキップ
  if (!hasMedicalContent(body)) {
    return { body, added: false, reason: '医療行為の記述なし' }
  }

  const insertPosition = findInsertPosition(body)
  const restrictionsSection = createMedicalRestrictionsSection()

  const modifiedBody = [
    ...body.slice(0, insertPosition),
    ...restrictionsSection,
    ...body.slice(insertPosition)
  ]

  return {
    body: modifiedBody,
    added: true,
    insertPosition
  }
}

/**
 * 医療行為の記述がある記事を取得
 */
async function getArticlesWithMedicalContent() {
  const query = `*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body,
    "categories": categories[]->title
  }`

  const posts = await client.fetch(query)
  const articlesNeedingRestrictions = []

  posts.forEach(post => {
    if (!post.body || !Array.isArray(post.body)) return

    if (hasMedicalContent(post.body) && !hasRestrictionsSection(post.body)) {
      articlesNeedingRestrictions.push(post)
    }
  })

  return articlesNeedingRestrictions
}

/**
 * 記事を修正して更新
 */
async function addRestrictionsToArticle(postId, dryRun = true) {
  const query = `*[_id == $postId][0]{_id, title, body, "categories": categories[]->title}`
  const post = await client.fetch(query, { postId })

  if (!post || !post.body) {
    console.log(`⚠️  記事 ${postId} が見つからないか、本文がありません`)
    return null
  }

  const result = addMedicalRestrictions(post.body)

  if (!result.added) {
    console.log(`✅ 記事「${post.title}」: ${result.reason || 'スキップ'}`)
    return null
  }

  console.log(`\n📝 記事「${post.title}」`)
  console.log(`   ID: ${postId}`)
  console.log(`   追加位置: ブロック${result.insertPosition}番目の前`)

  if (dryRun) {
    console.log(`   ⚠️  DRY RUN: 実際には更新されていません`)
    return { postId, added: true, dryRun: true }
  }

  // 実際に更新
  await client
    .patch(postId)
    .set({ body: result.body })
    .commit()

  console.log(`   ✅ 更新完了`)

  return { postId, added: true, updated: true }
}

/**
 * 複数記事を一括処理
 */
async function addRestrictionsToMultipleArticles(postIds, dryRun = true) {
  console.log(`\n🚀 医療行為の制限セクション追加を開始します`)
  console.log(`   対象記事: ${postIds.length}件`)
  console.log(`   モード: ${dryRun ? 'DRY RUN（確認のみ）' : '実際に更新'}`)
  console.log('='.repeat(60))

  const results = []

  for (const postId of postIds) {
    const result = await addRestrictionsToArticle(postId, dryRun)
    if (result) {
      results.push(result)
    }
    console.log('='.repeat(60))
  }

  // サマリー
  console.log(`\n📊 追加サマリー\n`)
  console.log(`   処理した記事: ${postIds.length}件`)
  console.log(`   セクションを追加した記事: ${results.length}件`)

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
      // 医療行為の記述がある記事を一覧表示
      getArticlesWithMedicalContent()
        .then(articles => {
          console.log(`\n🔍 医療行為の制限セクションが必要な記事: ${articles.length}件\n`)
          articles.slice(0, 20).forEach((article, i) => {
            console.log(`${i + 1}. ${article.title}`)
            console.log(`   ID: ${article._id}`)
            console.log(`   カテゴリ: ${article.categories?.join(', ') || 'なし'}`)
            console.log(`   URL: /posts/${article.slug}\n`)
          })
          if (articles.length > 20) {
            console.log(`   ... 他${articles.length - 20}件\n`)
          }
        })
        .catch(console.error)
      break

    case 'add':
      // 特定の記事にセクションを追加
      const postId = args[1]
      const apply = args.includes('--apply')

      if (!postId) {
        console.error('❌ 記事IDを指定してください')
        console.log('使い方: node scripts/add-medical-restrictions.js add <POST_ID> [--apply]')
        process.exit(1)
      }

      addRestrictionsToArticle(postId, !apply).catch(console.error)
      break

    case 'add-all':
      // 検出されたすべての記事にセクションを追加
      const applyAll = args.includes('--apply')

      getArticlesWithMedicalContent()
        .then(articles => {
          const postIds = articles.map(a => a._id)
          return addRestrictionsToMultipleArticles(postIds, !applyAll)
        })
        .catch(console.error)
      break

    case 'add-top':
      // 上位N件にセクションを追加
      const count = parseInt(args[1]) || 10
      const applyTop = args.includes('--apply')

      getArticlesWithMedicalContent()
        .then(articles => {
          const postIds = articles.slice(0, count).map(a => a._id)
          return addRestrictionsToMultipleArticles(postIds, !applyTop)
        })
        .catch(console.error)
      break

    default:
      console.log(`
🏥 YMYL対策：医療行為の制限セクション自動追加ツール

使い方:
  node scripts/add-medical-restrictions.js <コマンド> [オプション]

コマンド:
  check              医療行為の記述がある記事を一覧表示
  add <POST_ID>      特定の記事にセクションを追加（DRY RUN）
  add <POST_ID> --apply  特定の記事を実際に更新
  add-all            すべての記事にセクションを追加（DRY RUN）
  add-all --apply    すべての記事を実際に更新
  add-top [数]       上位N件にセクションを追加（デフォルト: 10件）（DRY RUN）
  add-top [数] --apply   上位N件を実際に更新

追加されるセクション:
  H2: 看護助手ができないこと（重要）
  - 注射・点滴・採血などの医療処置
  - 薬の投与や管理
  - 傷の処置や医療器具の操作
  - 診療の補助行為全般

注意:
  --apply オプションなしで実行すると DRY RUN モードになります
  DRY RUN では実際には更新せず、追加内容のプレビューのみ表示します
  .env.localからSANITY_API_TOKENを自動読み込みします
      `)
  }
}

module.exports = {
  createMedicalRestrictionsSection,
  hasRestrictionsSection,
  hasMedicalContent,
  addMedicalRestrictions,
  getArticlesWithMedicalContent,
  addRestrictionsToArticle,
  addRestrictionsToMultipleArticles
}
