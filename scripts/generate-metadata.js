/**
 * メタデータ自動生成ツール
 *
 * 記事の内容を分析して、SEOに最適なメタデータを自動生成します
 * - excerpt: 記事の要約（100-150文字）
 * - metaDescription: SEO用ディスクリプション（120-160文字）
 * - focusKeyword: メインキーワード
 * - relatedKeywords: 関連キーワード（3-5個）
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
 * Portable Text形式のbodyからテキストを抽出
 */
function extractTextFromBody(body) {
  if (!body || !Array.isArray(body)) return ''

  let text = ''
  body.forEach(block => {
    if (block._type === 'block' && block.children) {
      block.children.forEach(child => {
        if (child.text) {
          text += child.text + ' '
        }
      })
    }
  })

  return text.trim()
}

/**
 * 記事の冒頭から要約を生成（100-150文字）
 */
function generateExcerpt(text, title) {
  if (!text) return `${title}について、看護助手として働く皆様に役立つ情報をお届けします。`

  // 冒頭200文字を取得
  const firstPart = text.substring(0, 200).trim()

  // 句点で区切って文章単位で取得
  const sentences = firstPart.split('。')
  let excerpt = ''

  for (const sentence of sentences) {
    if ((excerpt + sentence + '。').length <= 150) {
      excerpt += sentence + '。'
    } else {
      break
    }
  }

  // 最低でも1文は含める
  if (!excerpt && sentences[0]) {
    excerpt = sentences[0].substring(0, 147) + '...'
  }

  return excerpt || `${title}について詳しく解説します。`
}

/**
 * SEO用メタディスクリプションを生成（120-160文字）
 */
function generateMetaDescription(title, excerpt, categories) {
  const MIN_LEN = 120
  const MAX_LEN = 160
  const TARGET_LEN = 158

  const normalizeText = (value) =>
    String(value ?? '')
      .replace(/\s+/g, ' ')
      .replace(/\u00A0/g, ' ')
      .trim()

  const ensureSentenceEnd = (value) => {
    let text = normalizeText(value)
    text = text.replace(/(\.{3,}|…)+$/g, '').trim()
    text = text.replace(/[、,・]+$/g, '').trim()
    if (!text) return ''
    if (!/[。！？!?]$/.test(text) && text.length < MAX_LEN) {
      text += '。'
    }
    return text
  }

  const clampToMax = (value) => {
    let text = normalizeText(value)
    if (text.length <= MAX_LEN) return ensureSentenceEnd(text)
    text = text.slice(0, MAX_LEN)
    const lastPeriod = text.lastIndexOf('。')
    if (lastPeriod >= MIN_LEN - 10) {
      text = text.slice(0, lastPeriod + 1)
    }
    return ensureSentenceEnd(text)
  }

  const categoryText = Array.isArray(categories) && categories.length > 0
    ? String(categories[0])
    : ''

  // excerpt をベースに、短い場合は補完して 160 付近へ寄せる
  let description = normalizeText(excerpt)
  if (!description) {
    description = `${title}のポイントを整理しました。`
  }

  const lead = categoryText ? `${categoryText}の視点で、` : ''
  description = ensureSentenceEnd(`${lead}${description}`)

  const fillers = [
    '要点と注意点を短くまとめました。',
    '迷ったときの考え方も整理しています。',
    '状況に合わせた判断の軸も紹介します。',
    '無理なく進めるための工夫も入れています。',
    '手順もまとめました。',
    '注意点も書いています。',
    '要点を整理します。'
  ]
    .map(ensureSentenceEnd)
    .filter(Boolean)

  const fillersByLengthDesc = [...new Set(fillers)].sort((a, b) => b.length - a.length)
  const used = new Set()

  let safety = 0
  while (description.length < TARGET_LEN && safety < 40) {
    const remaining = MAX_LEN - description.length
    const pick = fillersByLengthDesc.find(f => f.length <= remaining && !used.has(f))
    if (!pick) break
    used.add(pick)
    description = normalizeText(description + pick)
    safety += 1
  }

  description = clampToMax(description)

  if (description.length < MIN_LEN) {
    const pad = ensureSentenceEnd(`${title}を読む前に押さえたい点もまとめました。`)
    const candidate = clampToMax(description + pad)
    if (candidate.length <= MAX_LEN) description = candidate
  }

  return description
}

/**
 * 1件の記事のメタデータを生成
 */
async function generatePostMetadata(postId, dryRun = false) {
  try {
    const post = await client.fetch(
      `*[_type == "post" && _id == $postId][0] {
        _id,
        title,
        body,
        tags,
        excerpt,
        metaDescription,
        "categories": categories[]->title
      }`,
      { postId }
    )

    if (!post) {
      console.log(`❌ 記事が見つかりません: ${postId}`)
      return { success: false, reason: 'not_found' }
    }

    const updates = {}
    let hasUpdates = false

    // テキスト抽出
    const text = extractTextFromBody(post.body)

    // Excerpt生成（既存のものがない場合）
    if (!post.excerpt) {
      updates.excerpt = generateExcerpt(text, post.title)
      hasUpdates = true
    }

    // Meta Description生成（既存のものがない場合）
    if (!post.metaDescription) {
      const excerpt = updates.excerpt || post.excerpt
      updates.metaDescription = generateMetaDescription(post.title, excerpt, post.categories)
      hasUpdates = true
    }

    if (!hasUpdates) {
      return { success: true, reason: 'no_updates_needed' }
    }

    if (dryRun) {
      console.log(`\n📝 ${post.title}`)
      console.log(`   更新予定:`)
      if (updates.excerpt) console.log(`   - excerpt: ${updates.excerpt}`)
      if (updates.metaDescription) console.log(`   - metaDescription: ${updates.metaDescription}`)
      return { success: true, reason: 'dry_run' }
    }

    // 実際に更新
    await client
      .patch(postId)
      .set(updates)
      .commit()

    console.log(`✅ ${post.title}`)
    return { success: true, reason: 'updated', updates }

  } catch (error) {
    console.error(`❌ エラー (${postId}):`, error.message)
    return { success: false, reason: 'error', error: error.message }
  }
}

/**
 * メタデータ不足の記事を一括処理
 */
async function generateBulkMetadata(options = {}) {
  const {
    limit = null,
    dryRun = false,
    filter = 'missing' // 'missing' | 'all'
  } = options

  console.log('\n🔍 メタデータ不足の記事を検索中...\n')

  let query = `*[_type == "post"`

  if (filter === 'missing') {
    query += ` && (!defined(excerpt) || !defined(metaDescription))`
  }

  query += `] { _id, title }`

  if (limit) {
    query += ` [0...${limit}]`
  }

  const posts = await client.fetch(query)

  console.log(`📊 対象記事: ${posts.length}件`)

  if (dryRun) {
    console.log('⚠️  ドライランモード（実際の更新は行いません）\n')
  }

  const results = {
    total: posts.length,
    updated: 0,
    noUpdatesNeeded: 0,
    errors: 0
  }

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i]
    console.log(`\n[${i + 1}/${posts.length}] 処理中...`)

    const result = await generatePostMetadata(post._id, dryRun)

    if (result.success) {
      if (result.reason === 'updated' || result.reason === 'dry_run') {
        results.updated++
      } else if (result.reason === 'no_updates_needed') {
        results.noUpdatesNeeded++
      }
    } else {
      results.errors++
    }

    // API負荷軽減のため少し待機
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 処理結果サマリー\n')
  console.log(`  総件数: ${results.total}件`)
  console.log(`  ✅ 更新${dryRun ? '予定' : '完了'}: ${results.updated}件`)
  console.log(`  ⏭️  更新不要: ${results.noUpdatesNeeded}件`)
  console.log(`  ❌ エラー: ${results.errors}件`)
  console.log('='.repeat(60) + '\n')

  return results
}

// CLI実行
if (require.main === module) {
  const args = process.argv.slice(2)
  const command = args[0]

  switch (command) {
    case 'single':
      const postId = args[1]
      if (!postId) {
        console.log('❌ 記事IDを指定してください')
        process.exit(1)
      }
      const dryRunSingle = args.includes('--dry-run')
      generatePostMetadata(postId, dryRunSingle).catch(console.error)
      break

    case 'bulk':
      const limit = args.includes('--limit')
        ? parseInt(args[args.indexOf('--limit') + 1])
        : null
      const dryRunBulk = args.includes('--dry-run')
      const filter = args.includes('--all') ? 'all' : 'missing'

      generateBulkMetadata({ limit, dryRun: dryRunBulk, filter })
        .catch(console.error)
      break

    default:
      console.log(`
📝 ProReNata メタデータ自動生成ツール

使い方:
  node scripts/generate-metadata.js <コマンド> [オプション]

コマンド:
  single <記事ID>     1件の記事のメタデータを生成
  bulk                メタデータ不足の記事を一括生成

オプション:
  --dry-run           実際には更新せず、プレビューのみ表示
  --limit <数>        処理件数を制限（bulkのみ）
  --all               全記事を対象（bulkのみ、デフォルトは不足記事のみ）

例:
  # 1件の記事を処理（プレビュー）
  node scripts/generate-metadata.js single <記事ID> --dry-run

  # メタデータ不足の記事を全て更新
  node scripts/generate-metadata.js bulk

  # 最初の10件のみ処理（テスト用）
  node scripts/generate-metadata.js bulk --limit 10 --dry-run

環境変数:
  SANITY_API_TOKEN が必要です
      `)
  }
}

module.exports = {
  generatePostMetadata,
  generateBulkMetadata,
  extractTextFromBody,
  generateExcerpt,
  generateMetaDescription
}
