import { createClient } from '@sanity/client'

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

// 削除対象のリンクパターン
const LINKS_TO_REMOVE = [
  'a_id=5211244', // アルバトロス転職
  // 注: 'a_id=5211256' (弁護士法人ガイア法律事務所) は 2025-12-03 に復活したため削除対象外
]

async function findAndRemoveLinks(dryRun = true) {
  console.log(`🔍 削除対象リンクを検索中...\n`)

  const query = `*[_type == "post"] {
    _id,
    _rev,
    title,
    "slug": slug.current,
    body
  }`

  const posts = await client.fetch(query)
  console.log(`総記事数: ${posts.length}件\n`)

  const affectedPosts = []

  for (const post of posts) {
    if (!post.body) continue

    let hasTargetLinks = false
    const newBody = []
    let removedLinksCount = 0

    for (const block of post.body) {
      if (block._type === 'block' && block.markDefs) {
        // リンクをチェック
        const newMarkDefs = []
        const removedMarkKeys = new Set()

        for (const mark of block.markDefs) {
          if (mark._type === 'link' && mark.href) {
            const shouldRemove = LINKS_TO_REMOVE.some(pattern =>
              mark.href.includes(pattern)
            )

            if (shouldRemove) {
              hasTargetLinks = true
              removedLinksCount++
              removedMarkKeys.add(mark._key)
              console.log(`  ❌ 削除対象: ${mark.href}`)
            } else {
              newMarkDefs.push(mark)
            }
          } else {
            newMarkDefs.push(mark)
          }
        }

        // 削除されたリンクを参照しているテキストからマークを除去
        const newChildren = block.children.map(child => {
          if (child.marks && child.marks.length > 0) {
            const newMarks = child.marks.filter(markKey => !removedMarkKeys.has(markKey))
            return { ...child, marks: newMarks }
          }
          return child
        })

        // ブロック全体が空になった場合はスキップ
        const hasContent = newChildren.some(child => child.text && child.text.trim())
        if (hasContent) {
          newBody.push({
            ...block,
            markDefs: newMarkDefs,
            children: newChildren
          })
        } else {
          console.log(`  🗑️  空ブロック削除`)
        }
      } else {
        newBody.push(block)
      }
    }

    if (hasTargetLinks) {
      affectedPosts.push({
        _id: post._id,
        _rev: post._rev,
        title: post.title,
        slug: post.slug,
        removedLinksCount,
        newBody
      })
    }
  }

  console.log(`\n📊 結果サマリー`)
  console.log(`削除対象リンクを含む記事: ${affectedPosts.length}件`)

  if (affectedPosts.length > 0) {
    console.log(`\n削除対象記事一覧:`)
    affectedPosts.forEach((post, index) => {
      console.log(`${index + 1}. ${post.title} (${post.slug})`)
      console.log(`   削除リンク数: ${post.removedLinksCount}件`)
    })
  }

  if (!dryRun && affectedPosts.length > 0) {
    console.log(`\n🚀 Sanityデータベースを更新中...`)

    for (const post of affectedPosts) {
      try {
        await client
          .patch(post._id)
          .set({ body: post.newBody })
          .commit()

        console.log(`✅ 更新完了: ${post.title}`)
      } catch (error) {
        console.error(`❌ 更新失敗: ${post.title}`, error.message)
      }
    }

    console.log(`\n✅ すべての更新が完了しました`)
  } else if (dryRun) {
    console.log(`\n⚠️  ドライランモード: 実際の削除は行いませんでした`)
    console.log(`実際に削除するには: node scripts/remove-affiliate-links.js --apply`)
  }
}

const dryRun = !process.argv.includes('--apply')
findAndRemoveLinks(dryRun).catch(console.error)
