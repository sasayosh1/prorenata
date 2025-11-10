/**
 * 記事作成補助スクリプト
 *
 * 新規記事のドラフトを自動生成します
 * - タイトルからスラッグを自動生成
 * - カテゴリの選択
 * - テンプレート適用
 */

const { createClient } = require('@sanity/client')
const readline = require('readline')
const {
  ensurePortableTextKeys,
  ensureReferenceKeys
} = require('./utils/keyHelpers')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

// スラッグ生成
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim()
}

// カテゴリ一覧を取得
async function getCategories() {
  try {
    const categories = await client.fetch(
      `*[_type == "category"] | order(title asc) { _id, title }`
    )
    return categories
  } catch (error) {
    console.error('カテゴリ取得エラー:', error)
    return []
  }
}

// 著者を取得
async function getAuthors() {
  try {
    const authors = await client.fetch(
      `*[_type == "author"] | order(name asc) { _id, name }`
    )
    return authors
  } catch (error) {
    console.error('著者取得エラー:', error)
    return []
  }
}

// 記事テンプレート
const templates = {
  '基礎知識・解説系': {
    body: [
      {
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: '導入文をここに記入してください。読者の課題に共感し、記事で何が得られるかを明確に提示します。' }]
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: '○○とは？基本を理解しよう' }]
      },
      {
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: '基本的な定義や概要を説明します。' }]
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: '○○が重要な3つの理由' }]
      },
      {
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: '重要性やメリットを具体的に説明します。' }]
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: 'まとめ' }]
      },
      {
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: '記事の要点をまとめ、次のアクションを提案します。' }]
      }
    ]
  },
  '実践ノウハウ系': {
    body: [
      {
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: '導入文：読者の悩みに共感し、解決策を提示します。' }]
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: '○○を成功させる基本ステップ' }]
      },
      {
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: '実践的な手順を具体的に説明します。' }]
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: '現場で役立つ具体的なコツ' }]
      },
      {
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: '現場経験に基づいたコツを紹介します。' }]
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: '避けるべき失敗パターン' }]
      },
      {
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: 'よくある失敗例と対処法を説明します。' }]
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: 'まとめ' }]
      },
      {
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: '要点をまとめ、実践を促します。' }]
      }
    ]
  },
  'キャリア・転職系': {
    body: [
      {
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: '導入文：現状の課題を提起し、選択肢を提示します。' }]
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: '○○を選ぶ際の判断基準' }]
      },
      {
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: '判断するためのポイントを説明します。' }]
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: 'メリット・デメリット比較' }]
      },
      {
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: '客観的な比較情報を提供します。' }]
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: '失敗しないためのチェックリスト' }]
      },
      {
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: '確認すべき項目をリスト化します。' }]
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: 'まとめ' }]
      },
      {
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: '次のステップを明確に提示します。' }]
      }
    ]
  }
}

async function createPost() {
  console.log('\n📝 ProReNata 記事作成補助ツール\n')

  try {
    // タイトル入力
    const title = await question('記事タイトルを入力してください: ')
    if (!title) {
      console.log('❌ タイトルが入力されませんでした。')
      rl.close()
      return
    }

    // スラッグ生成（日本語タイトルの場合は手動入力を推奨）
    const autoSlug = generateSlug(title)
    console.log(`\n推奨スラッグ: ${autoSlug}`)
    const customSlug = await question('スラッグを変更する場合は入力してください（Enterでスキップ）: ')
    const slug = customSlug || autoSlug

    // カテゴリ選択
    const categories = await getCategories()
    console.log('\n📁 カテゴリ一覧:')
    categories.forEach((cat, i) => {
      console.log(`  ${i + 1}. ${cat.title}`)
    })
    const catIndex = await question('\nカテゴリ番号を選択してください: ')
    const selectedCategory = categories[parseInt(catIndex) - 1]

    if (!selectedCategory) {
      console.log('❌ 有効なカテゴリが選択されませんでした。')
      rl.close()
      return
    }

    // テンプレート選択
    console.log('\n📋 記事テンプレート:')
    const templateNames = Object.keys(templates)
    templateNames.forEach((name, i) => {
      console.log(`  ${i + 1}. ${name}`)
    })
    const templateIndex = await question('\nテンプレート番号を選択してください: ')
    const selectedTemplate = templateNames[parseInt(templateIndex) - 1]

    if (!selectedTemplate) {
      console.log('❌ 有効なテンプレートが選択されませんでした。')
      rl.close()
      return
    }

    // 著者を取得（デフォルトは最初の著者）
    const authors = await getAuthors()
    const defaultAuthor = authors[0]

    // 記事作成
    const post = {
      _type: 'post',
      title,
      slug: {
        _type: 'slug',
        current: slug
      },
      body: ensurePortableTextKeys(templates[selectedTemplate].body || []),
      categories: ensureReferenceKeys([{
        _type: 'reference',
        _ref: selectedCategory._id
      }]),
      author: {
        _type: 'reference',
        _ref: defaultAuthor._id
      },
      publishedAt: new Date().toISOString(),
      tags: [],
      views: 0
    }

    console.log('\n作成する記事の内容:')
    console.log('─'.repeat(60))
    console.log(`タイトル: ${post.title}`)
    console.log(`スラッグ: ${post.slug.current}`)
    console.log(`カテゴリ: ${selectedCategory.title}`)
    console.log(`テンプレート: ${selectedTemplate}`)
    console.log(`著者: ${defaultAuthor.name}`)
    console.log('─'.repeat(60))

    const confirm = await question('\nこの内容で記事を作成しますか？ (y/n): ')

    if (confirm.toLowerCase() === 'y') {
      const result = await client.create(post)
      console.log('\n✅ 記事を作成しました！')
      console.log(`   記事ID: ${result._id}`)
      console.log(`   Sanity Studioで編集: http://localhost:3333/structure/post;${result._id}`)
    } else {
      console.log('\n❌ 記事作成をキャンセルしました。')
    }

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error.message)
  } finally {
    rl.close()
  }
}

// CLI実行
if (require.main === module) {
  const args = process.argv.slice(2)

  if (args[0] === '--help' || args[0] === '-h') {
    console.log(`
📝 ProReNata 記事作成補助ツール

使い方:
  node scripts/create-post.js

対話形式で以下を入力:
  1. 記事タイトル
  2. スラッグ（URLに使用）
  3. カテゴリ選択
  4. テンプレート選択

環境変数:
  SANITY_API_TOKEN が必要です

作成される記事:
  - ドラフト状態で作成
  - 選択したテンプレートで本文が自動生成
  - Sanity Studioで編集可能
    `)
    process.exit(0)
  }

  createPost().catch(console.error)
}

module.exports = { createPost }
