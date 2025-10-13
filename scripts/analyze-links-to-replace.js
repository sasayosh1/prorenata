import { createClient } from '@sanity/client'

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

const query = `*[_type == "post"] {
  _id,
  title,
  "slug": slug.current,
  body
}`

// 削除・置き換え対象のパターン
const targetPatterns = {
  pasona: /a_id=5207867/,
  renewcare: /a_id=5207862/,
  claas: /a_id=5207866/,
  kaigobatake_old: /a8mat=3ZAXGX\+DKVSUA/,
}

async function analyzeLinksToReplace() {
  console.log('📊 置き換え対象リンクの詳細分析\n')
  console.log('='.repeat(80))

  const posts = await client.fetch(query)

  const results = {
    pasona: [],
    renewcare: [],
    claas: [],
    kaigobatake_old: [],
  }

  posts.forEach(post => {
    if (!post.body) return

    post.body.forEach((block, blockIndex) => {
      if (block._type === 'block' && block.markDefs) {
        block.markDefs.forEach(mark => {
          if (mark._type === 'link' && mark.href) {
            // リンクテキストを取得
            let linkText = ''
            block.children.forEach(child => {
              if (child.marks && child.marks.includes(mark._key)) {
                linkText += child.text || ''
              }
            })

            // 各パターンをチェック
            if (targetPatterns.pasona.test(mark.href)) {
              results.pasona.push({
                post: post.title,
                slug: post.slug,
                linkText,
                href: mark.href,
                blockIndex,
              })
            }
            if (targetPatterns.renewcare.test(mark.href)) {
              results.renewcare.push({
                post: post.title,
                slug: post.slug,
                linkText,
                href: mark.href,
                blockIndex,
              })
            }
            if (targetPatterns.claas.test(mark.href)) {
              results.claas.push({
                post: post.title,
                slug: post.slug,
                linkText,
                href: mark.href,
                blockIndex,
              })
            }
            if (targetPatterns.kaigobatake_old.test(mark.href)) {
              results.kaigobatake_old.push({
                post: post.title,
                slug: post.slug,
                linkText,
                href: mark.href,
                blockIndex,
              })
            }
          }
        })
      }
    })
  })

  // 結果を表示
  console.log('\n【1. パソナライフケア】(a_id=5207867) - 削除対象')
  console.log(`総数: ${results.pasona.length}件\n`)
  results.pasona.forEach((item, i) => {
    console.log(`${i + 1}. ${item.post}`)
    console.log(`   Slug: ${item.slug}`)
    console.log(`   リンクテキスト: "${item.linkText}"`)
    console.log(`   ブロック位置: ${item.blockIndex}`)
    console.log('')
  })

  console.log('\n' + '='.repeat(80))
  console.log('\n【2. リニューケア】(a_id=5207862) - 削除対象')
  console.log(`総数: ${results.renewcare.length}件\n`)
  results.renewcare.forEach((item, i) => {
    console.log(`${i + 1}. ${item.post}`)
    console.log(`   Slug: ${item.slug}`)
    console.log(`   リンクテキスト: "${item.linkText}"`)
    console.log(`   ブロック位置: ${item.blockIndex}`)
    console.log('')
  })

  console.log('\n' + '='.repeat(80))
  console.log('\n【3. クラースショップ】(a_id=5207866) - 削除対象')
  console.log(`総数: ${results.claas.length}件\n`)
  results.claas.forEach((item, i) => {
    console.log(`${i + 1}. ${item.post}`)
    console.log(`   Slug: ${item.slug}`)
    console.log(`   リンクテキスト: "${item.linkText}"`)
    console.log(`   ブロック位置: ${item.blockIndex}`)
    console.log('')
  })

  console.log('\n' + '='.repeat(80))
  console.log('\n【4. かいご畑（旧コード）】(a8mat=3ZAXGX) - 新コードに置き換え')
  console.log(`総数: ${results.kaigobatake_old.length}件\n`)
  results.kaigobatake_old.forEach((item, i) => {
    console.log(`${i + 1}. ${item.post}`)
    console.log(`   Slug: ${item.slug}`)
    console.log(`   リンクテキスト: "${item.linkText}"`)
    console.log(`   ブロック位置: ${item.blockIndex}`)
    console.log('')
  })

  console.log('\n' + '='.repeat(80))
  console.log('\n【サマリー】')
  console.log(`パソナライフケア: ${results.pasona.length}件`)
  console.log(`リニューケア: ${results.renewcare.length}件`)
  console.log(`クラースショップ: ${results.claas.length}件`)
  console.log(`かいご畑（旧）: ${results.kaigobatake_old.length}件`)
  console.log(`合計削除・置き換え: ${results.pasona.length + results.renewcare.length + results.claas.length + results.kaigobatake_old.length}件`)
}

analyzeLinksToReplace().catch(console.error)
