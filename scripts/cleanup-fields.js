/**
 * 不要なフィールドをクリーンアップ
 * metaTitle, focusKeyword, relatedKeywords を削除
 */

const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

async function cleanupFields() {
  console.log('\n🧹 不要なフィールドをクリーンアップ中...\n')

  try {
    const posts = await client.fetch(`*[_type == "post"] { _id, title }`)

    console.log(`📊 対象記事: ${posts.length}件\n`)

    let updated = 0
    for (const post of posts) {
      await client
        .patch(post._id)
        .unset(['metaTitle', 'focusKeyword', 'relatedKeywords'])
        .commit()

      updated++
      console.log(`✅ ${post.title}`)
    }

    console.log(`\n✅ 完了: ${updated}件の記事から不要フィールドを削除しました`)
  } catch (error) {
    console.error('❌ エラー:', error.message)
  }
}

if (require.main === module) {
  cleanupFields().catch(console.error)
}

module.exports = { cleanupFields }
