#!/usr/bin/env node

const { createClient } = require('@sanity/client')

// Sanity client setup (read-only)
const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false
})

async function checkCurrentAuthors() {
  try {
    console.log('🔍 現在の記事とAuthor情報を確認中...')

    // 全記事のAuthor情報を取得
    const allPosts = await client.fetch(`*[_type == "post"] {
      _id,
      title,
      "author": author->{_id, name, slug}
    }`)

    console.log(`📊 総記事数: ${allPosts.length}`)

    // Author別の記事数を集計
    const authorStats = {}
    allPosts.forEach(post => {
      const authorName = post.author?.name || '未設定'
      authorStats[authorName] = (authorStats[authorName] || 0) + 1
    })

    console.log('\n📝 現在のAuthor別記事数:')
    Object.entries(authorStats).forEach(([author, count]) => {
      console.log(`  ${author}: ${count}記事`)
    })

    // 全Authorリストも確認
    const allAuthors = await client.fetch(`*[_type == "author"] {
      _id,
      name,
      slug
    }`)

    console.log('\n👥 登録済みAuthor一覧:')
    allAuthors.forEach(author => {
      console.log(`  ${author.name} (ID: ${author._id})`)
    })

    // ProReNata編集部があるか確認
    const prorenataAuthor = allAuthors.find(a => a.name === 'ProReNata編集部')
    if (prorenataAuthor) {
      console.log('\n✅ ProReNata編集部は既に存在します')
    } else {
      console.log('\n❗ ProReNata編集部は未作成です')
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

checkCurrentAuthors()