require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

// タイトルからSEO最適化されたスラッグを生成
function generateSlug(title) {
  return title
    .replace(/【|】/g, '') // 【】を削除
    .replace(/[・、。！？]/g, '-') // 日本語句読点をハイフンに
    .replace(/\s+/g, '-') // スペースをハイフンに
    .replace(/[^\w\-ぁ-んァ-ヶー一-龠]/g, '') // 英数字・ハイフン・日本語のみ残す
    .toLowerCase()
    .replace(/\-+/g, '-') // 連続ハイフンを単一に
    .replace(/^\-|\-$/g, '') // 前後のハイフンを削除
    .substring(0, 96) // 長さ制限
}

// 内部リンクのスラッグマッピングを作成
const slugMapping = {
  'nursing-assistant-scope-of-work-nurses': 'nursing-assistant-scope-of-work-1756352898821',
  'nursing-assistant-career-up-qualifications': 'nursing-assistant-career-step-up-1756352815055',
  'nursing-assistant-how-to-quit': 'nursing-assistant-quit-reason-1756352956267',
  'nursing-assistant-tough-night-shift': 'nursing-assistant-night-shift-tough-1756352975399',
  'nursing-assistant-night-shift-only-pros-cons': 'night-shift-only-nursing-assistant-1756353024542',
  'nursing-assistant-night-shift-income': 'nursing-assistant-night-shift-allowance-1756353038992',
  'nursing-assistant-part-timer-daily-flow': 'nursing-assistant-part-time-daily-routine-1756353072698'
}

async function fixMissingSlug() {
  console.log('=' .repeat(60))
  console.log('🔧 スラッグ未設定記事の修正')
  console.log('=' .repeat(60))
  console.log()

  const posts = await client.fetch(`*[_type == "post" && !defined(slug.current)] {
    _id,
    title
  }`)

  console.log(`未設定記事: ${posts.length}件\n`)

  for (const post of posts) {
    const newSlug = generateSlug(post.title)

    await client
      .patch(post._id)
      .set({
        slug: {
          _type: 'slug',
          current: newSlug
        }
      })
      .commit()

    console.log(`✅ ${post.title}`)
    console.log(`   スラッグ: ${newSlug}\n`)
  }

  console.log(`修正完了: ${posts.length}件\n`)
}

async function fixBrokenInternalLinks() {
  console.log('=' .repeat(60))
  console.log('🔧 壊れた内部リンクの修正')
  console.log('=' .repeat(60))
  console.log()

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
      if (block._type !== 'block' || !block.markDefs) return

      const newMarkDefs = block.markDefs.map(mark => {
        if (mark._type === 'link' && mark.href) {
          const href = mark.href

          // 内部リンク判定
          if (href.startsWith('/posts/')) {
            const oldSlug = href.replace('/posts/', '')

            // マッピングに存在する場合は新しいスラッグに置き換え
            if (slugMapping[oldSlug]) {
              modified = true
              return {
                ...mark,
                href: `/posts/${slugMapping[oldSlug]}`
              }
            }
          }
        }
        return mark
      })

      newBody[blockIndex] = {
        ...block,
        markDefs: newMarkDefs
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

async function validateAffiliateLinks() {
  console.log('=' .repeat(60))
  console.log('🔍 アフィリエイトリンク検証')
  console.log('=' .repeat(60))
  console.log()

  const posts = await client.fetch(`*[_type == "post"] {
    _id,
    title,
    body
  }`)

  const brokenLinks = []
  const affiliateDomains = [
    'moshimo',
    'tcs-asp.net',
    'a8.net',
    'rakuten',
    'amazon'
  ]

  for (const post of posts) {
    if (!post.body || !Array.isArray(post.body)) continue

    post.body.forEach(block => {
      if (block._type !== 'block' || !block.markDefs) return

      block.markDefs.forEach(mark => {
        if (mark._type === 'link' && mark.href) {
          const href = mark.href.toLowerCase()
          const isAffiliate = affiliateDomains.some(domain => href.includes(domain))

          if (isAffiliate) {
            // リンクテキストが存在するか確認
            const linkedChildren = block.children?.filter(child =>
              child.marks && child.marks.includes(mark._key)
            ) || []

            const hasText = linkedChildren.some(child =>
              child.text && child.text.trim().length > 0
            )

            if (!hasText) {
              brokenLinks.push({
                article: post.title,
                href: mark.href
              })
            }
          }
        }
      })
    })
  }

  if (brokenLinks.length === 0) {
    console.log('✅ すべてのアフィリエイトリンクが正常です\n')
  } else {
    console.log(`⚠️  テキスト未設定のリンク: ${brokenLinks.length}件\n`)
    brokenLinks.forEach((link, i) => {
      console.log(`${i + 1}. ${link.article}`)
      console.log(`   URL: ${link.href}\n`)
    })
  }
}

async function main() {
  console.log('🚀 全リンク問題修正ツール\n')

  try {
    // 1. スラッグ未設定の修正
    await fixMissingSlug()

    // 2. 壊れた内部リンクの修正
    await fixBrokenInternalLinks()

    // 3. アフィリエイトリンク検証
    await validateAffiliateLinks()

    console.log('=' .repeat(60))
    console.log('✨ すべての修正完了')
    console.log('=' .repeat(60))

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
    process.exit(1)
  }
}

main()
