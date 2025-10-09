/**
 * リンク検証スクリプト (SEO/クローラー対策)
 *
 * 機能:
 * - 全記事の存在確認
 * - 関連記事リンクの有効性チェック
 * - 内部リンクの検証
 * - 404エラーの検出
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://prorenata.jp'

async function getAllPosts() {
  console.log('📚 全記事を取得中...\n')

  const posts = await client.fetch(`*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    categories,
    publishedAt,
    _createdAt,
    body
  }`)

  console.log(`✅ 取得完了: ${posts.length}件\n`)
  return posts
}

async function validateArticleLinks(posts) {
  console.log('🔗 記事リンクを検証中...\n')

  const slugSet = new Set(posts.map(p => p.slug))
  const errors = []

  // 各記事のスラッグが有効か確認
  posts.forEach(post => {
    if (!post.slug) {
      errors.push({
        type: 'MISSING_SLUG',
        article: post.title,
        message: 'スラッグが未設定です'
      })
    }

    if (post.slug && post.slug.includes(' ')) {
      errors.push({
        type: 'INVALID_SLUG',
        article: post.title,
        slug: post.slug,
        message: 'スラッグに空白が含まれています'
      })
    }
  })

  console.log(`  チェック完了: ${posts.length}件`)
  console.log(`  エラー: ${errors.length}件\n`)

  return { slugSet, errors }
}

async function validateRelatedPosts(posts, slugSet) {
  console.log('🔍 関連記事リンクを検証中...\n')

  const errors = []
  let checkedCount = 0
  let relatedPostsCount = 0

  for (const post of posts) {
    if (!post.categories || post.categories.length === 0) continue

    // 同じカテゴリの記事を取得
    const relatedPosts = await client.fetch(`
      *[_type == "post" && _id != $postId && count((categories[]->title)[@ in $categories]) > 0] | order(publishedAt desc, _createdAt desc) [0...2] {
        _id,
        title,
        "slug": slug.current,
        categories
      }
    `, {
      postId: post._id,
      categories: post.categories
    })

    if (relatedPosts.length > 0) {
      relatedPostsCount++

      relatedPosts.forEach(related => {
        checkedCount++

        if (!related.slug) {
          errors.push({
            type: 'MISSING_RELATED_SLUG',
            article: post.title,
            relatedArticle: related.title,
            message: '関連記事のスラッグが未設定です'
          })
        } else if (!slugSet.has(related.slug)) {
          errors.push({
            type: 'BROKEN_RELATED_LINK',
            article: post.title,
            relatedArticle: related.title,
            slug: related.slug,
            message: '関連記事のスラッグが存在しません'
          })
        }
      })
    }
  }

  console.log(`  関連記事を持つ記事: ${relatedPostsCount}件`)
  console.log(`  チェックした関連リンク: ${checkedCount}件`)
  console.log(`  エラー: ${errors.length}件\n`)

  return errors
}

async function validateInternalLinks(posts, slugSet) {
  console.log('📎 本文内の内部リンクを検証中...\n')

  const errors = []
  let linksChecked = 0

  posts.forEach(post => {
    if (!post.body || !Array.isArray(post.body)) return

    post.body.forEach(block => {
      if (block._type !== 'block' || !block.children) return

      block.children.forEach(child => {
        if (child.marks && child.marks.length > 0) {
          child.marks.forEach(markKey => {
            const mark = block.markDefs?.find(def => def._key === markKey)

            if (mark && mark._type === 'link' && mark.href) {
              linksChecked++
              const href = mark.href

              // 内部リンク判定: /posts/ で始まるか確認
              if (href.startsWith('/posts/')) {
                const slug = href.replace('/posts/', '')

                if (!slugSet.has(slug)) {
                  errors.push({
                    type: 'BROKEN_INTERNAL_LINK',
                    article: post.title,
                    href: href,
                    message: '本文内のリンク先記事が存在しません'
                  })
                }
              }
            }
          })
        }
      })
    })
  })

  console.log(`  チェックした内部リンク: ${linksChecked}件`)
  console.log(`  エラー: ${errors.length}件\n`)

  return errors
}

function generateReport(allErrors) {
  console.log('=' .repeat(60))
  console.log('📊 検証レポート')
  console.log('=' .repeat(60))
  console.log()

  if (allErrors.length === 0) {
    console.log('✅ すべてのリンクが正常です！\n')
    return
  }

  console.log(`⚠️  合計 ${allErrors.length}件のエラーが見つかりました\n`)

  // エラータイプ別に集計
  const errorsByType = {}
  allErrors.forEach(error => {
    if (!errorsByType[error.type]) {
      errorsByType[error.type] = []
    }
    errorsByType[error.type].push(error)
  })

  // エラー詳細を表示
  Object.entries(errorsByType).forEach(([type, errors]) => {
    console.log(`\n【${type}】 ${errors.length}件`)
    console.log('-' .repeat(60))

    errors.forEach((error, index) => {
      console.log(`\n${index + 1}. ${error.article}`)
      if (error.relatedArticle) {
        console.log(`   関連記事: ${error.relatedArticle}`)
      }
      if (error.slug) {
        console.log(`   スラッグ: ${error.slug}`)
      }
      if (error.href) {
        console.log(`   リンク: ${error.href}`)
      }
      console.log(`   詳細: ${error.message}`)
    })
  })

  console.log('\n' + '=' .repeat(60))
}

async function main() {
  console.log('=' .repeat(60))
  console.log('🔍 リンク検証ツール (SEO/クローラー対策)')
  console.log('=' .repeat(60))
  console.log()

  try {
    // 1. 全記事取得
    const posts = await getAllPosts()

    // 2. 記事リンク検証
    const { slugSet, errors: slugErrors } = await validateArticleLinks(posts)

    // 3. 関連記事リンク検証
    const relatedErrors = await validateRelatedPosts(posts, slugSet)

    // 4. 本文内部リンク検証
    const internalErrors = await validateInternalLinks(posts, slugSet)

    // 5. レポート生成
    const allErrors = [...slugErrors, ...relatedErrors, ...internalErrors]
    generateReport(allErrors)

    console.log('✨ 検証完了\n')

    // エラーがある場合は終了コード1を返す
    process.exit(allErrors.length > 0 ? 1 : 0)

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { getAllPosts, validateArticleLinks, validateRelatedPosts, validateInternalLinks }
