/**
 * 転職サービス推奨セクションを記事に自動追加
 * 「辞めたい」「給料」「きつい」系の記事にのみ自然に配置
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const { jobServices, shouldShowJobService } = require('./affiliate-products-db.js')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

/**
 * 転職サービスセクションを作成
 */
function createJobServiceSection() {
  const service = jobServices[0] // レバウェル看護

  return [
    // セクションタイトル（H2）
    {
      _type: 'block',
      _key: `job-section-title-${Math.random().toString(36).substr(2, 9)}`,
      style: 'h2',
      children: [{
        _type: 'span',
        text: 'より良い職場環境を探している方へ',
        marks: []
      }]
    },
    // 導入文
    {
      _type: 'block',
      _key: `job-intro-${Math.random().toString(36).substr(2, 9)}`,
      style: 'normal',
      children: [{
        _type: 'span',
        text: '現在の職場に悩みを抱えている場合、転職も一つの選択肢です。看護助手の求人に特化した転職サービスを利用することで、より良い待遇の職場を見つけられる可能性があります。',
        marks: []
      }]
    },
    // サービス名（H3）
    {
      _type: 'block',
      _key: `job-service-name-${Math.random().toString(36).substr(2, 9)}`,
      style: 'h3',
      children: [{
        _type: 'span',
        text: service.name,
        marks: []
      }]
    },
    // サービス説明
    {
      _type: 'block',
      _key: `job-benefit-${Math.random().toString(36).substr(2, 9)}`,
      style: 'normal',
      children: [{
        _type: 'span',
        text: service.userBenefit,
        marks: []
      }]
    },
    // 特徴リスト
    {
      _type: 'block',
      _key: `job-feature-label-${Math.random().toString(36).substr(2, 9)}`,
      style: 'normal',
      children: [{
        _type: 'span',
        text: 'このサービスの特徴：',
        marks: ['strong']
      }]
    },
    ...service.features.map((feature, index) => ({
      _type: 'block',
      _key: `job-feature-${index}-${Math.random().toString(36).substr(2, 9)}`,
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      children: [{
        _type: 'span',
        text: feature,
        marks: []
      }]
    })),
    // アフィリエイトリンク
    {
      _type: 'block',
      _key: `job-link-${Math.random().toString(36).substr(2, 9)}`,
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: '詳しく見る',
          marks: [
            {
              _type: 'link',
              _key: `link-job-${Math.random().toString(36).substr(2, 9)}`,
              href: service.affiliateUrl
            }
          ]
        },
        {
          _type: 'span',
          text: ' [PR]',
          marks: []
        }
      ],
      markDefs: [
        {
          _type: 'link',
          _key: `linkdef-job-${Math.random().toString(36).substr(2, 9)}`,
          href: service.affiliateUrl
        }
      ]
    },
    // 補足説明
    {
      _type: 'block',
      _key: `job-note-${Math.random().toString(36).substr(2, 9)}`,
      style: 'normal',
      children: [{
        _type: 'span',
        text: '転職するかどうかは別として、まずは相談だけでも可能です。現在の待遇が適正かどうかを知る良い機会にもなります。',
        marks: []
      }]
    },
    // アフィリエイト免責事項
    {
      _type: 'block',
      _key: `job-disclaimer-${Math.random().toString(36).substr(2, 9)}`,
      style: 'normal',
      children: [{
        _type: 'span',
        text: '※ [PR]表記のリンクはアフィリエイトリンクです。サービス利用時に当サイトに紹介料が入りますが、利用料金は無料です。',
        marks: []
      }]
    }
  ]
}

/**
 * 転職セクションが既に存在するかチェック
 */
function hasJobServiceSection(body) {
  return body.some(block =>
    block._type === 'block' &&
    block.children &&
    block.children.some(child =>
      child.text && (
        child.text.includes('転職') ||
        child.text.includes('レバウェル') ||
        child.text.includes('より良い職場')
      )
    )
  )
}

/**
 * メイン処理
 */
async function main() {
  const args = process.argv.slice(2)
  const dryRun = !args.includes('--execute')

  console.log('=' .repeat(60))
  console.log('💼 転職サービス推奨セクション自動追加ツール')
  console.log('=' .repeat(60))
  console.log()

  if (dryRun) {
    console.log('🔍 [DRY RUN] 実際には更新しません\n')
  }

  // 全記事取得
  const posts = await client.fetch(`*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body
  }`)

  console.log(`📚 総記事数: ${posts.length}件\n`)

  let updated = 0
  let skipped = 0
  let notTarget = 0

  for (const post of posts) {
    // 転職サービスを表示すべき記事か判定
    if (!shouldShowJobService(post.title)) {
      notTarget++
      continue
    }

    // 既に転職セクションがあるかチェック
    if (hasJobServiceSection(post.body)) {
      console.log(`⏭️  スキップ: ${post.title}（既に転職セクション存在）`)
      skipped++
      continue
    }

    // 転職セクション作成
    const jobSection = createJobServiceSection()

    // 記事の最後に追加
    const newBody = [
      ...post.body,
      ...jobSection
    ]

    console.log(`✅ 追加: ${post.title}\n`)

    // 実行モードの場合のみ更新
    if (!dryRun) {
      await client
        .patch(post._id)
        .set({ body: newBody })
        .commit()
    }

    updated++
  }

  console.log('\n' + '=' .repeat(60))
  console.log('📊 実行結果')
  console.log('=' .repeat(60))
  console.log(`✅ 転職セクション追加: ${updated}件`)
  console.log(`⏭️  スキップ: ${skipped}件`)
  console.log(`➖ 対象外記事: ${notTarget}件`)
  console.log()

  if (dryRun) {
    console.log('💡 実際に追加するには: node scripts/add-job-service.js --execute')
  } else {
    console.log('✨ 完了！')
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { createJobServiceSection, shouldShowJobService }
