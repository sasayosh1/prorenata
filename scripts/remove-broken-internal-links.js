require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run') || args.includes('-d')

if (DRY_RUN) {
  console.log('🔍 DRY RUN MODE - No changes will be made\n')
}

// 存在しない記事へのリンクスラッグ
const brokenSlugs = [
  'nursing-assistant-scope-of-work-1756352898821',
  'nursing-assistant-career-step-up-1756352815055',
  'nursing-assistant-quit-reason-1756352956267',
  'nursing-assistant-night-shift-tough-1756352975399',
  'night-shift-only-nursing-assistant-1756353024542',
  'nursing-assistant-night-shift-allowance-1756353038992',
  'nursing-assistant-part-time-daily-routine-1756353072698'
]

async function removeBrokenLinks() {
  console.log('='.repeat(60))
  console.log('🔧 壊れた内部リンクの削除')
  console.log('='.repeat(60))
  console.log()

  const posts = await client.fetch(`*[_type == "post" && !(_id in path("drafts.**"))] {
    _id,
    title,
    body
  }`)

  let fixedCount = 0
  let removedLinksCount = 0

  for (const post of posts) {
    if (!post.body || !Array.isArray(post.body)) continue

    let modified = false
    const newBody = [...post.body]

    newBody.forEach((block, blockIndex) => {
      if (block._type !== 'block' || !block.markDefs || !block.children) return

      // 壊れたリンクのmarkDefを特定
      const brokenMarkDefs = block.markDefs.filter(mark => {
        if (mark._type === 'link' && mark.href) {
          const href = mark.href
          if (href.startsWith('/posts/')) {
            const slug = href.replace('/posts/', '')
            return brokenSlugs.includes(slug)
          }
        }
        return false
      })

      if (brokenMarkDefs.length === 0) return

      // 壊れたリンクのmarkDefキーを取得
      const brokenMarkKeys = brokenMarkDefs.map(mark => mark._key)

      // 子要素からリンクマークを削除
      const newChildren = block.children.map(child => {
        if (child.marks && child.marks.length > 0) {
          const filteredMarks = child.marks.filter(mark => !brokenMarkKeys.includes(mark))

          if (filteredMarks.length !== child.marks.length) {
            removedLinksCount++
            return {
              ...child,
              marks: filteredMarks
            }
          }
        }
        return child
      })

      // markDefsから壊れたリンクを削除
      const newMarkDefs = block.markDefs.filter(mark => !brokenMarkKeys.includes(mark._key))

      newBody[blockIndex] = {
        ...block,
        markDefs: newMarkDefs,
        children: newChildren
      }

      modified = true
    })

    if (modified) {
      if (!DRY_RUN) {
        await client.patch(post._id).set({ body: newBody }).commit()
      }
      fixedCount++
      console.log(`${DRY_RUN ? '🔍' : '✅'} ${post.title}`)
    }
  }

  console.log()
  console.log(`修正した記事: ${fixedCount}件`)
  console.log(`削除したリンク: ${removedLinksCount}件\n`)
}

async function main() {
  try {
    await removeBrokenLinks()

    console.log('='.repeat(60))
    console.log('✨ 壊れたリンク削除完了')
    console.log('='.repeat(60))

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
    process.exit(1)
  }
}

main()
