#!/usr/bin/env node
/**
 * シューズ記事のアフィリエイトブロックを記事内容に応じた訴求文で再生成
 */

const { createClient } = require('@sanity/client')
const { addAffiliateLinksToArticle } = require('./utils/postHelpers')

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false
})

async function regenerateAffiliateLinks() {
  const slug = 'nursing-assistant-recommended-shoes'

  console.log('📝 シューズ記事のアフィリエイトリンクを再生成中...\n')

  // 記事を取得
  const post = await client.fetch(`
    *[_type == 'post' && slug.current == $slug][0]{
      _id,
      title,
      slug,
      categories[]->{title},
      body
    }
  `, { slug })

  if (!post) {
    console.error('❌ 記事が見つかりません')
    return
  }

  console.log(`タイトル: ${post.title}`)
  console.log(`ID: ${post._id}\n`)

  // 既存のアフィリエイトブロックを削除
  const originalBody = post.body || []
  const bodyWithoutAffiliates = originalBody.filter(block => {
    if (block._type === 'affiliateEmbed') {
      return false
    }
    if (block._type === 'block' && block._key) {
      // inline-cta- または inline-link- で始まるブロックを削除
      if (block._key.startsWith('inline-cta-') || block._key.startsWith('inline-link-')) {
        return false
      }
    }
    return true
  })

  console.log(`削除したアフィリエイトブロック数: ${originalBody.length - bodyWithoutAffiliates.length}`)

  // 新しいアフィリエイトリンクを追加（記事内容に応じた訴求文で）
  const result = addAffiliateLinksToArticle(
    bodyWithoutAffiliates,
    post.title,
    {
      slug: post.slug.current,
      categories: post.categories || []
    },
    {}
  )

  console.log(`追加したアフィリエイトブロック数: ${result.addedLinks}\n`)

  // 記事を更新
  await client
    .patch(post._id)
    .set({ body: result.body })
    .commit()

  console.log('✅ 再生成完了！')
  console.log(`プレビューURL: https://prorenata.jp/posts/${slug}`)
}

regenerateAffiliateLinks().catch(console.error)
