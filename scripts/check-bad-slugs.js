#!/usr/bin/env node

/**
 * 不適切なSlugを持つ記事をチェック
 *
 * 検出対象:
 * - 数字のみのセグメント（例: nursing-assistant-article-019823-1）
 * - セグメント数が2未満または4より多い
 */

const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: 'kktxm8id',
  dataset: 'production',
  apiVersion: '2023-05-03',
  token: process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN,
  useCdn: false
})

function needsSlugRegeneration(slug) {
  if (!slug || typeof slug !== 'string') return true
  const normalized = slug.trim().toLowerCase()
  if (!normalized.startsWith('nursing-assistant-')) return true
  if (/[^a-z0-9-]/.test(normalized)) return true
  const remainder = normalized.replace(/^nursing-assistant-/, '')
  const segments = remainder.split('-').filter(Boolean)
  // 2-4個の単語を許容、数字のみのセグメントは不適切（SEO対策）
  return segments.length < 2 || segments.length > 4 || segments.some(seg => /^\d+$/.test(seg))
}

async function checkBadSlugs() {
  console.log('🔍 不適切なSlugを持つ記事をチェック中...\n')

  const posts = await client.fetch(`
    *[_type == 'post' && !(_id in path('drafts.**'))] {
      _id,
      title,
      "slug": slug.current
    }
  `)

  console.log(`総記事数: ${posts.length}件\n`)

  const badSlugs = []

  posts.forEach(post => {
    if (needsSlugRegeneration(post.slug)) {
      const remainder = post.slug.replace(/^nursing-assistant-/, '')
      const segments = remainder.split('-').filter(Boolean)
      const hasNumberSegments = segments.some(seg => /^\d+$/.test(seg))

      badSlugs.push({
        title: post.title,
        slug: post.slug,
        segments: segments.length,
        hasNumberSegments
      })
    }
  })

  if (badSlugs.length === 0) {
    console.log('✅ すべてのSlugが適切です\n')
    return
  }

  console.log(`❌ 不適切なSlug: ${badSlugs.length}件\n`)

  badSlugs.forEach((item, index) => {
    console.log(`${index + 1}. ${item.title}`)
    console.log(`   Slug: ${item.slug}`)
    console.log(`   セグメント数: ${item.segments}個`)
    if (item.hasNumberSegments) {
      console.log(`   ⚠️  数字のみのセグメントを含む`)
    }
    console.log()
  })

  console.log(`\n💡 修正方法: \`node scripts/maintenance.js all\` を実行してください\n`)
}

checkBadSlugs().catch(err => {
  console.error('エラー:', err)
  process.exit(1)
})
