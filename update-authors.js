#!/usr/bin/env node

const { createClient } = require('@sanity/client')

// Sanity client setup
const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

async function updateAllAuthors() {
  try {
    console.log('🔍 現在の記事とAuthor情報を取得中...')

    // まず全記事を確認
    const allPosts = await client.fetch(`*[_type == "post"] {
      _id,
      title,
      "author": author->{_id, name}
    }`)

    console.log(`📊 総記事数: ${allPosts.length}`)

    // Author情報の確認
    const currentAuthors = allPosts.map(post => post.author).filter(Boolean)
    const uniqueAuthors = [...new Set(currentAuthors.map(a => a?.name))].filter(Boolean)
    console.log('📝 現在のAuthor:', uniqueAuthors)

    // ProReNata編集部のAuthorを探すか作成
    let prorenataAuthor = await client.fetch(`*[_type == "author" && name == "ProReNata編集部"][0]`)

    if (!prorenataAuthor) {
      console.log('👥 ProReNata編集部のAuthorを作成中...')
      prorenataAuthor = await client.create({
        _type: 'author',
        name: 'ProReNata編集部',
        slug: {
          current: 'prorenata-editorial'
        },
        bio: [
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: '看護助手の現場経験を活かし、実践的で役立つ情報をお届けします。'
              }
            ]
          }
        ]
      })
      console.log('✅ ProReNata編集部のAuthor作成完了:', prorenataAuthor._id)
    } else {
      console.log('✅ ProReNata編集部のAuthor確認完了:', prorenataAuthor._id)
    }

    // 全記事のAuthorを更新
    console.log('🔄 全記事のAuthorを更新中...')
    let updateCount = 0

    for (const post of allPosts) {
      try {
        await client
          .patch(post._id)
          .set({
            author: {
              _type: 'reference',
              _ref: prorenataAuthor._id
            }
          })
          .commit()

        updateCount++
        console.log(`✅ 更新完了: ${post.title}`)
      } catch (error) {
        console.error(`❌ 更新失敗: ${post.title}`, error.message)
      }
    }

    console.log(`\n🎉 Author更新完了!`)
    console.log(`📊 更新済み記事数: ${updateCount}/${allPosts.length}`)
    console.log(`👥 全記事のAuthor: ProReNata編集部`)

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)

    if (error.message.includes('token')) {
      console.log('\n💡 解決方法:')
      console.log('export SANITY_API_TOKEN="your_api_token_here"')
      console.log('の後、再実行してください。')
    }
  }
}

// APIトークンの確認
if (!process.env.SANITY_API_TOKEN || process.env.SANITY_API_TOKEN === 'your_sanity_token') {
  console.log('❌ SANITY_API_TOKENが設定されていません。')
  console.log('💡 以下のコマンドで設定してください:')
  console.log('export SANITY_API_TOKEN="your_actual_api_token"')
  process.exit(1)
}

updateAllAuthors()