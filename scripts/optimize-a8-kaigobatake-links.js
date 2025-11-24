require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

// A8.net かいご畑のリンク
const KAIGOBATAKE_LINK = 'https://px.a8.net/svt/ejp?a8mat=2ZTT9A+D2Y8MQ+1W34+C8VWY'

async function optimizeKaigobatakeLinks() {
  const line = '='.repeat(60)
  console.log(line)
  console.log('🔧 かいご畑リンクの最適化')
  console.log(line)
  console.log()

  // A8.netリンクがある記事を取得
  const posts = await client.fetch(`*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body
  }`)

  let optimizedCount = 0
  const changes = []

  for (const post of posts) {
    if (!post.body || !Array.isArray(post.body)) continue

    let modified = false
    const newBody = [...post.body]
    let hasMoshimoLinks = false
    let hasKaigobatakeText = false
    let kaigobatakeBlockIndex = -1

    // Moshimoリンクの有無と「かいご畑」テキストの位置を確認
    for (let i = 0; i < newBody.length; i++) {
      const block = newBody[i]

      if (block._type === 'block' && block.markDefs && block.markDefs.length > 0) {
        // Moshimoリンクの確認
        const hasMoshimo = block.markDefs.some(mark =>
          mark._type === 'link' && mark.href && mark.href.includes('moshimo')
        )
        if (hasMoshimo) hasMoshimoLinks = true
      }

      // 「かいご畑」テキストブロックの確認
      if (block._type === 'block' && block.children) {
        const blockText = block.children
          .filter(c => c._type === 'span')
          .map(c => c.text || '')
          .join('')

        if (blockText.includes('かいご畑')) {
          hasKaigobatakeText = true
          kaigobatakeBlockIndex = i
        }
      }
    }

    // 戦略: Moshimoリンクがあり、かいご畑テキストもある場合
    if (hasMoshimoLinks && hasKaigobatakeText && kaigobatakeBlockIndex >= 0) {
      const block = newBody[kaigobatakeBlockIndex]

      // 「かいご畑」見出しとテキストを削除して、シンプルなリンクに置き換え
      // より自然な文脈で1つだけ配置

      // 新しいブロック: さりげないテキストリンク
      const linkKey = 'link-kaigobatake-' + Math.random().toString(36).substr(2, 9)
      const newBlock = {
        _type: 'block',
        _key: 'block-' + Math.random().toString(36).substr(2, 9),
        style: 'normal',
        markDefs: [{
          _key: linkKey,
          _type: 'link',
          href: KAIGOBATAKE_LINK
        }],
        children: [
          {
            _type: 'span',
            _key: 'span-' + Math.random().toString(36).substr(2, 9),
            text: '💼 介護職専門の転職サポート「',
            marks: []
          },
          {
            _type: 'span',
            _key: 'span-' + Math.random().toString(36).substr(2, 9),
            text: 'かいご畑',
            marks: [linkKey]
          },
          {
            _type: 'span',
            _key: 'span-' + Math.random().toString(36).substr(2, 9),
            text: '」で無料相談 [PR]',
            marks: []
          }
        ]
      }

      // 元の「かいご畑」セクションを削除
      // 見出し + 本文 + 箇条書き + [PR]の4-6ブロックを削除
      let deleteStart = kaigobatakeBlockIndex
      let deleteEnd = kaigobatakeBlockIndex

      // 前に見出しがあるか確認
      if (deleteStart > 0 && newBody[deleteStart - 1]._type === 'block' &&
          newBody[deleteStart - 1].style && newBody[deleteStart - 1].style.startsWith('h')) {
        deleteStart--
      }

      // 後ろの関連ブロックを探す
      for (let i = kaigobatakeBlockIndex + 1; i < newBody.length && i < kaigobatakeBlockIndex + 10; i++) {
        const nextBlock = newBody[i]
        if (!nextBlock) break

        const blockText = nextBlock.children?.map(c => c.text || '').join('') || ''

        // [PR]だけのブロック、箇条書き、このサービスの特徴などを含む
        if (blockText.trim() === '[PR]' ||
            nextBlock.listItem ||
            blockText.includes('このサービスの特徴') ||
            blockText.includes('無資格') ||
            blockText.includes('資格取得') ||
            blockText.includes('完全無料')) {
          deleteEnd = i
        } else {
          break
        }
      }

      // 削除して新しいブロックを挿入
      newBody.splice(deleteStart, deleteEnd - deleteStart + 1, newBlock)

      modified = true
      changes.push({
        title: post.title,
        slug: post.slug,
        action: '「かいご畑」セクションを簡潔なリンクに置き換え',
        deletedBlocks: deleteEnd - deleteStart + 1
      })
    }

    if (modified) {
      await client.patch(post._id).set({ body: newBody }).commit()
      optimizedCount++
      console.log('✅ ' + post.title)
      console.log('   削除ブロック数: ' + changes[changes.length - 1].deletedBlocks)
      console.log('   新規: シンプルなテキストリンク1行')
      console.log()
    }
  }

  console.log(line)
  console.log('📊 最適化完了')
  console.log(line)
  console.log('最適化された記事: ' + optimizedCount + '件')
  console.log()

  if (changes.length > 0) {
    console.log('変更詳細:')
    changes.forEach((change, i) => {
      console.log((i + 1) + '. ' + change.title)
      console.log('   ' + change.action)
    })
  }
  console.log()
}

optimizeKaigobatakeLinks().catch(console.error)
