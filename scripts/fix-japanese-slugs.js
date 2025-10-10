require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

// タイトルからSEO最適化スラッグを生成（nursing-assistant-○○-○○形式）
function generateSlug(title) {
  // 日本語キーワードを英語に変換（SEO重視の核心ワードのみ）
  const keywordMap = {
    'シフト': 'shift',
    '夜勤': 'night-shift',
    '給料': 'salary',
    '年収': 'income',
    '転職': 'career',
    '辞めたい': 'quit',
    '退職': 'retirement',
    '資格': 'qualification',
    '仕事': 'work',
    '業務': 'duties',
    '人間関係': 'relationship',
    'やりがい': 'reward',
    '求人': 'job',
    'スキル': 'skill',
    '未経験': 'beginner',
    'きつい': 'tough',
    'パート': 'part-time',
    '正社員': 'full-time',
    'メリット': 'merit',
    'デメリット': 'demerit',
    'コツ': 'tips',
    '方法': 'method',
    '理由': 'reason',
    '悩み': 'concern',
    'キャリア': 'career',
    '朝': 'morning',
    '昼': 'day',
    '夜': 'night',
    '専従': 'dedicated',
  }

  // タイトルから重要キーワードを抽出（2〜3語）
  let keywords = []
  for (const [jp, en] of Object.entries(keywordMap)) {
    if (title.includes(jp)) {
      keywords.push(en)
      if (keywords.length >= 3) break // 最大3語
    }
  }

  // キーワードが2語未満の場合、タイトルから補完
  if (keywords.length < 2) {
    const titleWords = title
      .replace(/【|】|[・、。！？]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0)

    for (const word of titleWords) {
      for (const [jp, en] of Object.entries(keywordMap)) {
        if (word.includes(jp) && !keywords.includes(en)) {
          keywords.push(en)
          if (keywords.length >= 2) break
        }
      }
      if (keywords.length >= 2) break
    }
  }

  // デフォルト（キーワードが見つからない場合）
  if (keywords.length === 0) {
    keywords = ['general']
  }

  // nursing-assistant- で始まるスラッグを生成（タイムスタンプなし）
  const slug = keywords.slice(0, 3).join('-')
  return `nursing-assistant-${slug}`
}

async function fixJapaneseSlugs() {
  console.log('='.repeat(60))
  console.log('🔧 日本語スラッグの修正')
  console.log('='.repeat(60))
  console.log()

  // 日本語を含むスラッグを検索
  const posts = await client.fetch(`*[_type == "post"] {
    _id,
    title,
    "slug": slug.current
  }`)

  const japaneseSlugPosts = posts.filter(post => {
    if (!post.slug) return true // スラッグ未設定も対象
    // 日本語文字（ひらがな、カタカナ、漢字）を含むか判定
    return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(post.slug)
  })

  console.log(`日本語スラッグ検出: ${japaneseSlugPosts.length}件\n`)

  let fixedCount = 0

  for (const post of japaneseSlugPosts) {
    const oldSlug = post.slug || '未設定'
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

    fixedCount++
    console.log(`✅ ${post.title}`)
    console.log(`   旧: ${oldSlug}`)
    console.log(`   新: ${newSlug}\n`)
  }

  console.log('='.repeat(60))
  console.log(`修正完了: ${fixedCount}件`)
  console.log('='.repeat(60))
}

fixJapaneseSlugs().catch(console.error)
