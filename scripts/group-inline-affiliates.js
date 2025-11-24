#!/usr/bin/env node
/**
 * インラインアフィリエイトブロックをグループ化
 * CTA文 + 複数のリンク を1つの薄いブルー背景ボックスにまとめる
 */
const { createClient } = require('@sanity/client')
const { randomUUID } = require('crypto')

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

function groupInlineAffiliateBlocks(body) {
  if (!Array.isArray(body)) return { body, changes: 0 }

  const newBody = []
  let changes = 0
  let i = 0

  while (i < body.length) {
    const currentBlock = body[i]

    // CTA文のブロック（次にPRリンクが続く）
    if (
      currentBlock._type === 'block' &&
      currentBlock.style === 'normal' &&
      currentBlock.children &&
      !currentBlock.children[0]?.text?.startsWith('[PR]') &&
      i + 1 < body.length
    ) {
      const ctaText = currentBlock.children.map(c => c.text || '').join('').trim()

      // ナースリーのケース: CTA文 + [PR]ナースリーリンク
      if (
        ctaText.includes('ナースリー') &&
        body[i + 1]._type === 'block' &&
        body[i + 1].children?.[0]?.text?.startsWith('[PR]')
      ) {
        const linkBlock = body[i + 1]
        const linkDef = linkBlock.markDefs?.[0]
        const linkText = linkBlock.children
          .filter(c => c.marks && linkDef && c.marks.includes(linkDef._key))
          .map(c => c.text || '')
          .join('')
          .trim()

        if (linkDef && linkText) {
          console.log('  ✓ グループ化: ナースリー')

          const html = `
<div style="background: linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%); border: 1px solid #b3d9ff; border-radius: 8px; padding: 16px; margin: 16px 0;">
  <p style="margin: 0 0 12px 0; color: #1a1a1a; line-height: 1.6;">${escapeHtml(ctaText)}</p>
  <p style="margin: 0;">
    <span style="display: inline-block; background: #0066cc; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-right: 8px;">[PR]</span>
    <a href="${linkDef.href}" target="_blank" rel="nofollow" style="color: #0066cc; text-decoration: underline;">${escapeHtml(linkText)}</a>
  </p>
</div>`.trim()

          newBody.push({
            _type: 'affiliateEmbed',
            _key: `grouped-affiliate-${randomUUID()}`,
            provider: 'ナースリー',
            linkKey: 'nursery',
            label: linkText,
            html
          })

          changes++
          i += 2
          continue
        }
      }

      // Amazon/楽天のケース: CTA文 + [PR]Amazon + [PR]楽天
      if (
        (ctaText.includes('Amazon') || ctaText.includes('楽天')) &&
        i + 2 < body.length &&
        body[i + 1]._type === 'block' &&
        body[i + 1].children?.[0]?.text?.startsWith('[PR]') &&
        body[i + 2]._type === 'block' &&
        body[i + 2].children?.[0]?.text?.startsWith('[PR]')
      ) {
        const amazonBlock = body[i + 1]
        const rakutenBlock = body[i + 2]

        const amazonLinkDef = amazonBlock.markDefs?.[0]
        const amazonLinkText = amazonBlock.children
          .filter(c => c.marks && amazonLinkDef && c.marks.includes(amazonLinkDef._key))
          .map(c => c.text || '')
          .join('')
          .trim()

        const rakutenLinkDef = rakutenBlock.markDefs?.[0]
        const rakutenLinkText = rakutenBlock.children
          .filter(c => c.marks && rakutenLinkDef && c.marks.includes(rakutenLinkDef._key))
          .map(c => c.text || '')
          .join('')
          .trim()

        if (amazonLinkDef && rakutenLinkDef && amazonLinkText && rakutenLinkText) {
          console.log('  ✓ グループ化: Amazon + 楽天')

          const html = `
<div style="background: linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%); border: 1px solid #b3d9ff; border-radius: 8px; padding: 16px; margin: 16px 0;">
  <p style="margin: 0 0 12px 0; color: #1a1a1a; line-height: 1.6;">${escapeHtml(ctaText)}</p>
  <p style="margin: 0 0 8px 0;">
    <span style="display: inline-block; background: #0066cc; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-right: 8px;">[PR]</span>
    <a href="${amazonLinkDef.href}" target="_blank" rel="nofollow" style="color: #0066cc; text-decoration: underline;">${escapeHtml(amazonLinkText)}</a>
  </p>
  <p style="margin: 0;">
    <span style="display: inline-block; background: #0066cc; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-right: 8px;">[PR]</span>
    <a href="${rakutenLinkDef.href}" target="_blank" rel="nofollow" style="color: #0066cc; text-decoration: underline;">${escapeHtml(rakutenLinkText)}</a>
  </p>
</div>`.trim()

          newBody.push({
            _type: 'affiliateEmbed',
            _key: `grouped-affiliate-${randomUUID()}`,
            provider: 'Amazon・楽天',
            linkKey: 'amazon-rakuten',
            label: 'Amazon・楽天で探す',
            html
          })

          changes++
          i += 3
          continue
        }
      }
    }

    // グループ化対象でない場合はそのまま追加
    newBody.push(currentBlock)
    i++
  }

  return { body: newBody, changes }
}

async function groupInlineAffiliates() {
  const slug = 'nursing-assistant-recommended-shoes'

  console.log('📦 インラインアフィリエイトブロックをグループ化中...\n')

  // 記事を取得
  const post = await client.fetch(`*[_type == 'post' && slug.current == $slug][0]`, { slug })

  if (!post) {
    console.error('❌ 記事が見つかりません')
    return
  }

  console.log(`タイトル: ${post.title}\n`)

  // ブロックをグループ化
  const result = groupInlineAffiliateBlocks(post.body)

  if (result.changes === 0) {
    console.log('⚠️  グループ化対象のブロックが見つかりませんでした')
    return
  }

  console.log(`\nグループ化したセクション数: ${result.changes}`)

  // 更新
  await client.patch(post._id).set({ body: result.body }).commit()

  console.log('\n✅ グループ化完了！')
  console.log(`編集URL: https://prorenata.jp/studio/structure/post;${post._id}`)
  console.log(`プレビューURL: https://prorenata.jp/posts/${slug}`)
}

groupInlineAffiliates().catch(console.error)
