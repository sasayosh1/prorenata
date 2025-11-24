#!/usr/bin/env node
const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false
})

async function fixMetaDescription() {
  const slug = 'nursing-assistant-recommended-shoes'

  // 記事を取得
  const post = await client.fetch(`*[_type == 'post' && slug.current == $slug][0]`, { slug })

  if (!post) {
    console.error('❌ 記事が見つかりません')
    return
  }

  console.log('📝 Meta Descriptionを整理中...')
  console.log(`\n【現在】`)
  console.log(`"${post.metaDescription}"`)
  console.log(`（${post.metaDescription.length}文字）`)

  // 新しいMeta Description（120〜160文字、より自然な表現）
  const newMetaDescription = '看護助手におすすめのシューズ7選を現場経験から厳選。一日中立ち仕事でも疲れにくい靴の選び方、クッション性・通気性・脱ぎ履きのしやすさなど重視すべき3つのポイントを詳しく解説。アシックス、ミズノ、ナースリーなど人気ブランドを比較し、足が楽になる一足の見つけ方をお伝えします。'

  console.log(`\n【修正後】`)
  console.log(`"${newMetaDescription}"`)
  console.log(`（${newMetaDescription.length}文字）`)

  if (newMetaDescription.length < 120 || newMetaDescription.length > 160) {
    console.warn(`⚠️  警告: Meta Descriptionが推奨範囲外です（推奨: 120〜160文字）`)
  } else {
    console.log(`✓ Meta Descriptionが推奨範囲内です（120〜160文字）`)
  }

  // 更新
  await client.patch(post._id).set({ metaDescription: newMetaDescription }).commit()

  console.log('\n✅ 修正完了！')
  console.log(`編集URL: https://prorenata.jp/studio/structure/post;${post._id}`)
}

fixMetaDescription().catch(console.error)
