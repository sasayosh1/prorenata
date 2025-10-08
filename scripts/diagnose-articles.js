/**
 * 記事診断スクリプト - 重複スラグと欠落コンテンツをチェック
 */

const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

async function diagnoseDuplicateSlugs() {
  console.log('\n🔍 重複スラグをチェック中...\n')

  const posts = await client.fetch(`*[_type == "post"] {
    _id,
    title,
    "slug": slug.current
  } | order(slug asc)`)

  const slugMap = {}
  posts.forEach(post => {
    if (!slugMap[post.slug]) {
      slugMap[post.slug] = []
    }
    slugMap[post.slug].push(post)
  })

  const duplicates = Object.entries(slugMap).filter(([_, posts]) => posts.length > 1)

  if (duplicates.length === 0) {
    console.log('✅ 重複スラグなし')
  } else {
    console.log(`⚠️  重複スラグ検出: ${duplicates.length}件\n`)
    duplicates.forEach(([slug, posts]) => {
      console.log(`\n📌 スラグ: "${slug}" (${posts.length}件)`)
      posts.forEach(post => {
        console.log(`   - ${post.title} (${post._id})`)
      })
    })
  }

  return duplicates
}

async function diagnoseMissingBody() {
  console.log('\n🔍 本文欠落記事をチェック中...\n')

  const posts = await client.fetch(`*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    "hasBody": defined(body[0])
  }`)

  const missingBody = posts.filter(post => !post.hasBody)

  if (missingBody.length === 0) {
    console.log('✅ 全記事に本文あり')
  } else {
    console.log(`⚠️  本文欠落: ${missingBody.length}件\n`)
    missingBody.forEach(post => {
      console.log(`   - ${post.title} (${post.slug})`)
    })
  }

  return missingBody
}

async function diagnoseAll() {
  try {
    console.log('=' .repeat(60))
    console.log('🏥 記事診断レポート')
    console.log('=' .repeat(60))

    const duplicates = await diagnoseDuplicateSlugs()
    const missingBody = await diagnoseMissingBody()

    console.log('\n' + '=' .repeat(60))
    console.log('📊 サマリー')
    console.log('=' .repeat(60))
    console.log(`重複スラグ: ${duplicates.length}件`)
    console.log(`本文欠落: ${missingBody.length}件`)
    console.log('=' .repeat(60) + '\n')

    return { duplicates, missingBody }
  } catch (error) {
    console.error('❌ エラー:', error.message)
    throw error
  }
}

if (require.main === module) {
  diagnoseAll().catch(console.error)
}

module.exports = { diagnoseDuplicateSlugs, diagnoseMissingBody, diagnoseAll }
