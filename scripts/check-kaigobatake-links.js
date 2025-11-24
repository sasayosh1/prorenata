require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

const CORRECT_CODE = '2ZTT9A+D2Y8MQ+1W34+C8VWY'
const WRONG_CODE_1 = '3ZAXGX+DKVSUA+5OUU+5YZ77'

async function checkKaigobatakeLinks() {
  console.log('🔍 「かいご畑」アフィリエイトリンクをチェック中...\n')

  // 全記事を取得
  const posts = await client.fetch(`*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body
  }`)

  const postsWithKaigobatake = []
  const postsNeedingUpdate = []

  for (const post of posts) {
    if (!post.body || !Array.isArray(post.body)) continue

    let hasKaigobatake = false
    let needsUpdate = false
    const issues = []

    // 本文を走査
    for (const block of post.body) {
      if (block._type === 'block') {
        // markDefsをチェック
        if (block.markDefs && Array.isArray(block.markDefs)) {
          for (const mark of block.markDefs) {
            if (mark._type === 'link' && mark.href) {
              const href = mark.href

              // かいご畑のリンクを検出
              if (href.includes('px.a8.net') && href.includes('1W34+C8VWY')) {
                hasKaigobatake = true

                // 正しいコードかチェック
                if (href.includes(CORRECT_CODE)) {
                  // OK
                } else {
                  needsUpdate = true
                  issues.push('リンクに間違ったコードが含まれています')
                }
              }

              // 間違ったコードを検出
              if (href.includes(WRONG_CODE_1)) {
                hasKaigobatake = true
                needsUpdate = true
                issues.push(`間違ったコード ${WRONG_CODE_1} を検出`)
              }
            }
          }
        }

        // テキスト内容をチェック（トラッキングピクセルなど）
        if (block.children && Array.isArray(block.children)) {
          const blockText = block.children
            .filter(c => c._type === 'span')
            .map(c => c.text || '')
            .join('')

          // トラッキングピクセルの間違ったドメインをチェック
          if (blockText.includes('www15.a8.net') || blockText.includes('www18.a8.net')) {
            if (blockText.includes(CORRECT_CODE)) {
              hasKaigobatake = true
              needsUpdate = true
              issues.push('トラッキングピクセルのドメインが間違っています（www15またはwww18）')
            }
          }
        }
      }

      // affiliateEmbed タイプもチェック
      if (block._type === 'affiliateEmbed' && block.html) {
        if (block.html.includes('かいご畑') || block.html.includes(CORRECT_CODE) || block.html.includes(WRONG_CODE_1)) {
          hasKaigobatake = true

          if (block.html.includes(WRONG_CODE_1)) {
            needsUpdate = true
            issues.push(`affiliateEmbedに間違ったコード ${WRONG_CODE_1} を検出`)
          }

          if (block.html.includes('www15.a8.net') || block.html.includes('www18.a8.net')) {
            needsUpdate = true
            issues.push('affiliateEmbedのトラッキングピクセルドメインが間違っています')
          }
        }
      }
    }

    if (hasKaigobatake) {
      postsWithKaigobatake.push({
        id: post._id,
        title: post.title,
        slug: post.slug,
        needsUpdate,
        issues
      })

      if (needsUpdate) {
        postsNeedingUpdate.push({
          id: post._id,
          title: post.title,
          slug: post.slug,
          issues
        })
      }
    }
  }

  // レポート出力
  console.log('=' .repeat(60))
  console.log('📊 チェック結果')
  console.log('=' .repeat(60))
  console.log(`総記事数: ${posts.length}`)
  console.log(`「かいご畑」リンクを含む記事: ${postsWithKaigobatake.length}`)
  console.log(`修正が必要な記事: ${postsNeedingUpdate.length}`)
  console.log()

  if (postsWithKaigobatake.length > 0) {
    console.log('「かいご畑」リンクを含む記事:')
    postsWithKaigobatake.forEach((post, i) => {
      console.log(`${i + 1}. ${post.title}`)
      console.log(`   スラッグ: ${post.slug}`)
      if (post.needsUpdate) {
        console.log('   ⚠️  修正必要:')
        post.issues.forEach(issue => console.log(`      - ${issue}`))
      } else {
        console.log('   ✅ 正しいコードを使用')
      }
      console.log()
    })
  }

  if (postsNeedingUpdate.length === 0) {
    console.log('✅ すべての記事が正しいコードを使用しています！')
  }

  return { postsWithKaigobatake, postsNeedingUpdate }
}

checkKaigobatakeLinks().catch(console.error)
