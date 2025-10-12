import { createClient } from '@sanity/client'

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

const query = `*[_type == "post"] | order(publishedAt desc) {
  _id,
  title,
  "slug": slug.current,
  metaDescription,
  excerpt,
  publishedAt
}`

async function checkMetaDescriptions() {
  try {
    const posts = await client.fetch(query)

    console.log(`Total posts: ${posts.length}\n`)

    const errors = []
    const warnings = []

    posts.forEach(post => {
      const metaDesc = post.metaDescription || ''
      const length = metaDesc.length

      // エラー: 文字数が範囲外
      if (length > 0 && (length < 120 || length > 160)) {
        errors.push({
          title: post.title,
          slug: post.slug,
          length: length,
          metaDescription: metaDesc,
          issue: length < 120 ? '文字数不足（120文字未満）' : '文字数超過（160文字超）'
        })
      }

      // 警告: Meta Descriptionが未設定
      if (!metaDesc) {
        warnings.push({
          title: post.title,
          slug: post.slug,
          issue: 'Meta Description未設定'
        })
      }
    })

    if (errors.length > 0) {
      console.log('🔴 エラーがある記事（文字数が範囲外）:')
      console.log('='.repeat(80))
      errors.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.title}`)
        console.log(`   Slug: ${item.slug}`)
        console.log(`   問題: ${item.issue}`)
        console.log(`   現在の文字数: ${item.length}文字`)
        console.log(`   内容: ${item.metaDescription.substring(0, 100)}...`)
      })
      console.log('\n')
    }

    if (warnings.length > 0) {
      console.log(`⚠️  Meta Description未設定の記事: ${warnings.length}件`)
      console.log('これらはexcerptから自動生成されます\n')
    }

    console.log('='.repeat(80))
    console.log(`\n✅ 正常: ${posts.length - errors.length - warnings.length}件`)
    console.log(`🔴 エラー（文字数範囲外）: ${errors.length}件`)
    console.log(`⚠️  未設定: ${warnings.length}件`)

  } catch (error) {
    console.error('Error:', error)
  }
}

checkMetaDescriptions()
