#!/usr/bin/env node
/**
 * [PR]バッジのスタイルを削除（プレーンテキストに変更）
 */
const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false
})

function fixPrBadgeStyle(body) {
  if (!Array.isArray(body)) return { body, changes: 0 }

  let changes = 0

  const newBody = body.map(block => {
    if (block._type === 'affiliateEmbed' && block.html && block.html.includes('<span style="display: inline-block; background: #0066cc;')) {
      changes++

      // [PR]バッジのスタイルを削除
      const newHtml = block.html.replace(
        /<span style="display: inline-block; background: #0066cc; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-right: 8px;">\[PR\]<\/span>/g,
        '[PR] '
      )

      return {
        ...block,
        html: newHtml
      }
    }

    return block
  })

  return { body: newBody, changes }
}

async function fixPrBadge() {
  const slug = 'nursing-assistant-recommended-shoes'

  console.log('🎨 [PR]バッジのスタイルを修正中...\n')

  // 記事を取得
  const post = await client.fetch(`*[_type == 'post' && slug.current == $slug][0]`, { slug })

  if (!post) {
    console.error('❌ 記事が見つかりません')
    return
  }

  console.log(`タイトル: ${post.title}\n`)

  // [PR]バッジのスタイルを修正
  const result = fixPrBadgeStyle(post.body)

  if (result.changes === 0) {
    console.log('⚠️  修正対象が見つかりませんでした')
    return
  }

  console.log(`修正したブロック数: ${result.changes}`)

  // 更新
  await client.patch(post._id).set({ body: result.body }).commit()

  console.log('\n✅ 修正完了！')
  console.log(`編集URL: https://prorenata.jp/studio/structure/post;${post._id}`)
  console.log(`プレビューURL: https://prorenata.jp/posts/${slug}`)
}

fixPrBadge().catch(console.error)
