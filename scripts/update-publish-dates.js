const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false
})

// 2023年10月1日から2025年9月30日までの範囲
const startDate = new Date('2023-10-01')
const endDate = new Date('2025-09-30')

function getRandomDate(start, end) {
  const startTime = start.getTime()
  const endTime = end.getTime()
  const randomTime = startTime + Math.random() * (endTime - startTime)
  return new Date(randomTime)
}

async function updatePublishDates() {
  try {
    console.log('記事一覧を取得中...')

    // 全記事を取得
    const posts = await client.fetch(`
      *[_type == "post"] {
        _id,
        title,
        publishedAt,
        _createdAt
      }
    `)

    console.log(`${posts.length}件の記事が見つかりました`)

    // 各記事にランダムな公開日を設定
    for (const post of posts) {
      const randomDate = getRandomDate(startDate, endDate)
      const isoString = randomDate.toISOString()

      console.log(`更新中: ${post.title} -> ${isoString.split('T')[0]}`)

      await client
        .patch(post._id)
        .set({ publishedAt: isoString })
        .commit()
    }

    console.log('✅ 全記事の公開日を更新しました')

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

updatePublishDates()