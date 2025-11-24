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

  console.log('📝 Meta Descriptionを修正中...')
  console.log(`現在: ${post.metaDescription}（${post.metaDescription.length}文字）`)

  // 新しいMeta Description（120〜160文字）
  const newMetaDescription = '看護助手におすすめのシューズ7選を現場経験から厳選紹介。一日中立ち仕事でも疲れにくい靴の選び方、クッション性・通気性・脱ぎ履きのしやすさなど重視すべきポイントを詳しく解説します。アシックス、ミズノ、ナースリーなど人気ブランドを比較。'

  console.log(`新規: ${newMetaDescription}（${newMetaDescription.length}文字）`)

  // 更新
  await client.patch(post._id).set({ metaDescription: newMetaDescription }).commit()

  console.log('\n✅ 修正完了！')
  console.log(`編集URL: https://prorenata.jp/studio/structure/post;${post._id}`)
}

fixMetaDescription().catch(console.error)
