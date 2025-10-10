require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const fs = require('fs')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

async function fixPRMarkers() {
  const line = '='.repeat(60)
  console.log(line)
  console.log('🔧 [PR]マーカーの自動修正')
  console.log(line)
  console.log()

  // 問題のある記事を読み込み
  const issuesFile = require('path').resolve(__dirname, '../internal-links-analysis/missing-affiliate-links.json')
  const issues = JSON.parse(fs.readFileSync(issuesFile, 'utf8'))

  console.log('修正対象: ' + issues.length + '箇所\n')

  let fixedCount = 0

  for (const issue of issues) {
    try {
      const post = await client.fetch('*[_type == "post" && _id == $id][0] { _id, title, body }', { id: issue._id })
      
      if (!post || !post.body) continue

      const block = post.body[issue.blockIndex]
      if (!block || block._type !== 'block') continue

      // [PR]マーカーを削除
      const newChildren = block.children.map(child => {
        if (child._type !== 'span' || !child.text) return child

        // ※ [PR]表記のリンクは... というテキストを削除
        if (child.text.includes('※ [PR]表記のリンクはアフィリエイトリンクです')) {
          return null
        }

        // [PR] | [PR] だけの行を削除
        if (child.text.trim() === '[PR] | [PR]' || child.text.trim() === '[PR]') {
          return null
        }

        return child
      }).filter(Boolean)

      // ブロック全体が空になった場合はブロックを削除
      if (newChildren.length === 0 || (newChildren.length === 1 && !newChildren[0].text.trim())) {
        const newBody = post.body.filter((_, i) => i !== issue.blockIndex)
        
        await client.patch(issue._id).set({ body: newBody }).commit()
        console.log('✅ ' + post.title + ' - ブロック削除')
        fixedCount++
      } else {
        // 子要素を更新
        const newBlock = {
          ...block,
          children: newChildren,
          markDefs: []
        }

        const newBody = [...post.body]
        newBody[issue.blockIndex] = newBlock

        await client.patch(issue._id).set({ body: newBody }).commit()
        console.log('✅ ' + post.title + ' - マーカー削除')
        fixedCount++
      }

    } catch (error) {
      console.error('❌ エラー: ' + issue.title)
      console.error('   ' + error.message)
    }
  }

  console.log()
  console.log(line)
  console.log('📊 修正完了')
  console.log(line)
  console.log('修正件数: ' + fixedCount + '/' + issues.length + '箇所')
  console.log()
}

fixPRMarkers().catch(console.error)
