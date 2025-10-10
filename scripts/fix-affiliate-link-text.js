require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

async function fixAffiliateLinkText() {
  console.log('=' .repeat(60))
  console.log('🔧 アフィリエイトリンクテキスト修正')
  console.log('=' .repeat(60))
  console.log()

  const targetUrl = 'https://px.a8.net/svt/ejp?a8mat=2ZTT9A+D2Y8MQ+1W34+C8VWY'

  const posts = await client.fetch(`*[_type == "post"] {
    _id,
    title,
    body
  }`)

  let fixedCount = 0

  for (const post of posts) {
    if (!post.body || !Array.isArray(post.body)) continue

    let modified = false
    const newBody = [...post.body]

    newBody.forEach((block, blockIndex) => {
      if (block._type !== 'block' || !block.markDefs || !block.children) return

      // このブロックに対象URLのリンクがあるか確認
      const targetMarkDef = block.markDefs.find(mark =>
        mark._type === 'link' && mark.href === targetUrl
      )

      if (!targetMarkDef) return

      // リンクマークを持つ子要素を探す
      const linkedChildren = block.children.filter(child =>
        child.marks && child.marks.includes(targetMarkDef._key)
      )

      // テキストが空の場合のみ修正
      const hasText = linkedChildren.some(child =>
        child.text && child.text.trim().length > 0
      )

      if (!hasText) {
        // テキストがない場合、新しいテキストを追加
        const newChildren = [
          ...block.children.filter(child =>
            !child.marks || !child.marks.includes(targetMarkDef._key)
          ),
          {
            _type: 'span',
            _key: 'span-' + Math.random().toString(36).substr(2, 9),
            text: 'かいご畑',
            marks: [targetMarkDef._key]
          },
          {
            _type: 'span',
            _key: 'span-' + Math.random().toString(36).substr(2, 9),
            text: ' [PR]',
            marks: []
          }
        ]

        newBody[blockIndex] = {
          ...block,
          children: newChildren
        }

        modified = true
      }
    })

    if (modified) {
      await client.patch(post._id).set({ body: newBody }).commit()
      fixedCount++
      console.log(`✅ ${post.title}`)
    }
  }

  console.log()
  console.log(`修正完了: ${fixedCount}件\n`)
}

async function main() {
  try {
    await fixAffiliateLinkText()

    console.log('=' .repeat(60))
    console.log('✨ アフィリエイトリンク修正完了')
    console.log('=' .repeat(60))

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
    process.exit(1)
  }
}

main()
