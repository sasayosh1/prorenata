#!/usr/bin/env node
/**
 * 全記事のカテゴリを再割り当てするスクリプト
 *
 * 使い方:
 *   SANITY_WRITE_TOKEN=<token> node scripts/update-categories.js        # ドライラン
 *   SANITY_WRITE_TOKEN=<token> node scripts/update-categories.js --apply # 実行
 */

const { createClient } = require('@sanity/client')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN,
  useCdn: false,
})

if (!client.config().token) {
  console.error('❌ SANITY_WRITE_TOKEN もしくは SANITY_API_TOKEN が設定されていません。')
  process.exit(1)
}

function toPlain(text) {
  return (text || '')
    .normalize('NFKC')
    .toLowerCase()
}

const RULES = [
  { category: '退職', keywords: ['退職', '辞め', '離職', '円満', '退社', '退職届', '退職願', '有給', '引き継ぎ'], weight: 6 },
  { category: '転職', keywords: ['転職', '就職', '応募', '履歴書', '面接', '求人', '派遣', '志望動機', '内定', 'エージェント'], weight: 5 },
  {
    category: '資格',
    require: ['資格'],
    keywords: ['資格', '取得', '受験', '勉強', '講座', '研修', '検定', '合格', '通信', '模試', '学習'],
    weight: 4,
  },
  { category: '看護師', keywords: ['看護師', '准看', '正看', '看護学校', '看護大学', '看護学科', '看護師国家試験'], weight: 4 },
  { category: '給与', keywords: ['給料', '給与', '年収', '賞与', '収入', '賃金', '手当', 'ボーナス', '時給', '月収'], weight: 4 },
  {
    category: '感染対策',
    keywords: ['感染', '衛生', '消毒', 'マスク', '防護', '予防', '清潔', '手洗い', '除菌', 'コロナ', 'インフル', '防護具'],
    weight: 3,
  },
  {
    category: '患者対応',
    keywords: ['患者対応', '接遇', '声かけ', '案内', '受付', '安心', '不安', 'コミュニケーション', '笑顔', '寄り添う', '傾聴'],
    weight: 3,
  },
  { category: '悩み', keywords: ['悩み', '不安', 'ストレス', 'メンタル', '心', 'つらい', 'しんどい', '疲れ', '落ち込む', '頑張れない'], weight: 3 },
  { category: '人間関係', keywords: ['人間関係', '上司', '先輩', '同僚', 'チーム', '連携', 'コミュニケーション', '摩擦', '関係性'], weight: 3 },
  {
    category: '実務',
    keywords: ['実務', '移乗', '体位変換', '清拭', '排泄', '口腔ケア', '物品', 'シーツ', '記録', 'バイタル', 'ケア手順', '環境整備', '準備'],
    weight: 3,
  },
  {
    category: '仕事内容',
    keywords: ['仕事内容', '役割', 'やりがい', 'できる仕事', 'できない仕事', '仕事', '業務内容', '種類', '徹底解説', 'とは', '基本'],
    weight: 2,
  },
]

function determineCategory(post) {
  const titlePlain = toPlain(post.title)

  const TITLE_RULES = [
    { category: '退職', includes: ['退職'] },
    { category: '転職', includes: ['転職'] },
    { category: '資格', includes: ['資格', '取得'] },
    { category: '看護師', includes: ['看護師'] },
    { category: '仕事内容', includes: ['仕事内容'] },
    { category: '仕事内容', includes: ['役割'] },
    { category: '仕事内容', includes: ['できる仕事'] },
    { category: '仕事内容', includes: ['できない仕事'] },
    { category: '仕事内容', includes: ['仕事', 'とは'] },
    { category: '仕事内容', includes: ['仕事', '質問'] },
    { category: '実務', includes: ['実務'] },
    { category: '悩み', includes: ['悩み'] },
    { category: '悩み', includes: ['精神的'] },
    { category: '患者対応', includes: ['患者', '対応'] },
    { category: '人間関係', includes: ['人間関係'] },
    { category: '感染対策', includes: ['感染'] },
    { category: '給与', includes: ['給料'] },
    { category: '給与', includes: ['年収'] },
  ]

  for (const rule of TITLE_RULES) {
    const terms = rule.includes
    if (terms.every(term => titlePlain.includes(term))) {
      return rule.category
    }
  }

  const rawText = toPlain([post.title, ...(post.tags || []), post.plainBody || ''].join(' '))

  let bestCategory = '仕事内容'
  let bestScore = 0

  for (const rule of RULES) {
    if (rule.require && !rule.require.every(keyword => rawText.includes(keyword))) {
      continue
    }

    const matches = rule.keywords.filter(keyword => rawText.includes(keyword))
    if (matches.length === 0) continue

    const score = matches.length * (rule.weight || 1)
    if (score > bestScore) {
      bestCategory = rule.category
      bestScore = score
    }
  }

  return bestCategory
}

async function main() {
  const apply = process.argv.includes('--apply')
  console.log(`\n🔍 カテゴリ再割り当てを開始します（適用モード: ${apply ? 'ON' : 'OFF'}）\n`)

  const categories = await client.fetch(`*[_type == "category"]{ _id, title }`)
  const categoryMap = new Map(categories.map(cat => [cat.title, cat._id]))

  const posts = await client.fetch(`*[_type == "post"]{
    _id,
    title,
    "slug": slug.current,
    "categories": categories[]->title,
    tags,
    "plainBody": pt::text(body)
  }`)

  const updates = []

  posts.forEach(post => {
    const targetCategory = determineCategory(post)
    const currentCategory = post.categories && post.categories[0]

    if (!categoryMap.has(targetCategory)) {
      console.warn(`⚠️ カテゴリ「${targetCategory}」が見つかりません: ${post.title}`)
      return
    }

    if (currentCategory === targetCategory) {
      return
    }

    updates.push({
      id: post._id,
      title: post.title,
      slug: post.slug,
      from: currentCategory,
      to: targetCategory,
      categoryId: categoryMap.get(targetCategory),
    })
  })

  if (updates.length === 0) {
    console.log('✅ 更新が必要な記事はありませんでした。\n')
    return
  }

  console.log(`📊 更新対象: ${updates.length}件 / 全${posts.length}記事\n`)

  updates.slice(0, 20).forEach((item, index) => {
    console.log(`${index + 1}. ${item.title}`)
    console.log(`   Slug: ${item.slug}`)
    console.log(`   カテゴリ: ${item.from || 'なし'} → ${item.to}\n`)
  })
  if (updates.length > 20) {
    console.log(`   ... 他 ${updates.length - 20}件\n`)
  }

  if (!apply) {
    console.log('ℹ️  実際に更新するには --apply を付けて再実行してください。\n')
    return
  }

  console.log('🛠️  Sanity を更新します...\n')

  for (let i = 0; i < updates.length; i++) {
    const item = updates[i]
    try {
      await client
        .patch(item.id)
        .set({
          categories: [
            {
              _type: 'reference',
              _ref: item.categoryId,
            },
          ],
        })
        .commit()

      console.log(
        `✅ [${i + 1}/${updates.length}] ${item.title}\n   ${item.from || 'なし'} → ${item.to} (${item.slug})`
      )
    } catch (error) {
      console.error(`❌ 更新失敗: ${item.title} (${item.id}) - ${error.message}`)
    }
  }

  console.log('\n🎉 カテゴリの再割り当てが完了しました。\n')
}

main().catch(error => {
  console.error('❌ 処理中にエラーが発生しました:', error)
  process.exit(1)
})
