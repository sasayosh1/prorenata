require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const fs = require('fs')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

async function removeDuplicates() {
  const line = '='.repeat(60)
  console.log(line)
  console.log('🔍 重複記事の削除')
  console.log(line)
  console.log()

  const posts = await client.fetch(`*[_type == 'post'] {
    _id,
    title,
    'slug': slug.current,
    publishedAt,
    _createdAt,
    _updatedAt
  } | order(title asc)`)

  // タイトルでグループ化
  const titleGroups = new Map()
  for (const post of posts) {
    if (!titleGroups.has(post.title)) {
      titleGroups.set(post.title, [])
    }
    titleGroups.get(post.title).push(post)
  }

  // 重複があるグループを抽出
  const duplicateGroups = Array.from(titleGroups.entries())
    .filter(([_, posts]) => posts.length > 1)

  console.log(`重複記事グループ: ${duplicateGroups.length}件`)
  console.log(`総重複記事数: ${duplicateGroups.reduce((sum, [_, posts]) => sum + posts.length, 0)}件`)
  console.log()

  const toDelete = []
  const toKeep = []

  for (const [title, duplicatePosts] of duplicateGroups) {
    // 作成日で並び替え（新しい順）
    const sorted = duplicatePosts.sort((a, b) =>
      new Date(b._createdAt) - new Date(a._createdAt)
    )

    const newest = sorted[0]
    const oldest = sorted.slice(1)

    console.log('📄 ' + title)
    console.log('   保持: ' + newest.slug + ' (作成: ' + newest._createdAt.substring(0, 10) + ')')

    for (const old of oldest) {
      console.log('   削除: ' + old.slug + ' (作成: ' + old._createdAt.substring(0, 10) + ')')
      toDelete.push(old)
    }
    console.log()

    toKeep.push(newest)
  }

  console.log(line)
  console.log('📊 実行サマリー')
  console.log(line)
  console.log(`保持する記事: ${toKeep.length}件`)
  console.log(`削除する記事: ${toDelete.length}件`)
  console.log()

  // レポート保存
  const reportPath = require('path').resolve(__dirname, '../internal-links-analysis/duplicate-posts-report.json')
  fs.writeFileSync(reportPath, JSON.stringify({
    toDelete: toDelete.map(p => ({
      _id: p._id,
      title: p.title,
      slug: p.slug,
      createdAt: p._createdAt,
      publishedAt: p.publishedAt
    })),
    toKeep: toKeep.map(p => ({
      _id: p._id,
      title: p.title,
      slug: p.slug,
      createdAt: p._createdAt,
      publishedAt: p.publishedAt
    }))
  }, null, 2))

  console.log(`📄 レポート保存: ${reportPath}`)
  console.log()
  console.log('⚠️  実際に削除するには --execute フラグを付けてください')
  console.log('   node scripts/remove-duplicate-posts.js --execute')
  console.log()

  // --execute フラグがある場合のみ削除実行
  if (process.argv.includes('--execute')) {
    console.log(line)
    console.log('🗑️  削除を実行中...')
    console.log(line)
    console.log()

    let deletedCount = 0

    for (const post of toDelete) {
      try {
        await client.delete(post._id)
        console.log('✅ 削除: ' + post.title + ' (' + post.slug + ')')
        deletedCount++
      } catch (error) {
        console.error('❌ エラー: ' + post.title)
        console.error('   ' + error.message)
      }
    }

    console.log()
    console.log(line)
    console.log('✨ 削除完了')
    console.log(line)
    console.log(`削除成功: ${deletedCount}/${toDelete.length}件`)
    console.log()
  }
}

removeDuplicates().catch(console.error)
