require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

async function removeInternalLinks() {
  const line = '='.repeat(60)
  console.log(line)
  console.log('🗑️  内部リンク削除ツール')
  console.log(line)
  console.log()

  // 全記事を取得
  const posts = await client.fetch(`*[_type == "post"] {
    _id,
    title,
    body
  }`)

  console.log('📚 総記事数: ' + posts.length + '件\n')

  let updatedCount = 0
  let removedLinksCount = 0

  for (const post of posts) {
    if (!post.body || !Array.isArray(post.body)) continue

    let hasInternalLinks = false
    let removedInThisPost = 0

    // 内部リンク（/posts/で始まるリンク）を検出
    post.body.forEach(block => {
      if (block.markDefs && Array.isArray(block.markDefs)) {
        const internalLinks = block.markDefs.filter(mark => 
          mark._type === 'link' && 
          mark.href && 
          mark.href.startsWith('/posts/')
        )
        if (internalLinks.length > 0) {
          hasInternalLinks = true
          removedInThisPost += internalLinks.length
        }
      }
    })

    if (!hasInternalLinks) continue

    // 内部リンクを削除（リンクマークとmarkDefsを削除）
    const newBody = post.body.map(block => {
      if (!block.markDefs || !Array.isArray(block.markDefs)) return block

      // 内部リンクのmarkDefを特定
      const internalLinkKeys = block.markDefs
        .filter(mark => mark._type === 'link' && mark.href && mark.href.startsWith('/posts/'))
        .map(mark => mark._key)

      if (internalLinkKeys.length === 0) return block

      // markDefsから内部リンクを削除
      const newMarkDefs = block.markDefs.filter(mark => !internalLinkKeys.includes(mark._key))

      // childrenからリンクマークを削除
      const newChildren = block.children.map(child => {
        if (!child.marks || !Array.isArray(child.marks)) return child

        const newMarks = child.marks.filter(mark => !internalLinkKeys.includes(mark))
        
        return {
          ...child,
          marks: newMarks
        }
      })

      return {
        ...block,
        markDefs: newMarkDefs,
        children: newChildren
      }
    })

    // Sanityに更新
    try {
      await client
        .patch(post._id)
        .set({ body: newBody })
        .commit()

      console.log('✅ ' + post.title + ' (' + removedInThisPost + '個のリンク削除)')
      updatedCount++
      removedLinksCount += removedInThisPost
    } catch (error) {
      console.error('❌ エラー: ' + post.title)
      console.error('   ' + error.message)
    }
  }

  console.log()
  console.log(line)
  console.log('📊 実行結果')
  console.log(line)
  console.log('✅ 更新記事数: ' + updatedCount + '件')
  console.log('🗑️  削除リンク総数: ' + removedLinksCount + '個')
  console.log()
  console.log('✨ 完了！')
  console.log()
}

removeInternalLinks().catch(console.error)
