import { createClient } from '@sanity/client'

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

const query = `*[_type == "post" && slug.current == "nursing-assistant-quit-retirement"][0] {
  _id,
  title,
  "slug": slug.current,
  body[]{
    ...,
    _type == "image" => {
      _type,
      _key,
      asset,
      "imageUrl": asset->url,
      "metadata": asset->metadata
    }
  }
}`

async function checkImages() {
  const post = await client.fetch(query)

  if (!post) {
    console.log('❌ 記事が見つかりませんでした')
    return
  }

  console.log('記事タイトル:', post.title)
  console.log('スラッグ:', post.slug)
  console.log('\n画像を確認中...\n')

  const images = post.body.filter(block => block._type === 'image')

  if (images.length === 0) {
    console.log('❌ この記事には画像がありません')
  } else {
    console.log(`✅ 画像が ${images.length}件 見つかりました:\n`)
    images.forEach((img, index) => {
      console.log(`画像 ${index + 1}:`)
      console.log(`  URL: ${img.imageUrl || '未設定'}`)
      console.log(`  Asset ID: ${img.asset?._ref || '未設定'}`)
      console.log('')
    })
  }

  console.log(`\n記事全体のブロック数: ${post.body.length}件`)
  console.log('ブロックタイプの内訳:')
  const blockTypes = {}
  post.body.forEach(block => {
    blockTypes[block._type] = (blockTypes[block._type] || 0) + 1
  })
  Object.entries(blockTypes).forEach(([type, count]) => {
    console.log(`  - ${type}: ${count}件`)
  })
}

checkImages().catch(console.error)
