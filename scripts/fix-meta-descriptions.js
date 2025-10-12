import { createClient } from '@sanity/client'

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

const query = `*[_type == "post"] {
  _id,
  title,
  "slug": slug.current,
  metaDescription,
  excerpt
}`

// Meta Descriptionを120〜160文字に調整する関数
function adjustMetaDescription(text, minLength = 120, maxLength = 160) {
  if (!text || text.trim() === '') {
    return null
  }

  let adjusted = text.trim()

  // 文字数が足りない場合は、excerptの内容を追加
  if (adjusted.length < minLength) {
    // 何も追加せず、そのまま返す（excerptから自動生成される）
    return null
  }

  // 文字数が超過している場合は、適切な位置で切り詰める
  if (adjusted.length > maxLength) {
    // 句点や読点で切れる位置を探す
    const cutPosition = adjusted.lastIndexOf('。', maxLength)
    if (cutPosition > minLength) {
      adjusted = adjusted.substring(0, cutPosition + 1)
    } else {
      // 句点がない場合は、最大文字数で切り詰める
      adjusted = adjusted.substring(0, maxLength - 3) + '...'
    }
  }

  return adjusted
}

async function fixMetaDescriptions() {
  try {
    console.log('📊 全記事のMeta Descriptionを確認中...\n')

    const posts = await client.fetch(query)

    const toFix = []
    const errors = []

    posts.forEach(post => {
      const metaDesc = post.metaDescription || ''
      const length = metaDesc.length

      // 文字数が120未満の場合は、excerptを使用
      if (length > 0 && length < 120) {
        const excerpt = post.excerpt || ''

        // excerptが120文字以上ある場合は、それを使う
        if (excerpt.length >= 120 && excerpt.length <= 160) {
          toFix.push({
            _id: post._id,
            title: post.title,
            slug: post.slug,
            currentLength: length,
            newMetaDescription: excerpt,
            newLength: excerpt.length,
            method: 'excerptを使用'
          })
        } else if (excerpt.length > 160) {
          // excerptが160文字超の場合は切り詰める
          const adjusted = adjustMetaDescription(excerpt)
          if (adjusted) {
            toFix.push({
              _id: post._id,
              title: post.title,
              slug: post.slug,
              currentLength: length,
              newMetaDescription: adjusted,
              newLength: adjusted.length,
              method: 'excerptを切り詰め'
            })
          }
        } else {
          // metaDescriptionとexcerptを合わせる
          const combined = `${metaDesc}${excerpt}`.substring(0, 160)
          if (combined.length >= 120) {
            toFix.push({
              _id: post._id,
              title: post.title,
              slug: post.slug,
              currentLength: length,
              newMetaDescription: combined,
              newLength: combined.length,
              method: '既存とexcerptを結合'
            })
          } else {
            errors.push({
              _id: post._id,
              title: post.title,
              slug: post.slug,
              issue: 'metaDescriptionもexcerptも不足（手動修正が必要）'
            })
          }
        }
      }
    })

    console.log(`修正対象: ${toFix.length}件`)
    console.log(`手動修正が必要: ${errors.length}件\n`)

    if (toFix.length === 0) {
      console.log('✅ 修正が必要な記事はありません')
      return
    }

    console.log('🔄 Meta Descriptionを修正中...\n')

    let successCount = 0
    let failCount = 0

    for (const item of toFix) {
      try {
        await client
          .patch(item._id)
          .set({ metaDescription: item.newMetaDescription })
          .commit()

        console.log(`✅ ${item.title}`)
        console.log(`   ${item.currentLength}文字 → ${item.newLength}文字 (${item.method})`)
        successCount++
      } catch (error) {
        console.error(`❌ ${item.title}: ${error.message}`)
        failCount++
      }
    }

    console.log('\n' + '='.repeat(80))
    console.log(`\n✅ 修正成功: ${successCount}件`)
    console.log(`❌ 修正失敗: ${failCount}件`)

    if (errors.length > 0) {
      console.log(`\n⚠️  手動修正が必要な記事: ${errors.length}件`)
      errors.forEach((item, index) => {
        console.log(`${index + 1}. ${item.title} (${item.slug})`)
        console.log(`   問題: ${item.issue}`)
      })
    }

  } catch (error) {
    console.error('Error:', error)
  }
}

fixMetaDescriptions()
