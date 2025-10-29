#!/usr/bin/env node

const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: 'kktxm8id',
  dataset: 'production',
  apiVersion: '2023-05-03',
  token: process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN,
  useCdn: false
})

async function checkAffiliateLinks() {
  console.log('🔍 アフィリエイトリンクの実態調査\n')

  const posts = await client.fetch(`
    *[_type == 'post' && !(_id in path('drafts.**'))] | order(_createdAt desc) [0...10] {
      _id,
      title,
      body
    }
  `)

  let totalPosts = 0
  let postsWithAffiliateLinks = 0
  const linksByDomain = {}
  const allLinks = []

  posts.forEach(post => {
    totalPosts++
    let hasAffiliateLink = false

    if (post.body && Array.isArray(post.body)) {
      post.body.forEach(block => {
        if (block.markDefs && Array.isArray(block.markDefs)) {
          block.markDefs.forEach(def => {
            if (def._type === 'link' && def.href) {
              // ASPドメインを検出
              const aspDomains = ['a8.net', 'felmat', 'afb', 'valuecommerce', 'moshimo', 'accesstrade']
              const isAffiliateLink = aspDomains.some(domain => def.href.includes(domain))

              if (isAffiliateLink) {
                hasAffiliateLink = true

                // ドメイン別集計
                const domain = aspDomains.find(d => def.href.includes(d))
                if (!linksByDomain[domain]) {
                  linksByDomain[domain] = 0
                }
                linksByDomain[domain]++

                allLinks.push({
                  postTitle: post.title,
                  postId: post._id,
                  domain,
                  href: def.href
                })
              }
            }
          })
        }
      })
    }

    if (hasAffiliateLink) {
      postsWithAffiliateLinks++
    }
  })

  console.log('📊 集計結果（最新10記事）:\n')
  console.log(`  総記事数: ${totalPosts}件`)
  console.log(`  アフィリエイトリンクあり: ${postsWithAffiliateLinks}件`)
  console.log(`  アフィリエイトリンクなし: ${totalPosts - postsWithAffiliateLinks}件\n`)

  if (Object.keys(linksByDomain).length > 0) {
    console.log('📈 ASP別リンク数:\n')
    Object.entries(linksByDomain).forEach(([domain, count]) => {
      console.log(`  ${domain}: ${count}件`)
    })
    console.log()
  }

  if (allLinks.length > 0) {
    console.log('🔗 実際のアフィリエイトリンク（最新5件）:\n')
    allLinks.slice(0, 5).forEach((link, i) => {
      console.log(`${i + 1}. 記事: ${link.postTitle}`)
      console.log(`   ASP: ${link.domain}`)
      console.log(`   URL: ${link.href}`)
      console.log()
    })
  } else {
    console.log('⚠️  最新10記事にアフィリエイトリンクが見つかりませんでした\n')
  }
}

checkAffiliateLinks().catch(err => {
  console.error('エラー:', err)
  process.exit(1)
})
