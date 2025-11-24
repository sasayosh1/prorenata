#!/usr/bin/env node
/**
 * インラインアフィリエイトブロックを元に戻す
 * affiliateEmbed から、CTA文（block）+ リンク（block）の2つのブロックに分割
 */
const { createClient } = require('@sanity/client')
const { randomUUID } = require('crypto')
const { MOSHIMO_LINKS, INLINE_AFFILIATE_KEYS } = require('./moshimo-affiliate-links')

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false
})

function extractCtaAndLinkFromHtml(html) {
  // HTMLからCTA文とリンク情報を抽出
  const ctaMatch = html.match(/<p[^>]*>(.*?)<\/p>\s*<p[^>]*>/s)
  const linkMatch = html.match(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/)

  if (!ctaMatch || !linkMatch) {
    return null
  }

  const ctaText = ctaMatch[1]
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()

  const linkUrl = linkMatch[1]
  const linkText = linkMatch[2]
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()

  return { ctaText, linkUrl, linkText }
}

function revertInlineAffiliateBlocks(body) {
  if (!Array.isArray(body)) return { body, changes: 0 }

  const newBody = []
  let changes = 0

  body.forEach(block => {
    // affiliateEmbedで、linkKeyがインラインアフィリエイトキーの場合
    if (
      block._type === 'affiliateEmbed' &&
      block.linkKey &&
      INLINE_AFFILIATE_KEYS.has(block.linkKey) &&
      block.html
    ) {
      const extracted = extractCtaAndLinkFromHtml(block.html)

      if (extracted) {
        console.log(`  ✓ 復元: ${MOSHIMO_LINKS[block.linkKey]?.name || block.linkKey}`)

        // CTA文のブロック
        newBody.push({
          _type: 'block',
          _key: `inline-cta-${randomUUID()}`,
          style: 'normal',
          markDefs: [],
          children: [
            {
              _type: 'span',
              _key: `inline-cta-text-${randomUUID()}`,
              marks: [],
              text: extracted.ctaText
            }
          ]
        })

        // リンクのブロック
        const linkMarkKey = `affiliate-inline-${randomUUID()}`
        newBody.push({
          _type: 'block',
          _key: `inline-link-${randomUUID()}`,
          style: 'normal',
          markDefs: [
            {
              _key: linkMarkKey,
              _type: 'link',
              href: extracted.linkUrl,
              openInNewTab: true
            }
          ],
          children: [
            {
              _type: 'span',
              _key: `inline-pr-${randomUUID()}`,
              marks: [],
              text: '[PR] '
            },
            {
              _type: 'span',
              _key: `inline-link-text-${randomUUID()}`,
              marks: [linkMarkKey],
              text: extracted.linkText
            }
          ]
        })

        changes++
        return
      }
    }

    // 復元対象でない場合はそのまま追加
    newBody.push(block)
  })

  return { body: newBody, changes }
}

async function revertInlineAffiliate() {
  const slug = 'nursing-assistant-recommended-shoes'

  console.log('🔄 インラインアフィリエイトブロックを元に戻しています...\n')

  // 記事を取得
  const post = await client.fetch(`*[_type == 'post' && slug.current == $slug][0]`, { slug })

  if (!post) {
    console.error('❌ 記事が見つかりません')
    return
  }

  console.log(`タイトル: ${post.title}`)

  // ブロックを復元
  const result = revertInlineAffiliateBlocks(post.body)

  if (result.changes === 0) {
    console.log('\n⚠️  復元対象のブロックが見つかりませんでした')
    return
  }

  console.log(`\n復元したブロック数: ${result.changes}`)

  // 更新
  await client.patch(post._id).set({ body: result.body }).commit()

  console.log('\n✅ 元に戻しました！')
  console.log(`編集URL: https://prorenata.jp/studio/structure/post;${post._id}`)
  console.log(`プレビューURL: https://prorenata.jp/posts/${slug}`)
}

revertInlineAffiliate().catch(console.error)
