#!/usr/bin/env node

const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

async function finalAuthorUpdate() {
  try {
    console.log('🔍 残りの未設定記事を取得中...')

    // 未設定またはProReNata編集部以外の記事を取得
    const remainingPosts = await client.fetch(`*[_type == "post" && (!defined(author) || author->name != "ProReNata編集部")] {
      _id,
      title,
      "author": author->{_id, name}
    }`)

    console.log(`📊 更新対象記事数: ${remainingPosts.length}`)

    if (remainingPosts.length === 0) {
      console.log('🎉 全記事のAuthor更新が完了しています！')
      return
    }

    // ProReNata編集部のAuthor ID
    const prorenataAuthorId = 'aefbe415-6b34-4085-97b2-30b2aa12a6fa'

    console.log('🔄 残り記事を一括更新中...')

    // 並列更新で高速化
    const updatePromises = remainingPosts.map(async (post) => {
      try {
        await client
          .patch(post._id)
          .set({
            author: {
              _type: 'reference',
              _ref: prorenataAuthorId
            }
          })
          .commit()

        console.log(`✅ 更新: ${post.title}`)
        return { success: true, title: post.title }
      } catch (error) {
        console.error(`❌ 失敗: ${post.title}`, error.message)
        return { success: false, title: post.title, error: error.message }
      }
    })

    const results = await Promise.all(updatePromises)
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    console.log(`\n🎉 一括更新完了!`)
    console.log(`✅ 成功: ${successful}記事`)
    console.log(`❌ 失敗: ${failed}記事`)

    if (failed > 0) {
      console.log('\n❌ 失敗した記事:')
      results.filter(r => !r.success).forEach(r => {
        console.log(`  ${r.title}: ${r.error}`)
      })
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

finalAuthorUpdate()