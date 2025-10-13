import { createClient } from '@sanity/client'

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

const query = `*[_type == "post"] {
  body
}`

async function listUniqueAffiliateLinks() {
  const posts = await client.fetch(query)

  const uniqueLinks = new Map()

  posts.forEach(post => {
    if (!post.body) return

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
              // テキストを取得
              let linkText = ''
              block.children.forEach(child => {
                if (child.marks && child.marks.includes(mark._key)) {
                  linkText += child.text || ''
                }
              })

              if (!uniqueLinks.has(href)) {
                uniqueLinks.set(href, {
                  text: linkText,
                  count: 1
                })
              } else {
                uniqueLinks.get(href).count++
              }
            }
          }
        })
      }
    })
  })

  console.log('📋 ユニークなアフィリエイトリンク一覧\n')
  console.log(`総数: ${uniqueLinks.size}件\n`)
  console.log('='.repeat(80))

  const sortedLinks = Array.from(uniqueLinks.entries())
    .sort((a, b) => b[1].count - a[1].count)

  sortedLinks.forEach(([href, data], index) => {
    console.log(`\n${index + 1}. ${data.text}`)
    console.log(`   使用回数: ${data.count}回`)
    console.log(`   URL: ${href}`)
  })
}

listUniqueAffiliateLinks().catch(console.error)
