#!/usr/bin/env node

/**
 * 全記事の Author を「白崎セラ」に更新するスクリプト。
 * 実行前に SANITY_API_TOKEN を設定してください。
 *
 * 例:
 *   export SANITY_API_TOKEN="xxxxx"
 *   node scripts/update-author-to-sera.js            # 実行
 *   node scripts/update-author-to-sera.js --dry-run  # 変更なしで確認
 */

const { createClient } = require('@sanity/client')

const DRY_RUN = process.argv.includes('--dry-run')
const TARGET_AUTHOR_NAME = process.env.TARGET_AUTHOR_NAME || '白崎セラ'
const TARGET_AUTHOR_SLUG = process.env.TARGET_AUTHOR_SLUG || 'shirasaki-sera'

if (!process.env.SANITY_API_TOKEN) {
  console.error('❌ SANITY_API_TOKEN が設定されていません。')
  console.error('   export SANITY_API_TOKEN="your_token" を実行してから再試行してください。')
  process.exit(1)
}

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

async function main() {
  console.log(`🔍 Author "${TARGET_AUTHOR_NAME}" を確認中...`)

  const targetAuthor = await client.fetch(
    `*[_type == "author" && (name == $name || slug.current == $slug)][0]`,
    { name: TARGET_AUTHOR_NAME, slug: TARGET_AUTHOR_SLUG }
  )

  if (!targetAuthor?._id) {
    console.error(`❌ Author "${TARGET_AUTHOR_NAME}" が Sanity に存在しません。`)
    console.error('   Studio で著者を作成してから再度実行してください。')
    process.exit(1)
  }

  console.log(`✅ 対象 Author: ${targetAuthor.name} (${targetAuthor._id})`)
  console.log('📰 記事一覧を取得中...')

  const posts = await client.fetch(`*[_type == "post"]{ _id, title, author->{_id, name} }`)
  console.log(`📦 取得記事数: ${posts.length}`)

  if (DRY_RUN) {
    const diff = posts
      .filter(post => post.author?._id !== targetAuthor._id)
      .map(post => ({
        title: post.title,
        before: post.author?.name || '（未設定）',
        after: targetAuthor.name,
      }))

    console.log('📝 Dry Run 結果 (変更対象のみ表示)')
    console.table(diff)
    console.log(`合計 ${diff.length} 件が更新対象です。`)
    return
  }

  let success = 0

  for (const post of posts) {
    if (post.author?._id === targetAuthor._id) {
      continue
    }

    try {
      await client
        .patch(post._id)
        .set({
          author: {
            _type: 'reference',
            _ref: targetAuthor._id,
          },
        })
        .commit()

      success++
      console.log(`✅ 更新完了: ${post.title}`)
    } catch (error) {
      console.error(`❌ 更新失敗: ${post.title}`, error.message)
    }
  }

  console.log(`\n🎉 完了: ${success} 件の Author を "${targetAuthor.name}" に更新しました。`)
  console.log('   必要であれば `--dry-run` で事前確認ができます。')
}

main().catch(error => {
  console.error('❌ 実行中にエラーが発生しました:', error)
  process.exit(1)
})

