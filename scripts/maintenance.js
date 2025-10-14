/**
 * 記事メンテナンスツール
 *
 * 記事の品質チェック・修正支援ツール
 * - 古い記事の検出
 * - メタデータ不足の記事検出
 * - 画像なし記事の検出
 * - 文字数不足の記事検出
 */

const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

/**
 * 古い記事を検出（6ヶ月以上更新なし）
 */
async function findOldPosts(months = 6) {
  const monthsAgo = new Date()
  monthsAgo.setMonth(monthsAgo.getMonth() - months)
  const cutoffDate = monthsAgo.toISOString()

  const query = `*[_type == "post"
    && _updatedAt < $cutoffDate
  ] | order(_updatedAt asc) {
    _id,
    title,
    "slug": slug.current,
    _createdAt,
    _updatedAt,
    publishedAt,
    "categories": categories[]->title
  }`

  try {
    const posts = await client.fetch(query, { cutoffDate })

    console.log(`\n📅 ${months}ヶ月以上更新されていない記事: ${posts.length}件\n`)

    if (posts.length > 0) {
      posts.slice(0, 10).forEach((post, i) => {
        const lastUpdate = new Date(post._updatedAt)
        const daysSince = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))

        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   最終更新: ${daysSince}日前 (${lastUpdate.toLocaleDateString('ja-JP')})`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}\n`)
      })

      if (posts.length > 10) {
        console.log(`   ... 他${posts.length - 10}件\n`)
      }
    }

    return posts
  } catch (error) {
    console.error('❌ エラー:', error.message)
    return []
  }
}

/**
 * メタデータ不足の記事を検出
 */
async function findPostsMissingMetadata() {
  const query = `*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    metaDescription,
    "categories": categories[]->title
  }`

  try {
    const posts = await client.fetch(query)

    const issues = {
      noExcerpt: [],
      noMetaDescription: []
    }

    posts.forEach(post => {
      if (!post.excerpt) issues.noExcerpt.push(post)
      if (!post.metaDescription) issues.noMetaDescription.push(post)
    })

    console.log('\n📋 メタデータ不足の記事:\n')
    console.log(`  ⚠️  Excerpt なし: ${issues.noExcerpt.length}件`)
    console.log(`  ⚠️  Meta Description なし: ${issues.noMetaDescription.length}件`)

    const totalIssues = new Set([
      ...issues.noExcerpt.map(p => p._id),
      ...issues.noMetaDescription.map(p => p._id)
    ]).size

    console.log(`\n  📊 合計: ${totalIssues}件の記事に何らかのメタデータ不足\n`)

    // 最も問題が多い記事TOP5を表示
    const postIssueCount = {}
    posts.forEach(post => {
      let count = 0
      if (!post.excerpt) count++
      if (!post.metaDescription) count++
      if (count > 0) {
        postIssueCount[post._id] = { post, count }
      }
    })

    const sorted = Object.values(postIssueCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    if (sorted.length > 0) {
      console.log('🎯 優先対応が必要な記事（TOP5）:\n')
      sorted.forEach((item, i) => {
        const { post, count } = item
        const missing = []
        if (!post.excerpt) missing.push('Excerpt')
        if (!post.metaDescription) missing.push('Meta Description')

        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   不足項目(${count}): ${missing.join(', ')}`)
        console.log(`   URL: /posts/${post.slug}\n`)
      })
    }

    return issues
  } catch (error) {
    console.error('❌ エラー:', error.message)
    return null
  }
}

/**
 * 画像なし記事を検出
 */
async function findPostsWithoutImages() {
  const query = `*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    mainImage,
    "hasBodyImages": count(body[_type == "image"]) > 0,
    "categories": categories[]->title
  }`

  try {
    const posts = await client.fetch(query)

    const noMainImage = posts.filter(p => !p.mainImage)
    const noBodyImages = posts.filter(p => !p.hasBodyImages)
    const noImages = posts.filter(p => !p.mainImage && !p.hasBodyImages)

    console.log('\n🖼️  画像なしの記事:\n')
    console.log(`  ⚠️  メイン画像なし: ${noMainImage.length}件`)
    console.log(`  ⚠️  本文画像なし: ${noBodyImages.length}件`)
    console.log(`  🔴 画像が全くなし: ${noImages.length}件\n`)

    if (noImages.length > 0) {
      console.log('🎯 画像が全くない記事（最大10件）:\n')
      noImages.slice(0, 10).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}\n`)
      })
    }

    return { noMainImage, noBodyImages, noImages }
  } catch (error) {
    console.error('❌ エラー:', error.message)
    return null
  }
}

/**
 * 文字数不足の記事を検出
 */
async function findShortPosts(minChars = 1500) {
  const query = `*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body,
    "categories": categories[]->title
  }`

  try {
    const posts = await client.fetch(query)
    const shortPosts = []

    posts.forEach(post => {
      if (!post.body || !Array.isArray(post.body)) {
        shortPosts.push({ ...post, charCount: 0 })
        return
      }

      let charCount = 0
      post.body.forEach(block => {
        if (block._type === 'block' && block.children) {
          block.children.forEach(child => {
            if (child.text) {
              charCount += child.text.length
            }
          })
        }
      })

      if (charCount < minChars) {
        shortPosts.push({ ...post, charCount })
      }
    })

    shortPosts.sort((a, b) => a.charCount - b.charCount)

    console.log(`\n📏 文字数不足の記事（${minChars}文字未満）: ${shortPosts.length}件\n`)

    if (shortPosts.length > 0) {
      console.log('🎯 文字数が特に少ない記事（TOP10）:\n')
      shortPosts.slice(0, 10).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   文字数: ${post.charCount}文字`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}\n`)
      })
    }

    return shortPosts
  } catch (error) {
    console.error('❌ エラー:', error.message)
    return []
  }
}

/**
 * 次のステップセクションがない記事を検出
 */
async function findPostsWithoutNextSteps() {
  const query = `*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body,
    _createdAt,
    "categories": categories[]->title
  }`

  try {
    const posts = await client.fetch(query)
    const missingNextSteps = []

    posts.forEach(post => {
      if (!post.body || !Array.isArray(post.body)) {
        missingNextSteps.push(post)
        return
      }

      // 「次のステップ」H2見出しの検出
      const hasNextStepsH2 = post.body.some(block =>
        block._type === 'block' &&
        block.style === 'h2' &&
        block.children?.some(child =>
          child.text?.includes('次のステップ')
        )
      )

      if (!hasNextStepsH2) {
        missingNextSteps.push(post)
      }
    })

    // 作成日でソート（新しい記事順）
    missingNextSteps.sort((a, b) => new Date(b._createdAt) - new Date(a._createdAt))

    console.log(`\n🔗 「次のステップ」セクションがない記事: ${missingNextSteps.length}件\n`)

    if (missingNextSteps.length > 0) {
      console.log('🎯 最近作成された記事で「次のステップ」がない記事（TOP15）:\n')
      missingNextSteps.slice(0, 15).forEach((post, i) => {
        const createdDate = new Date(post._createdAt)
        const daysAgo = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24))

        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   作成日: ${daysAgo}日前 (${createdDate.toLocaleDateString('ja-JP')})`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}\n`)
      })

      if (missingNextSteps.length > 15) {
        console.log(`   ... 他${missingNextSteps.length - 15}件\n`)
      }
    }

    return missingNextSteps
  } catch (error) {
    console.error('❌ エラー:', error.message)
    return []
  }
}

/**
 * 総合レポートを生成
 */
async function generateReport() {
  console.log('🔍 ProReNata 記事品質レポート')
  console.log('='.repeat(60))

  const oldPosts = await findOldPosts(6)
  console.log('='.repeat(60))

  const metadataIssues = await findPostsMissingMetadata()
  console.log('='.repeat(60))

  const imageIssues = await findPostsWithoutImages()
  console.log('='.repeat(60))

  const shortPosts = await findShortPosts(1500)
  console.log('='.repeat(60))

  const missingNextSteps = await findPostsWithoutNextSteps()
  console.log('='.repeat(60))

  // サマリー
  console.log('\n📊 サマリー\n')
  console.log(`  古い記事（6ヶ月以上更新なし）: ${oldPosts.length}件`)

  if (metadataIssues) {
    const metadataTotal = new Set([
      ...metadataIssues.noExcerpt.map(p => p._id),
      ...metadataIssues.noMetaDescription.map(p => p._id)
    ]).size
    console.log(`  メタデータ不足: ${metadataTotal}件`)
  }

  if (imageIssues) {
    console.log(`  画像が全くなし: ${imageIssues.noImages.length}件`)
  }

  console.log(`  文字数不足（<1500文字）: ${shortPosts.length}件`)
  console.log(`  「次のステップ」セクションなし: ${missingNextSteps.length}件`)

  console.log('\n='.repeat(60))
}

// CLI実行
if (require.main === module) {
  const args = process.argv.slice(2)
  const command = args[0]

  switch (command) {
    case 'old':
      const months = parseInt(args[1]) || 6
      findOldPosts(months).catch(console.error)
      break

    case 'metadata':
      findPostsMissingMetadata().catch(console.error)
      break

    case 'images':
      findPostsWithoutImages().catch(console.error)
      break

    case 'short':
      const minChars = parseInt(args[1]) || 1500
      findShortPosts(minChars).catch(console.error)
      break

    case 'nextsteps':
      findPostsWithoutNextSteps().catch(console.error)
      break

    case 'report':
      generateReport().catch(console.error)
      break

    default:
      console.log(`
📝 ProReNata 記事メンテナンスツール

使い方:
  node scripts/maintenance.js <コマンド> [オプション]

コマンド:
  old [月数]          古い記事を検出（デフォルト: 6ヶ月）
  metadata            メタデータ不足の記事を検出
  images              画像なしの記事を検出
  short [文字数]      文字数不足の記事を検出（デフォルト: 1500文字）
  nextsteps           「次のステップ」セクションがない記事を検出
  report              総合レポートを生成

例:
  node scripts/maintenance.js old 3          # 3ヶ月以上更新なしの記事
  node scripts/maintenance.js short 2000     # 2000文字未満の記事
  node scripts/maintenance.js nextsteps      # 次のステップなしの記事
  node scripts/maintenance.js report         # 全体レポート

環境変数:
  SANITY_API_TOKEN が必要です
      `)
  }
}

module.exports = {
  findOldPosts,
  findPostsMissingMetadata,
  findPostsWithoutImages,
  findShortPosts,
  findPostsWithoutNextSteps,
  generateReport
}
