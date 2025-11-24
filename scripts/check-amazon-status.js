#!/usr/bin/env node
const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: '4vhsekpl',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false
})

async function checkAmazonStatus() {
  const posts = await client.fetch(`
    *[_type == 'post' && !(_id in path('drafts.**')) && internalOnly != true && maintenanceLocked != true] {
      title,
      'slug': slug.current,
      'categories': categories[]->title,
      'affiliateBlocks': body[_type == 'affiliateEmbed'],
      'linkBlocks': body[_type == 'block' && count(markDefs[_type == 'link' && href match '*moshimo*']) > 0]
    }
  `)

  let amazonEmbedCount = 0
  let rakutenEmbedCount = 0
  let nurseryEmbedCount = 0
  let brokenLinkCount = 0

  const postsWithAmazon = []
  const postsWithBrokenLinks = []

  posts.forEach(post => {
    const amazonBlocks = (post.affiliateBlocks || []).filter(b =>
      (b.key && b.key.match(/amazon/i)) ||
      (b.linkKey && b.linkKey.match(/amazon/i)) ||
      (b.html && b.html.includes('p_id=170'))
    )

    const rakutenBlocks = (post.affiliateBlocks || []).filter(b =>
      (b.key && b.key.match(/rakuten/i)) ||
      (b.linkKey && b.linkKey.match(/rakuten/i)) ||
      (b.html && b.html.includes('p_id=54'))
    )

    const nurseryBlocks = (post.affiliateBlocks || []).filter(b =>
      (b.key && b.key.match(/nursery/i)) ||
      (b.linkKey && b.linkKey.match(/nursery/i))
    )

    amazonEmbedCount += amazonBlocks.length
    rakutenEmbedCount += rakutenBlocks.length
    nurseryEmbedCount += nurseryBlocks.length

    if (amazonBlocks.length > 0 || rakutenBlocks.length > 0) {
      postsWithAmazon.push({
        title: post.title,
        slug: post.slug,
        categories: post.categories,
        amazon: amazonBlocks.length,
        rakuten: rakutenBlocks.length
      })
    }

    // 壊れたリンクをチェック
    if (post.linkBlocks && post.linkBlocks.length > 0) {
      post.linkBlocks.forEach(block => {
        if (block.markDefs) {
          block.markDefs.forEach(def => {
            if (def.href && def.href.includes('<a')) {
              brokenLinkCount++
              postsWithBrokenLinks.push({
                title: post.title,
                slug: post.slug,
                brokenHref: def.href.substring(0, 100)
              })
            }
          })
        }
      })
    }
  })

  console.log('📊 アフィリエイトリンク設置状況（全記事）:')
  console.log(`全記事数: ${posts.length}`)
  console.log(`Amazonリンク: ${amazonEmbedCount}個 (${postsWithAmazon.filter(p => p.amazon > 0).length}記事)`)
  console.log(`楽天リンク: ${rakutenEmbedCount}個 (${postsWithAmazon.filter(p => p.rakuten > 0).length}記事)`)
  console.log(`ナースリーリンク: ${nurseryEmbedCount}個`)
  console.log(`壊れたリンク: ${brokenLinkCount}個 (${postsWithBrokenLinks.length}記事)`)
  console.log('')

  if (postsWithBrokenLinks.length > 0) {
    console.log('⚠️  壊れたリンクを含む記事:')
    postsWithBrokenLinks.slice(0, 5).forEach(post => {
      console.log(`- ${post.title}`)
      console.log(`  Slug: ${post.slug}`)
      console.log(`  Broken: ${post.brokenHref}`)
    })
    console.log('')
  }

  if (postsWithAmazon.length > 0) {
    console.log('📝 Amazon/楽天リンクを含む記事（上位10件）:')
    postsWithAmazon
      .sort((a, b) => (b.amazon + b.rakuten) - (a.amazon + a.rakuten))
      .slice(0, 10)
      .forEach((post, i) => {
        const titlePreview = post.title.length > 50 ? post.title.substring(0, 50) + '...' : post.title
        console.log(`${i+1}. ${titlePreview}`)
        console.log(`   カテゴリ: ${(post.categories || []).join(', ') || 'なし'}`)
        console.log(`   Amazon:${post.amazon} / 楽天:${post.rakuten}`)
        console.log(`   https://prorenata.jp/posts/${post.slug}`)
      })
  } else {
    console.log('⚠️  Amazon/楽天リンクを含む記事が見つかりませんでした')
  }
}

checkAmazonStatus().catch(console.error)
