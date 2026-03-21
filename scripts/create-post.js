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
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })
const MetadataService = require('./utils/metadataService')

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
        children: [{ _type: 'span', text: '要点を整理し、安心して読み終えられるように整えます。' }]
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
        children: [{ _type: 'span', text: '確認しておきたい整理ポイント' }]
      },
      {
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: '落ち着いて判断できるように情報を整理します。' }]
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: 'まとめ' }]
      },
      {
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: '要点を整理し、共感と理解を深めます。' }]
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

    const metadataService = new MetadataService(process.env.GEMINI_API_KEY)

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

    // ペルソナ定義（ARTICLE_GUIDE.md準拠）
    const personas = [
      { id: 'A-1', name: '現役・一般（日勤）', desc: '業務の悩み、人間関係', tone: '「現場あるあるですよね」' },
      { id: 'A-2', name: '現役・夜勤専従', desc: '寝不足、自律神経、孤独', tone: '「泥のような疲れ、わかります」' },
      { id: 'A-3', name: '現役・リーダー', desc: '指導の悩み、板挟み', tone: '「伝えるのって難しいですよね」' },
      { id: 'B-1', name: '未経験・無資格', desc: '私にもできる？不安解消', tone: '「最初は誰でも未経験です」' },
      { id: 'B-2', name: '学生・志望者', desc: '奨学金、実習、両立', tone: '「夢への一歩、応援します」' },
      { id: 'B-3', name: '異業種転職', desc: '年齢、体力、安定性', tone: '「人生経験が活きる仕事です」' },
      { id: 'C-1', name: '退職・休職', desc: '辞めたい、限界、逃げたい', tone: '「逃げじゃありません。自分を守る選択です」' },
      { id: 'C-2', name: 'ステップアップ', desc: '看護師資格、勉強法', tone: '「現場を知るあなたは強い」' },
    ]

    // ペルソナ選択
    console.log('\n👤 ターゲットペルソナを選択:')
    personas.forEach((p, i) => {
      console.log(`  ${i + 1}. [${p.id}] ${p.name} : ${p.desc}`)
    })
    const personaIndex = await question('\nペルソナ番号を選択してください: ')
    const selectedPersona = personas[parseInt(personaIndex) - 1]

    if (!selectedPersona) {
      console.log('❌ 有効なペルソナが選択されませんでした。')
      rl.close()
      return
    }

    console.log(`\n👉 選択されたトーン: ${selectedPersona.tone}`)

    // 記事作成
    const post = {
      _type: 'post',
      title,
      slug: {
        _type: 'slug',
        current: slug
      },
      // 選択したテンプレートにペルソナ情報を注入
      body: ensurePortableTextKeys([
        {
          _type: 'block',
          style: 'normal',
          children: [{
            _type: 'span',
            text: `【執筆メモ: この記事はペルソナ「${selectedPersona.name} (${selectedPersona.id})」向けです。トーン: ${selectedPersona.tone} を意識して書いてください】`
          }]
        },
        ...(templates[selectedTemplate].body || [])
      ]),
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

    // AIによるメタデータ生成
    const generateMeta = await question('\nAIでメタデータ（抜粋・SEO説明・タグ）を生成しますか？ (y/n): ')
    if (generateMeta.toLowerCase() === 'y') {
      process.stdout.write('⏳ メタデータ生成中...')
      try {
        const metadata = await metadataService.generateMetadata({
          title: post.title,
          body: post.body,
          category: selectedCategory.title
        })
        post.excerpt = metadata.excerpt
        post.metaDescription = metadata.metaDescription
        post.tags = metadata.tags
        console.log('✅ 完了\n')
        console.log(`抜粋: ${post.excerpt}`)
        console.log(`SEO説明: ${post.metaDescription}`)
        console.log(`タグ: ${post.tags.join(', ')}`)
      } catch (err) {
        console.error('\n❌ メタデータ生成に失敗しました:', err.message)
      }
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
