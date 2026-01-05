const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

async function cleanAuthors() {
  try {
    console.log('📋 現在のAuthor一覧を取得中...')

    // 全Authorを取得
    const authors = await client.fetch(`*[_type == "author"]{
      _id,
      name,
      slug
    }`)

    console.log(`📊 発見されたAuthor: ${authors.length}件`)
    authors.forEach((author, index) => {
      console.log(`${index + 1}. ${author.name} (ID: ${author._id})`)
    })

    // 「看護助手サポート編集部」を削除対象として特定
    const duplicateAuthors = authors.filter(author =>
      author.name === '看護助手サポート編集部'
    )

    console.log(`\n🗑️  削除対象: ${duplicateAuthors.length}件の「看護助手サポート編集部」`)

    if (duplicateAuthors.length === 0) {
      console.log('✅ 削除対象のAuthorが見つかりませんでした')
      return
    }

    // 削除実行
    for (const author of duplicateAuthors) {
      console.log(`🗑️  削除中: ${author.name} (ID: ${author._id})`)

      await client.delete(author._id)
      console.log(`✅ 削除完了: ${author.name}`)
    }

    // 最終確認
    const finalAuthors = await client.fetch(`*[_type == "author"]{
      _id,
      name,
      slug
    }`)

    console.log(`\n📊 清理後のAuthor一覧 (${finalAuthors.length}件):`)
    finalAuthors.forEach((author, index) => {
      console.log(`${index + 1}. ${author.name} (ID: ${author._id})`)
    })

    console.log('\n✅ Author清理が完了しました！')

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

cleanAuthors()