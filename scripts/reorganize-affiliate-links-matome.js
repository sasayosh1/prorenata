require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

async function reorganizeAffiliateLinks() {
  const line = '='.repeat(60)
  console.log(line)
  console.log('🔧 アフィリエイトリンクの整理（まとめセクション）')
  console.log(line)
  console.log()

  const posts = await client.fetch(`*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body
  }`)

  let reorganizedCount = 0

  for (const post of posts) {
    if (!post.body || !Array.isArray(post.body)) continue

    let modified = false
    const newBody = [...post.body]

    // 「まとめ」見出しを探す
    let matomeIndex = -1
    for (let i = 0; i < newBody.length; i++) {
      const block = newBody[i]
      if (block._type === 'block' && block.style === 'h2' && block.children) {
        const text = block.children.map(c => c.text || '').join('')
        if (text === 'まとめ') {
          matomeIndex = i
          break
        }
      }
    }

    if (matomeIndex === -1) continue // まとめ見出しがない記事はスキップ

    // まとめセクションの範囲を特定
    // まとめ見出し → 本文ブロック（複数可） → アフィリエイトリンク（複数）

    // まとめ見出しの後ろから次のステップまたは記事末尾までを調査
    let matomeEndIndex = newBody.length
    for (let i = matomeIndex + 1; i < newBody.length; i++) {
      const block = newBody[i]

      // 次のステップカードまたはH2見出しが来たら終了
      if (block._type === 'nextSteps' ||
          (block._type === 'block' && block.style && block.style.startsWith('h'))) {
        matomeEndIndex = i
        break
      }
    }

    // まとめセクション内のブロックを分類
    const contentBlocks = [] // 本文
    const affiliateBlocks = [] // アフィリエイトリンク

    for (let i = matomeIndex + 1; i < matomeEndIndex; i++) {
      const block = newBody[i]

      // アフィリエイトリンクかどうか判定
      const isAffiliateLink = block._type === 'block' &&
        block.markDefs &&
        block.markDefs.length > 0 &&
        block.markDefs.some(mark => {
          if (mark._type !== 'link' || !mark.href) return false
          const href = mark.href.toLowerCase()
          return href.includes('moshimo') ||
                 href.includes('tcs-asp.net') ||
                 href.includes('a8.net')
        })

      // [PR]だけのブロックもアフィリエイト扱い
      const isPROnly = block._type === 'block' && block.children &&
        block.children.map(c => c.text || '').join('').trim() === '[PR]'

      if (isAffiliateLink || isPROnly) {
        affiliateBlocks.push(block)
      } else {
        contentBlocks.push(block)
      }
    }

    // アフィリエイトリンクが複数あり、間に本文が挟まっている場合のみ修正
    if (affiliateBlocks.length > 0 && contentBlocks.length > 0) {
      // 新しい順序: まとめH2 → 本文 → アフィリエイトリンク
      const reorganized = [
        newBody[matomeIndex], // まとめH2
        ...contentBlocks,     // まとめ本文
        ...affiliateBlocks    // アフィリエイトリンク
      ]

      // 元のまとめセクションを削除して、新しい順序で挿入
      newBody.splice(matomeIndex, matomeEndIndex - matomeIndex, ...reorganized)

      modified = true
      console.log('✅ ' + post.title)
      console.log('   本文ブロック: ' + contentBlocks.length + '個')
      console.log('   アフィリエイトリンク: ' + affiliateBlocks.length + '個')
      console.log('   整理後: まとめH2 → 本文 → リンク')
      console.log()
    }

    if (modified) {
      await client.patch(post._id).set({ body: newBody }).commit()
      reorganizedCount++
    }
  }

  console.log(line)
  console.log('📊 整理完了')
  console.log(line)
  console.log('整理した記事数: ' + reorganizedCount)
  console.log()
}

reorganizeAffiliateLinks().catch(console.error)
