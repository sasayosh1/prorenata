require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const { MOSHIMO_LINKS } = require('./moshimo-affiliate-links')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

// 退職代行リンク用のPortable Textブロックを生成
function createTaishokudaikouBlock() {
  const link = MOSHIMO_LINKS.taishokudaikou
  const blockKey = 'block-' + Math.random().toString(36).substr(2, 9)
  const linkKey = 'link-' + Math.random().toString(36).substr(2, 9)

  return {
    _type: 'block',
    _key: blockKey,
    style: 'normal',
    markDefs: [{
      _key: linkKey,
      _type: 'link',
      href: link.url
    }],
    children: [
      {
        _type: 'span',
        _key: 'span-' + Math.random().toString(36).substr(2, 9),
        text: link.appealText + '： ',
        marks: []
      },
      {
        _type: 'span',
        _key: 'span-' + Math.random().toString(36).substr(2, 9),
        text: link.linkText,
        marks: [linkKey]
      },
      {
        _type: 'span',
        _key: 'span-' + Math.random().toString(36).substr(2, 9),
        text: ' [PR]',
        marks: []
      }
    ]
  }
}

async function addTaishokudaikouLinks() {
  const line = '='.repeat(60)
  console.log(line)
  console.log('🔗 退職代行サービスリンクの追加')
  console.log(line)
  console.log()

  // 退職関連キーワードを含む記事を取得
  const posts = await client.fetch(`*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body
  }`)

  let addedCount = 0
  const targetKeywords = ['辞めたい', '退職', '辞める', '辞め方']

  for (const post of posts) {
    // タイトルに退職関連キーワードがあるか確認
    const hasTargetKeyword = targetKeywords.some(keyword =>
      post.title.includes(keyword)
    )

    if (!hasTargetKeyword || !post.body) continue

    // 既に退職代行リンクがあるかチェック
    const alreadyHasLink = post.body.some(block =>
      block.markDefs?.some(mark =>
        mark._type === 'link' && mark.href?.includes('tcs-asp.net')
      )
    )

    if (alreadyHasLink) {
      console.log('⏭️  スキップ: ' + post.title + ' (既にリンクあり)')
      continue
    }

    // 記事末尾から適切な挿入位置を見つける
    // 次のステップカードの前（記事本文の最後）
    let insertIndex = post.body.length

    // 末尾から遡って、最後の本文ブロックの後ろを探す
    for (let i = post.body.length - 1; i >= 0; i--) {
      const block = post.body[i]

      // nextStepsカスタムブロックの前に挿入
      if (block._type === 'nextSteps') {
        insertIndex = i
        break
      }

      // H2見出しがあればその後ろに挿入
      if (block._type === 'block' && block.style === 'h2') {
        insertIndex = i + 1
        break
      }
    }

    // 新しいリンクブロックを作成
    const newBlock = createTaishokudaikouBlock()

    // bodyに挿入
    const newBody = [...post.body]
    newBody.splice(insertIndex, 0, newBlock)

    // Sanityに保存
    await client.patch(post._id).set({ body: newBody }).commit()

    addedCount++
    console.log('✅ ' + post.title)
    console.log('   挿入位置: ブロック ' + insertIndex)
    console.log()
  }

  console.log(line)
  console.log('📊 追加完了')
  console.log(line)
  console.log('追加した記事数: ' + addedCount)
  console.log()
}

addTaishokudaikouLinks().catch(console.error)
