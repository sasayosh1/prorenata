/* eslint-disable no-console */
const { createClient } = require('@sanity/client')

const CATEGORY_MASTER = [
  { title: '仕事', slug: 'work', order: 1 },
  { title: '給与', slug: 'salary', order: 2 },
  { title: '資格', slug: 'license', order: 3 },
  { title: '転職', slug: 'career-change', order: 4 },
  { title: '退職', slug: 'resignation', order: 5 },
  { title: '心身', slug: 'wellbeing', order: 6 },
  { title: '体験', slug: 'stories', order: 7 },
]

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN,
  useCdn: false,
})

async function upsertCategory({ title, slug, order }) {
  const existing = await client.fetch(
    `*[_type == "category" && (slug.current == $slug || title == $title)][0]`,
    { slug, title }
  )

  if (existing) {
    await client
      .patch(existing._id)
      .set({
        title,
        slug: { _type: 'slug', current: slug },
        order,
      })
      .commit()
    console.log(`更新: ${title} (${existing._id})`)
    return existing._id
  }

  const docId = `category-${slug}`
  await client
    .createIfNotExists({
      _id: docId,
      _type: 'category',
      title,
      slug: { _type: 'slug', current: slug },
      order,
    })
  console.log(`作成: ${title} (${docId})`)
  return docId
}

async function main() {
  if (!client.config().token) {
    throw new Error('SANITY_WRITE_TOKEN もしくは SANITY_API_TOKEN が必要です')
  }

  console.log('🔧 カテゴリの同期を開始します')
  const existing = await client.fetch(`*[_type == "category"]{ _id, title, "slug": slug.current }`)

  const masterIds = []
  for (const category of CATEGORY_MASTER) {
    const id = await upsertCategory(category)
    masterIds.push(id)
  }

  const removable = existing.filter(
    doc => !CATEGORY_MASTER.some(cat => cat.slug === doc.slug || cat.title === doc.title)
  )

  if (removable.length > 0) {
    console.log(`🗑 不要カテゴリを削除します (${removable.length}件)`)
    for (const doc of removable) {
      await client.delete(doc._id).catch(error => {
        console.warn(`  ⚠️ ${doc._id} の削除に失敗: ${error.message}`)
      })
    }
  } else {
    console.log('🧹 削除対象のカテゴリはありません')
  }

  console.log('✅ カテゴリ同期が完了しました')
  console.log(`   アクティブカテゴリ: ${masterIds.length}件`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
