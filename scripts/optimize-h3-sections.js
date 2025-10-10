require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

async function optimizeH3Sections() {
  const line = '='.repeat(60)
  console.log(line)
  console.log('🔧 H3セクションの最適化')
  console.log(line)
  console.log()

  const posts = await client.fetch(`*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body
  }`)

  let optimizedCount = 0

  for (const post of posts) {
    if (!post.body || !Array.isArray(post.body)) continue

    let modified = false
    const newBody = [...post.body]

    // H3見出しを探す
    for (let i = 0; i < newBody.length; i++) {
      const block = newBody[i]

      if (block._type !== 'block' || block.style !== 'h3') continue

      const h3Text = block.children?.map(c => c.text || '').join('') || ''

      // 「より良い職場環境を探している方へ」などのH3を対象
      if (!h3Text.includes('職場') && !h3Text.includes('転職') && !h3Text.includes('探し')) {
        continue
      }

      // H3の後ろから次のステップまたは記事末尾までを分析
      let sectionEnd = newBody.length
      for (let j = i + 1; j < newBody.length; j++) {
        if (newBody[j]._type === 'nextSteps' ||
            (newBody[j]._type === 'block' && newBody[j].style &&
             (newBody[j].style.startsWith('h2') || newBody[j].style.startsWith('h3')))) {
          sectionEnd = j
          break
        }
      }

      // セクション内のブロックを分類
      const contentBlocks = []
      const affiliateBlocks = []

      for (let j = i + 1; j < sectionEnd; j++) {
        const b = newBody[j]

        // [PR]だけのブロックをスキップ
        const isPROnly = b._type === 'block' && b.children &&
          b.children.map(c => c.text || '').join('').trim() === '[PR]'

        if (isPROnly) continue

        // アフィリエイトリンクか判定
        const isAffiliateLink = b._type === 'block' &&
          b.markDefs &&
          b.markDefs.length > 0 &&
          b.markDefs.some(mark => {
            if (mark._type !== 'link' || !mark.href) return false
            const href = mark.href.toLowerCase()
            return href.includes('moshimo') ||
                   href.includes('tcs-asp.net') ||
                   href.includes('a8.net') ||
                   href.includes('rakuten') ||
                   href.includes('amazon')
          })

        if (isAffiliateLink) {
          affiliateBlocks.push(b)
        } else {
          contentBlocks.push(b)
        }
      }

      // アフィリエイトリンクが複数ある場合、記事内容に応じて絞る
      let selectedAffiliateBlocks = affiliateBlocks

      if (affiliateBlocks.length > 2) {
        // 記事タイトルから適切なリンクを選択
        const titleLower = post.title.toLowerCase()

        // 退職関連なら退職代行を優先
        if (titleLower.includes('辞めたい') || titleLower.includes('退職')) {
          selectedAffiliateBlocks = affiliateBlocks.filter(b => {
            const text = b.children?.map(c => c.text || '').join('') || ''
            return text.includes('退職') || text.includes('弁護士')
          })
        }

        // 転職・求人関連なら転職サービスを優先
        if (titleLower.includes('転職') || titleLower.includes('求人') ||
            titleLower.includes('給料') || titleLower.includes('夜勤')) {
          selectedAffiliateBlocks = affiliateBlocks.filter(b => {
            const text = b.children?.map(c => c.text || '').join('') || ''
            return text.includes('転職') || text.includes('求人') || text.includes('介護職')
          })
        }

        // それでも多い場合は最初の2つだけ
        if (selectedAffiliateBlocks.length > 2) {
          selectedAffiliateBlocks = selectedAffiliateBlocks.slice(0, 2)
        }
      }

      // 再構成: H3 → 本文 → アフィリエイトリンク
      if (contentBlocks.length > 0 || affiliateBlocks.length !== selectedAffiliateBlocks.length) {
        const reorganized = [
          newBody[i],              // H3見出し
          ...contentBlocks,         // 本文
          ...selectedAffiliateBlocks // 厳選されたアフィリエイトリンク
        ]

        // 元のセクションを削除して新しい順序で挿入
        newBody.splice(i, sectionEnd - i, ...reorganized)

        modified = true
        console.log('✅ ' + post.title)
        console.log('   H3: ' + h3Text)
        console.log('   本文ブロック: ' + contentBlocks.length + '個')
        console.log('   アフィリエイトリンク: ' + affiliateBlocks.length + '個 → ' + selectedAffiliateBlocks.length + '個')
        console.log()

        // インデックスを調整（再構成後のセクションをスキップ）
        i += reorganized.length - 1
      }
    }

    if (modified) {
      await client.patch(post._id).set({ body: newBody }).commit()
      optimizedCount++
    }
  }

  console.log(line)
  console.log('📊 最適化完了')
  console.log(line)
  console.log('最適化した記事数: ' + optimizedCount)
  console.log()
}

optimizeH3Sections().catch(console.error)
