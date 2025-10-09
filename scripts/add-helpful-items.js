/**
 * 実用的なアイテムリストを記事に自動追加
 * ユーザーにとって本当に役立つ情報 + 自然なアフィリエイト配置
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const {
  affiliateProducts,
  articleToProductMapping,
  determineProductCategory
} = require('./affiliate-products-db.js')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

/**
 * 商品情報をPortable Text形式に変換
 */
function createProductBlock(product) {
  return [
    // 商品名（H3見出し）
    {
      _type: 'block',
      _key: `product-title-${Math.random().toString(36).substr(2, 9)}`,
      style: 'h3',
      children: [{
        _type: 'span',
        text: product.name,
        marks: []
      }]
    },
    // ユーザーメリット
    {
      _type: 'block',
      _key: `product-benefit-${Math.random().toString(36).substr(2, 9)}`,
      style: 'normal',
      children: [{
        _type: 'span',
        text: product.userBenefit,
        marks: []
      }]
    },
    // 特徴リスト
    {
      _type: 'block',
      _key: `product-feature-label-${Math.random().toString(36).substr(2, 9)}`,
      style: 'normal',
      children: [{
        _type: 'span',
        text: '主な特徴：',
        marks: ['strong']
      }]
    },
    ...product.features.map((feature, index) => ({
      _type: 'block',
      _key: `product-feature-${index}-${Math.random().toString(36).substr(2, 9)}`,
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
      _key: `product-links-${Math.random().toString(36).substr(2, 9)}`,
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: 'Amazonで見る',
          marks: [
            {
              _type: 'link',
              _key: `link-amazon-${Math.random().toString(36).substr(2, 9)}`,
              href: product.amazonUrl
            }
          ]
        },
        {
          _type: 'span',
          text: ' [PR] | ',
          marks: []
        },
        {
          _type: 'span',
          text: '楽天市場で見る',
          marks: [
            {
              _type: 'link',
              _key: `link-rakuten-${Math.random().toString(36).substr(2, 9)}`,
              href: product.rakutenUrl
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
          _key: `linkdef-amazon-${Math.random().toString(36).substr(2, 9)}`,
          href: product.amazonUrl
        },
        {
          _type: 'link',
          _key: `linkdef-rakuten-${Math.random().toString(36).substr(2, 9)}`,
          href: product.rakutenUrl
        }
      ]
    }
  ]
}

/**
 * アイテムセクション全体を作成
 */
function createItemsSection(category) {
  const mapping = articleToProductMapping[category]
  if (!mapping) return []

  const blocks = []

  // セクションタイトル（H2見出し）
  blocks.push({
    _type: 'block',
    _key: `section-title-${Math.random().toString(36).substr(2, 9)}`,
    style: 'h2',
    children: [{
      _type: 'span',
      text: mapping.sectionTitle,
      marks: []
    }]
  })

  // イントロ文
  blocks.push({
    _type: 'block',
    _key: `section-intro-${Math.random().toString(36).substr(2, 9)}`,
    style: 'normal',
    children: [{
      _type: 'span',
      text: mapping.intro,
      marks: []
    }]
  })

  // 各商品ブロック
  mapping.products.forEach(productKey => {
    const productList = affiliateProducts[productKey]
    if (productList && productList.length > 0) {
      // 各カテゴリの最初の商品のみを追加
      const product = productList[0]
      blocks.push(...createProductBlock(product))
    }
  })

  // アフィリエイト免責事項
  blocks.push({
    _type: 'block',
    _key: `affiliate-disclaimer-${Math.random().toString(36).substr(2, 9)}`,
    style: 'normal',
    children: [{
      _type: 'span',
      text: '※ [PR]表記のリンクはアフィリエイトリンクです。商品購入時に当サイトに紹介料が入りますが、価格は変わりません。',
      marks: []
    }]
  })

  return blocks
}

/**
 * 「まとめ」セクションの位置を検索
 */
function findMatomePosition(body) {
  return body.findIndex(block =>
    block._type === 'block' &&
    block.style === 'h2' &&
    block.children &&
    block.children.some(child =>
      child.text && child.text.includes('まとめ')
    )
  )
}

/**
 * アイテムセクションが既に存在するかチェック
 */
function hasItemsSection(body) {
  return body.some(block =>
    block._type === 'block' &&
    block.style === 'h2' &&
    block.children &&
    block.children.some(child =>
      child.text && (
        child.text.includes('役立つ') ||
        child.text.includes('アイテム') ||
        child.text.includes('準備')
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
  console.log('🎁 実用的なアイテムリスト自動追加ツール')
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
  let noCategory = 0

  for (const post of posts) {
    // カテゴリ判定
    const category = determineProductCategory(post.title)

    if (!category) {
      noCategory++
      continue
    }

    // 既にアイテムセクションがあるかチェック
    if (hasItemsSection(post.body)) {
      console.log(`⏭️  スキップ: ${post.title}（既にアイテムセクション存在）`)
      skipped++
      continue
    }

    // まとめの位置を探す
    const matomePos = findMatomePosition(post.body)
    if (matomePos === -1) {
      console.log(`⚠️  スキップ: ${post.title}（まとめセクションなし）`)
      skipped++
      continue
    }

    // アイテムセクション作成
    const itemsSection = createItemsSection(category)
    if (itemsSection.length === 0) {
      continue
    }

    // まとめの前に挿入
    const newBody = [
      ...post.body.slice(0, matomePos),
      ...itemsSection,
      ...post.body.slice(matomePos)
    ]

    console.log(`✅ 追加: ${post.title}`)
    console.log(`   カテゴリ: ${category}`)
    console.log(`   商品数: ${articleToProductMapping[category].products.length}個\n`)

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
  console.log(`✅ アイテム追加: ${updated}件`)
  console.log(`⏭️  スキップ: ${skipped}件`)
  console.log(`➖ カテゴリ該当なし: ${noCategory}件`)
  console.log()

  if (dryRun) {
    console.log('💡 実際に追加するには: node scripts/add-helpful-items.js --execute')
  } else {
    console.log('✨ 完了！')
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { createItemsSection, findMatomePosition }
