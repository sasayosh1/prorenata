#!/usr/bin/env node
const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false
})

async function fixArticle() {
  const slug = 'nursing-assistant-recommended-shoes'

  // 記事を取得
  const post = await client.fetch(`*[_type == 'post' && slug.current == $slug][0]`, { slug })

  if (!post) {
    console.error('❌ 記事が見つかりません')
    return
  }

  console.log('📝 記事を修正中...')
  console.log(`タイトル: ${post.title}`)

  let fixCount = 0

  // bodyから不自然なCTA文を含むブロックを探して修正
  const updatedBody = post.body.map(block => {
    if (block._type === 'block' && block.children) {
      const text = block.children.map(c => c.text || '').join('')

      // 「おすすめシューズ7選」という引用を含む場合、より自然な表現に変更
      if (text.includes('「おすすめシューズ7選」で使う小物や替えのグローブは')) {
        fixCount++
        console.log(`  ✓ Amazon CTA文を修正`)
        return {
          ...block,
          children: [{
            ...block.children[0],
            text: '小物や替えのグローブなど、毎日使うアイテムはAmazonで常備しておくと安心です。'
          }]
        }
      }

      if (text.includes('「おすすめシューズ7選」の備品を買い足すときは')) {
        fixCount++
        console.log(`  ✓ 楽天 CTA文を修正`)
        return {
          ...block,
          children: [{
            ...block.children[0],
            text: '価格や配送スピードを比較しながら買い足したいときは楽天市場が頼りになります。ポイント活用でコストも抑えられます。'
          }]
        }
      }

      if (text.includes('「おすすめシューズ7選」で着るユニフォームやポケットオーガナイザーは')) {
        fixCount++
        console.log(`  ✓ ナースリー CTA文を修正`)
        return {
          ...block,
          children: [{
            ...block.children[0],
            text: 'ユニフォームやポケットオーガナイザーをまとめて揃えるならナースリーが便利です。現場で必要なサイズやカラーも細かく選べます。'
          }]
        }
      }
    }

    return block
  })

  if (fixCount === 0) {
    console.log('⚠️  修正箇所が見つかりませんでした')
    return
  }

  // 更新
  await client.patch(post._id).set({ body: updatedBody }).commit()

  console.log(`\n✅ 修正完了！（${fixCount}箇所）`)
  console.log(`編集URL: https://prorenata.jp/studio/structure/post;${post._id}`)
  console.log(`プレビューURL: https://prorenata.jp/posts/${slug}`)
}

fixArticle().catch(console.error)
