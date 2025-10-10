require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

async function fixH2AfterMatome() {
  const line = '='.repeat(60)
  console.log(line)
  console.log('🔧 まとめ後のH2見出しをH3に変更')
  console.log(line)
  console.log()

  const posts = await client.fetch(`*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body
  }`)

  let fixedCount = 0
  const changes = []

  for (const post of posts) {
    if (!post.body || !Array.isArray(post.body)) continue

    let modified = false
    const newBody = [...post.body]

    // 「まとめ」H2見出しを探す
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

    if (matomeIndex === -1) continue // まとめがない記事はスキップ

    // まとめの後ろのH2見出しを探してH3に変更
    const h2sToFix = []

    for (let i = matomeIndex + 1; i < newBody.length; i++) {
      const block = newBody[i]

      // nextStepsカードが来たら終了
      if (block._type === 'nextSteps') break

      // H2見出しを発見
      if (block._type === 'block' && block.style === 'h2' && block.children) {
        const heading = block.children.map(c => c.text || '').join('')

        // H3に変更
        newBody[i] = {
          ...block,
          style: 'h3'
        }

        h2sToFix.push({
          index: i,
          text: heading
        })

        modified = true
      }
    }

    if (modified) {
      await client.patch(post._id).set({ body: newBody }).commit()
      fixedCount++

      console.log('✅ ' + post.title)
      h2sToFix.forEach(item => {
        console.log('   [' + item.index + '] H2 → H3: ' + item.text)
      })
      console.log()

      changes.push({
        title: post.title,
        slug: post.slug,
        fixedHeadings: h2sToFix
      })
    }
  }

  console.log(line)
  console.log('📊 修正完了')
  console.log(line)
  console.log('修正した記事数: ' + fixedCount)
  console.log('変更した見出し数: ' + changes.reduce((sum, c) => sum + c.fixedHeadings.length, 0))
  console.log()

  if (changes.length > 0) {
    console.log('詳細:')
    changes.forEach((change, i) => {
      console.log((i + 1) + '. ' + change.title)
      console.log('   見出し変更: ' + change.fixedHeadings.length + '個')
    })
    console.log()
  }
}

fixH2AfterMatome().catch(console.error)
