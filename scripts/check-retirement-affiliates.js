#!/usr/bin/env node
/**
 * 退職関連記事の退職代行アフィリエイトリンクを検出
 */

const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false
})

async function checkRetirementAffiliates() {
  console.log('🔍 退職関連記事の退職代行アフィリエイトを検出中...\n')

  // 退職関連キーワード
  const retirementKeywords = ['退職', '辞め', '辞職', '離職', '辞める']

  // 全記事を取得
  const posts = await client.fetch(`
    *[_type == 'post' && !(_id in path('drafts.**'))]{
      _id,
      title,
      slug,
      body
    }
  `)

  const issuesFound = []

  posts.forEach(post => {
    const title = post.title || ''
    const slug = post.slug?.current || ''

    // 退職関連記事かチェック
    const isRetirementPost = retirementKeywords.some(keyword =>
      title.includes(keyword) || slug.includes(keyword)
    )

    if (!isRetirementPost) return

    // 退職代行アフィリエイトを検出
    const hasRetirementAffiliate = post.body?.some(block => {
      if (block._type === 'affiliateEmbed') {
        const html = block.html || ''
        const linkKey = block.linkKey || ''

        // 退職代行サービスのキー: miyabi, sokuyame
        if (linkKey === 'miyabi' || linkKey === 'sokuyame') {
          return true
        }

        // HTMLに退職代行のURLが含まれているか
        if (html.includes('bengo4') || html.includes('taisyokudaikou') ||
            html.includes('sokuyame') || html.includes('miyabi')) {
          return true
        }
      }
      return false
    })

    if (hasRetirementAffiliate) {
      issuesFound.push({
        title,
        slug: slug,
        url: `https://prorenata.jp/posts/${slug}`
      })
    }
  })

  console.log(`検出結果: ${issuesFound.length}件の記事で退職代行アフィリエイトを検出\n`)

  if (issuesFound.length > 0) {
    console.log('以下の記事に退職代行アフィリエイトが含まれています：\n')
    issuesFound.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.title}`)
      console.log(`   Slug: ${issue.slug}`)
      console.log(`   URL: ${issue.url}\n`)
    })
  } else {
    console.log('✅ 退職代行アフィリエイトが含まれる記事は見つかりませんでした。')
  }

  return issuesFound
}

checkRetirementAffiliates().catch(console.error)
