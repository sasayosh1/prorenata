#!/usr/bin/env node
/**
 * インラインアフィリエイトブロックを統合
 * CTA文とリンクを別々のブロックから、1つの薄いブルー背景ボックスにまとめる
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

function escapeHtml(text = '') {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function findLinkKeyFromUrl(url) {
  if (!url) return null

  // URLからリンクキーを推測
  if (url.includes('p_id=170') || url.includes('amazon')) return 'amazon'
  if (url.includes('p_id=54') || url.includes('rakuten')) return 'rakuten'
  if (url.includes('pid=892289712') || url.includes('nursery')) return 'nursery'

  return null
}

function consolidateInlineAffiliateBlocks(body) {
  if (!Array.isArray(body)) return { body, changes: 0 }

  const newBody = []
  let changes = 0
  let i = 0

  while (i < body.length) {
    const currentBlock = body[i]

    // 通常のテキストブロックで、次のブロックが[PR]リンクの場合
    if (
      currentBlock._type === 'block' &&
      currentBlock.style === 'normal' &&
      currentBlock.children &&
      i + 1 < body.length
    ) {
      const nextBlock = body[i + 1]

      // 次のブロックが[PR]で始まるリンクブロックかチェック
      if (
        nextBlock._type === 'block' &&
        nextBlock.style === 'normal' &&
        nextBlock.children &&
        nextBlock.children[0]?.text?.startsWith('[PR]') &&
        nextBlock.markDefs &&
        nextBlock.markDefs.length > 0
      ) {
        // CTA文を取得
        const ctaText = currentBlock.children.map(c => c.text || '').join('').trim()

        // リンク情報を取得
        const linkDef = nextBlock.markDefs[0]
        const linkText = nextBlock.children
          .filter(c => c.marks && c.marks.includes(linkDef._key))
          .map(c => c.text || '')
          .join('')
          .trim()

        const linkKey = findLinkKeyFromUrl(linkDef.href)
        const link = linkKey ? MOSHIMO_LINKS[linkKey] : null

        if (link && INLINE_AFFILIATE_KEYS.has(linkKey)) {
          console.log(`  ✓ 統合: ${link.name}`)

          // 1つの薄いブルー背景ボックスにまとめる
          const combinedHtml = `
<div class="affiliate-card" style="background: linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%); border: 1px solid #b3d9ff; border-radius: 8px; padding: 16px; margin: 16px 0;">
  <p style="margin: 0 0 12px 0; color: #1a1a1a; line-height: 1.6;">${escapeHtml(ctaText)}</p>
  <p style="margin: 0;">
    <span style="display: inline-block; background: #0066cc; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-right: 8px;">[PR]</span>
    <a href="${linkDef.href}" target="_blank" rel="nofollow" style="color: #0066cc; text-decoration: underline;">${escapeHtml(linkText)}</a>
  </p>
</div>`.trim()

          newBody.push({
            _type: 'affiliateEmbed',
            _key: `inline-affiliate-${randomUUID()}`,
            provider: link.name,
            linkKey,
            label: linkText,
            html: combinedHtml
          })

          changes++
          i += 2 // 2つのブロックをスキップ
          continue
        }
      }
    }

    // 統合対象でない場合はそのまま追加
    newBody.push(currentBlock)
    i++
  }

  return { body: newBody, changes }
}

async function fixInlineAffiliateBlocks() {
  const slug = 'nursing-assistant-recommended-shoes'

  console.log('📝 インラインアフィリエイトブロックを統合中...\n')

  // 記事を取得
  const post = await client.fetch(`*[_type == 'post' && slug.current == $slug][0]`, { slug })

  if (!post) {
    console.error('❌ 記事が見つかりません')
    return
  }

  console.log(`タイトル: ${post.title}`)

  // ブロックを統合
  const result = consolidateInlineAffiliateBlocks(post.body)

  if (result.changes === 0) {
    console.log('\n⚠️  統合対象のブロックが見つかりませんでした')
    return
  }

  console.log(`\n統合したブロック数: ${result.changes}`)

  // 更新
  await client.patch(post._id).set({ body: result.body }).commit()

  console.log('\n✅ 修正完了！')
  console.log(`編集URL: https://prorenata.jp/studio/structure/post;${post._id}`)
  console.log(`プレビューURL: https://prorenata.jp/posts/${slug}`)
}

fixInlineAffiliateBlocks().catch(console.error)
