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

async function fixBrokenLinks() {
  const line = '='.repeat(60)
  console.log(line)
  console.log('🔧 Amazon/楽天リンクの修正')
  console.log(line)
  console.log()

  const brokenLinksFile = require('path').resolve(__dirname, '../internal-links-analysis/broken-amazon-rakuten-links.json')
  const brokenLinks = JSON.parse(fs.readFileSync(brokenLinksFile, 'utf8'))

  // グループ化: 記事ごとに処理
  const postMap = new Map()
  for (const link of brokenLinks) {
    if (!postMap.has(link._id)) {
      postMap.set(link._id, [])
    }
    postMap.get(link._id).push(link)
  }

  console.log(`修正対象: ${postMap.size}記事、${brokenLinks.length}箇所\n`)

  let fixedPosts = 0
  let fixedLinks = 0

  for (const [postId, linksInPost] of postMap.entries()) {
    try {
      // 記事を取得
      const post = await client.fetch('*[_type == "post" && _id == $id][0] { _id, title, body }', { id: postId })

      if (!post || !post.body) {
        console.log(`⚠️  記事が見つかりません: ${postId}`)
        continue
      }

      console.log(`📝 ${post.title}`)

      let modified = false
      const newBody = [...post.body]

      // この記事内の全ての壊れたリンクを修正
      for (const brokenLink of linksInPost) {
        const blockIndex = brokenLink.blockIndex
        const block = newBody[blockIndex]

        if (!block || block._type !== 'block') continue

        // markDefsを確認
        if (!block.markDefs || block.markDefs.length === 0) continue

        // 新しいchildrenを作成
        const newChildren = block.children.map(child => {
          if (child._type !== 'span') return child

          // marksがオブジェクトの配列になっている場合
          if (child.marks && Array.isArray(child.marks) && child.marks.length > 0) {
            const firstMark = child.marks[0]

            // marksがオブジェクト形式の場合（壊れている）
            if (typeof firstMark === 'object' && firstMark._type === 'link') {
              const href = firstMark.href

              // markDefsから対応するキーを見つける
              const matchingMarkDef = block.markDefs.find(def =>
                def._type === 'link' && def.href === href
              )

              if (matchingMarkDef) {
                // 正しい形式に修正: markDefsのキーを参照
                return {
                  ...child,
                  marks: [matchingMarkDef._key]
                }
              }
            }
          }

          return child
        })

        // ブロックを更新
        newBody[blockIndex] = {
          ...block,
          children: newChildren
        }

        modified = true
        fixedLinks++
        console.log(`   ✅ ブロック ${blockIndex} 修正`)
      }

      if (modified) {
        await client.patch(postId).set({ body: newBody }).commit()
        fixedPosts++
        console.log()
      }

    } catch (error) {
      console.error(`❌ エラー: ${linksInPost[0].title}`)
      console.error(`   ${error.message}`)
      console.log()
    }
  }

  console.log(line)
  console.log('📊 修正完了')
  console.log(line)
  console.log(`修正記事数: ${fixedPosts}/${postMap.size}`)
  console.log(`修正リンク数: ${fixedLinks}/${brokenLinks.length}`)
  console.log()
}

fixBrokenLinks().catch(console.error)
