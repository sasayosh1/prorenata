require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

// アフィリエイトリンクマッピング
const affiliateLinks = {
  '転職': 'https://track.affiliate-b.com/visit.php?guid=ON&a=r18606-u375359&p=27043908',
  '退職代行': 'https://track.affiliate-b.com/visit.php?guid=ON&a=r18606-u375359&p=27043908',
  'かいご畑': 'https://track.affiliate-b.com/visit.php?guid=ON&a=r18606-u375359&p=27043908'
}

// 内部リンクキーワードマッピング（既存記事のスラッグ）
const internalLinkMapping = {
  'キャリアパス': 'nursing-assistant-career-up',
  'キャリアアップ': 'nursing-assistant-career-up',
  '看護助手のキャリアパス': 'nursing-assistant-career-up',
  '給料': 'nursing-assistant-salary',
  '年収': 'nursing-assistant-salary',
  '転職': 'nursing-assistant-career',
  '辞めたい': 'nursing-assistant-quit',
  '退職': 'nursing-assistant-quit',
  '夜勤': 'nursing-assistant-night-shift-pros-cons',
  '仕事内容': 'nursing-assistant-scope-of-work',
  '看護師との違い': 'nursing-assistant-vs-nurse-differences'
}

async function convertPlaceholderLinks() {
  console.log('='.repeat(60))
  console.log('🔗 プレースホルダーリンク自動変換ツール')
  console.log('='.repeat(60))
  console.log()

  const posts = await client.fetch(`*[_type == "post"] {
    _id,
    title,
    body
  }`)

  let fixedCount = 0
  let totalPlaceholders = 0

  for (const post of posts) {
    if (!post.body || !Array.isArray(post.body)) continue

    let modified = false
    const newBody = JSON.parse(JSON.stringify(post.body)) // Deep copy

    newBody.forEach((block, blockIndex) => {
      if (block._type !== 'block' || !block.children) return

      // markDefsが存在しない場合は初期化
      if (!block.markDefs) {
        block.markDefs = []
      }

      const newChildren = []

      block.children.forEach((child) => {
        if (child._type !== 'span' || !child.text) {
          newChildren.push(child)
          return
        }

        const text = child.text

        // [INTERNAL_LINK: キーワード] を検出
        const internalLinkRegex = /\[INTERNAL_LINK:\s*([^\]]+)\]/g
        // [AFFILIATE_LINK: キーワード] を検出
        const affiliateLinkRegex = /\[AFFILIATE_LINK:\s*([^\]]+)\]/g

        let lastIndex = 0
        let hasPlaceholder = false
        const segments = []

        // 内部リンクを処理
        let match
        while ((match = internalLinkRegex.exec(text)) !== null) {
          hasPlaceholder = true
          totalPlaceholders++

          // プレースホルダー前のテキスト
          if (match.index > lastIndex) {
            segments.push({
              text: text.substring(lastIndex, match.index),
              marks: child.marks || []
            })
          }

          const keyword = match[1].trim()
          const slug = internalLinkMapping[keyword]

          if (slug) {
            // リンクマークを作成
            const markKey = `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            block.markDefs.push({
              _key: markKey,
              _type: 'link',
              href: `/posts/${slug}`
            })

            // リンク付きテキスト
            segments.push({
              text: keyword,
              marks: [...(child.marks || []), markKey]
            })

            modified = true
            console.log(`  ✅ 内部リンク変換: "${keyword}" → /posts/${slug}`)
          } else {
            // マッピングがない場合はテキストのまま
            segments.push({
              text: match[0],
              marks: child.marks || []
            })
            console.log(`  ⚠️  内部リンクマッピングなし: "${keyword}"`)
          }

          lastIndex = match.index + match[0].length
        }

        // アフィリエイトリンクを処理
        const remainingText = text.substring(lastIndex)
        lastIndex = 0

        while ((match = affiliateLinkRegex.exec(remainingText)) !== null) {
          hasPlaceholder = true
          totalPlaceholders++

          // プレースホルダー前のテキスト
          if (match.index > lastIndex) {
            segments.push({
              text: remainingText.substring(lastIndex, match.index),
              marks: child.marks || []
            })
          }

          const keyword = match[1].trim()
          const url = affiliateLinks[keyword]

          if (url) {
            // リンクマークを作成
            const markKey = `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            block.markDefs.push({
              _key: markKey,
              _type: 'link',
              href: url
            })

            // リンク付きテキスト（表示テキストを設定）
            const displayText = keyword === '転職' ? 'かいご畑 [PR]' :
                               keyword === '退職代行' ? '退職代行ガーディアン [PR]' :
                               `${keyword} [PR]`

            segments.push({
              text: displayText,
              marks: [...(child.marks || []), markKey]
            })

            modified = true
            console.log(`  ✅ アフィリエイトリンク変換: "${keyword}" → ${displayText}`)
          } else {
            // マッピングがない場合はテキストのまま
            segments.push({
              text: match[0],
              marks: child.marks || []
            })
            console.log(`  ⚠️  アフィリエイトリンクマッピングなし: "${keyword}"`)
          }

          lastIndex = match.index + match[0].length
        }

        // 残りのテキスト
        if (lastIndex < remainingText.length) {
          segments.push({
            text: remainingText.substring(lastIndex),
            marks: child.marks || []
          })
        }

        // プレースホルダーがあった場合は分割、なければそのまま
        if (hasPlaceholder && segments.length > 0) {
          segments.forEach((segment, idx) => {
            newChildren.push({
              _key: `${child._key}-${idx}`,
              _type: 'span',
              text: segment.text,
              marks: segment.marks
            })
          })
        } else {
          newChildren.push(child)
        }
      })

      if (modified) {
        newBody[blockIndex] = {
          ...block,
          children: newChildren
        }
      }
    })

    if (modified) {
      await client.patch(post._id).set({ body: newBody }).commit()
      fixedCount++
      console.log(`\n📝 記事更新: ${post.title}\n`)
    }
  }

  console.log()
  console.log('='.repeat(60))
  console.log(`検出プレースホルダー: ${totalPlaceholders}件`)
  console.log(`更新記事数: ${fixedCount}件`)
  console.log('='.repeat(60))
}

convertPlaceholderLinks().catch(console.error)
