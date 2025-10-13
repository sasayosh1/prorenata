import { createClient } from '@sanity/client'

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

const query = `*[_type == "post"] {
  _id,
  title,
  "slug": slug.current,
  body
}`

async function analyzeAffiliateLinks() {
  const posts = await client.fetch(query)

  console.log(`📊 アフィリエイトリンク分析\n`)
  console.log(`総記事数: ${posts.length}件\n`)

  const affiliateLinks = []
  const affiliateDomains = {}
  const postsWithAffiliates = []

  posts.forEach(post => {
    if (!post.body) return

    let postAffiliateCount = 0
    const postLinks = []

    post.body.forEach(block => {
      if (block._type === 'block' && block.markDefs) {
        block.markDefs.forEach(mark => {
          if (mark._type === 'link' && mark.href) {
            const href = mark.href

            // アフィリエイトパターンをチェック
            const isAffiliate =
              /amazon\.[a-z.]+\/.*[?&]tag=/i.test(href) ||
              /rakuten\.co\.jp/i.test(href) ||
              /a8\.net/i.test(href) ||
              /moshimo\.com/i.test(href) ||
              /valuecommerce\.ne\.jp/i.test(href) ||
              /linksynergy\.com/i.test(href) ||
              /[?&]aff(iliate)?(_|=)/i.test(href) ||
              /[?&](ref|utm_|tracking|partner)=/i.test(href)

            if (isAffiliate) {
              postAffiliateCount++

              // ドメインを抽出
              let domain = 'unknown'
              try {
                const urlObj = new URL(href.startsWith('//') ? 'https:' + href : href)
                domain = urlObj.hostname
              } catch (e) {
                domain = href.split('/')[2] || 'unknown'
              }

              affiliateDomains[domain] = (affiliateDomains[domain] || 0) + 1

              // テキストを取得
              let linkText = ''
              block.children.forEach(child => {
                if (child.marks && child.marks.includes(mark._key)) {
                  linkText += child.text || ''
                }
              })

              postLinks.push({
                text: linkText,
                href: href,
                domain: domain
              })

              affiliateLinks.push({
                postTitle: post.title,
                postSlug: post.slug,
                text: linkText,
                href: href,
                domain: domain
              })
            }
          }
        })
      }
    })

    if (postAffiliateCount > 0) {
      postsWithAffiliates.push({
        title: post.title,
        slug: post.slug,
        count: postAffiliateCount,
        links: postLinks
      })
    }
  })

  console.log('='.repeat(80))
  console.log(`\n📈 統計サマリー:\n`)
  console.log(`アフィリエイトリンク総数: ${affiliateLinks.length}件`)
  console.log(`アフィリエイトを含む記事: ${postsWithAffiliates.length}件`)

  console.log(`\n🌐 ドメイン別内訳:\n`)
  Object.entries(affiliateDomains)
    .sort((a, b) => b[1] - a[1])
    .forEach(([domain, count]) => {
      console.log(`  ${domain}: ${count}件`)
    })

  if (postsWithAffiliates.length > 0) {
    console.log(`\n📝 アフィリエイトを含む記事 (上位10件):\n`)
    postsWithAffiliates
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   リンク数: ${post.count}件 | Slug: ${post.slug}`)
        post.links.forEach((link, j) => {
          console.log(`   [${j + 1}] ${link.text.substring(0, 50)}...`)
          console.log(`       → ${link.domain}`)
        })
        console.log('')
      })
  }
}

analyzeAffiliateLinks().catch(console.error)
