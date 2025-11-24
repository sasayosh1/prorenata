require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

const CAREER_COMPARISON_SLUG = 'nursing-assistant-compare-services-perspective'
const RESIGNATION_COMPARISON_SLUG = 'comparison-of-three-resignation-agencies'

// 転職・退職関連のキーワード
const CAREER_KEYWORDS = ['転職', 'キャリア', '求人', 'career-change', 'job-change']
const RESIGNATION_KEYWORDS = ['退職', '辞めたい', 'quit', 'resignation', '離職']

async function fixCareerAffiliateLinks() {
  console.log('🔍 転職・退職記事のアフィリエイトリンクをチェック中...\n')

  // 全記事を取得
  const posts = await client.fetch(`*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body,
    categories[]-> {
      title
    }
  }`)

  const careerPosts = []
  const resignationPosts = []
  const postsToUpdate = []

  for (const post of posts) {
    if (!post.body || !Array.isArray(post.body)) continue

    const titleLower = post.title.toLowerCase()
    const categoryTitles = (post.categories || []).map(c => c.title || '').join(' ')

    // 本文からテキストを抽出
    let bodyText = ''
    for (const block of post.body) {
      if (block._type === 'block' && block.children) {
        bodyText += block.children
          .filter(c => c._type === 'span')
          .map(c => c.text || '')
          .join('')
      }
    }
    const bodyLower = bodyText.toLowerCase()

    // 転職記事の判定
    const isCareerPost = CAREER_KEYWORDS.some(keyword =>
      titleLower.includes(keyword) || bodyLower.includes(keyword) || categoryTitles.includes(keyword)
    )

    // 退職記事の判定
    const isResignationPost = RESIGNATION_KEYWORDS.some(keyword =>
      titleLower.includes(keyword) || bodyLower.includes(keyword) || categoryTitles.includes(keyword)
    )

    // アフィリエイトリンクの有無をチェック
    let hasAffiliateLinks = false
    let hasCareerComparison = false
    let hasResignationComparison = false

    for (const block of post.body) {
      // affiliateEmbed タイプのチェック
      if (block._type === 'affiliateEmbed') {
        hasAffiliateLinks = true
      }

      // 内部リンクのチェック
      if (block._type === 'block' && block.markDefs) {
        for (const mark of block.markDefs) {
          if (mark._type === 'link' && mark.href) {
            if (mark.href.includes(CAREER_COMPARISON_SLUG)) {
              hasCareerComparison = true
            }
            if (mark.href.includes(RESIGNATION_COMPARISON_SLUG)) {
              hasResignationComparison = true
            }
          }
        }
      }
    }

    if (isCareerPost && hasAffiliateLinks && !hasCareerComparison) {
      careerPosts.push({
        id: post._id,
        title: post.title,
        slug: post.slug,
        needsUpdate: true
      })
      postsToUpdate.push({
        id: post._id,
        title: post.title,
        slug: post.slug,
        type: 'career'
      })
    } else if (isCareerPost && hasCareerComparison) {
      careerPosts.push({
        id: post._id,
        title: post.title,
        slug: post.slug,
        needsUpdate: false
      })
    }

    if (isResignationPost && hasAffiliateLinks && !hasResignationComparison) {
      resignationPosts.push({
        id: post._id,
        title: post.title,
        slug: post.slug,
        needsUpdate: true
      })
      if (!postsToUpdate.find(p => p.id === post._id)) {
        postsToUpdate.push({
          id: post._id,
          title: post.title,
          slug: post.slug,
          type: 'resignation'
        })
      }
    } else if (isResignationPost && hasResignationComparison) {
      resignationPosts.push({
        id: post._id,
        title: post.title,
        slug: post.slug,
        needsUpdate: false
      })
    }
  }

  // レポート出力
  console.log('=' .repeat(60))
  console.log('📊 チェック結果')
  console.log('=' .repeat(60))
  console.log(`総記事数: ${posts.length}`)
  console.log(`転職記事: ${careerPosts.length}件（修正必要: ${careerPosts.filter(p => p.needsUpdate).length}件）`)
  console.log(`退職記事: ${resignationPosts.length}件（修正必要: ${resignationPosts.filter(p => p.needsUpdate).length}件）`)
  console.log(`修正が必要な記事: ${postsToUpdate.length}件`)
  console.log()

  if (careerPosts.length > 0) {
    console.log('【転職記事】')
    careerPosts.forEach((post, i) => {
      console.log(`${i + 1}. ${post.title}`)
      console.log(`   スラッグ: ${post.slug}`)
      console.log(`   ${post.needsUpdate ? '⚠️  修正必要: アフィリエイトリンクを削除し、比較記事への内部リンクを追加' : '✅ 正しく設定済み'}`)
      console.log()
    })
  }

  if (resignationPosts.length > 0) {
    console.log('【退職記事】')
    resignationPosts.forEach((post, i) => {
      console.log(`${i + 1}. ${post.title}`)
      console.log(`   スラッグ: ${post.slug}`)
      console.log(`   ${post.needsUpdate ? '⚠️  修正必要: アフィリエイトリンクを削除し、比較記事への内部リンクを追加' : '✅ 正しく設定済み'}`)
      console.log()
    })
  }

  return { careerPosts, resignationPosts, postsToUpdate }
}

async function updatePost(postId, type) {
  const post = await client.fetch(`*[_id == $postId][0] { _id, title, body }`, { postId })
  if (!post || !post.body) return false

  const newBody = []
  let summaryIndex = -1
  let disclaimerIndex = -1
  let wordCount = 0

  // 本文を走査してまとめと免責事項の位置を特定、アフィリエイトリンクを削除
  for (let i = 0; i < post.body.length; i++) {
    const block = post.body[i]

    // affiliateEmbed を削除
    if (block._type === 'affiliateEmbed') {
      continue // このブロックはスキップ
    }

    // まとめセクションを検出
    if (block._type === 'block' && block.style === 'h2') {
      const text = block.children?.map(c => c.text || '').join('') || ''
      if (text.includes('まとめ')) {
        summaryIndex = newBody.length
      }
    }

    // 免責事項を検出
    if (block._type === 'block' && block.children) {
      const text = block.children.map(c => c.text || '').join('')
      if (text.startsWith('免責事項:')) {
        disclaimerIndex = newBody.length
      }
    }

    // 文字数カウント（本文のみ）
    if (block._type === 'block' && block.children) {
      wordCount += block.children.map(c => c.text || '').join('').length
    }

    newBody.push(block)
  }

  // 内部リンクブロックを作成
  const comparisonSlug = type === 'career' ? CAREER_COMPARISON_SLUG : RESIGNATION_COMPARISON_SLUG
  const linkText = type === 'career'
    ? '看護助手の転職サービス３社を "看護助手の視点だけ" で比較'
    : '退職代行３社のメリット・デメリット徹底比較'

  const linkKey = 'link-' + Math.random().toString(36).substr(2, 9)
  const internalLinkBlock = {
    _type: 'block',
    _key: 'block-' + Math.random().toString(36).substr(2, 9),
    style: 'normal',
    markDefs: [{
      _key: linkKey,
      _type: 'link',
      href: `/posts/${comparisonSlug}`
    }],
    children: [
      {
        _type: 'span',
        _key: 'span-' + Math.random().toString(36).substr(2, 9),
        text: '📊 ',
        marks: []
      },
      {
        _type: 'span',
        _key: 'span-' + Math.random().toString(36).substr(2, 9),
        text: linkText,
        marks: [linkKey]
      }
    ]
  }

  // まとめの後、免責事項の前に内部リンクを挿入
  if (disclaimerIndex !== -1) {
    newBody.splice(disclaimerIndex, 0, internalLinkBlock)
  } else if (summaryIndex !== -1) {
    newBody.splice(summaryIndex + 1, 0, internalLinkBlock)
  } else {
    // まとめも免責事項もない場合は末尾に追加
    newBody.push(internalLinkBlock)
  }

  // 長文記事（2000文字以上）の場合、中盤にも1箇所追加
  if (wordCount >= 2000 && summaryIndex !== -1) {
    const midPoint = Math.floor(summaryIndex / 2)
    const midLinkBlock = { ...internalLinkBlock, _key: 'block-' + Math.random().toString(36).substr(2, 9) }
    newBody.splice(midPoint, 0, midLinkBlock)
  }

  // 更新
  await client.patch(postId).set({ body: newBody }).commit()
  return true
}

async function main() {
  const { postsToUpdate } = await fixCareerAffiliateLinks()

  if (postsToUpdate.length === 0) {
    console.log('✅ すべての記事が正しく設定されています！')
    return
  }

  console.log(`\n🔧 ${postsToUpdate.length}件の記事を修正します...\n`)

  for (const post of postsToUpdate) {
    try {
      await updatePost(post.id, post.type)
      console.log(`✅ ${post.title}`)
    } catch (error) {
      console.error(`❌ エラー: ${post.title}`)
      console.error(error)
    }
  }

  console.log(`\n✅ ${postsToUpdate.length}件の修正が完了しました！`)
}

main().catch(console.error)
