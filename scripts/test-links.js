/**
 * リンクテストスクリプト - ホームページと記事ページをテスト
 */

const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

async function testLinks() {
  console.log('\n🔗 リンクテスト開始\n')
  console.log('=' .repeat(60))

  try {
    // ホームページの最新記事を取得
    const posts = await client.fetch(`*[_type == "post"]
      | order(_createdAt desc) [0...5] {
        title,
        "slug": slug.current,
        excerpt,
        "hasBody": defined(body[0])
      }`)

    console.log(`\n📄 最新記事 (${posts.length}件):\n`)

    posts.forEach((post, index) => {
      const status = post.hasBody ? '✅' : '❌'
      console.log(`${index + 1}. ${status} ${post.title}`)
      console.log(`   URL: /posts/${post.slug}`)
      console.log(`   本文: ${post.hasBody ? 'あり' : 'なし'}`)
      if (post.excerpt) {
        console.log(`   抜粋: ${post.excerpt.substring(0, 50)}...`)
      }
      console.log()
    })

    // 人気記事を取得
    const popularPosts = await client.fetch(`*[_type == "post" && defined(views)]
      | order(views desc) [0...5] {
        title,
        "slug": slug.current,
        views,
        "hasBody": defined(body[0])
      }`)

    console.log(`\n🏆 人気記事 (${popularPosts.length}件):\n`)

    popularPosts.forEach((post, index) => {
      const status = post.hasBody ? '✅' : '❌'
      console.log(`${index + 1}. ${status} ${post.title}`)
      console.log(`   URL: /posts/${post.slug}`)
      console.log(`   閲覧数: ${post.views}`)
      console.log(`   本文: ${post.hasBody ? 'あり' : 'なし'}`)
      console.log()
    })

    // サマリー
    const totalPosts = await client.fetch(`count(*[_type == "post"])`)
    const postsWithBody = await client.fetch(`count(*[_type == "post" && defined(body[0])])`)
    const postsWithViews = await client.fetch(`count(*[_type == "post" && defined(views)])`)

    console.log('=' .repeat(60))
    console.log('📊 サイト統計')
    console.log('=' .repeat(60))
    console.log(`総記事数: ${totalPosts}件`)
    console.log(`本文あり: ${postsWithBody}件 (${(postsWithBody/totalPosts*100).toFixed(1)}%)`)
    console.log(`閲覧数記録: ${postsWithViews}件 (${(postsWithViews/totalPosts*100).toFixed(1)}%)`)
    console.log('=' .repeat(60) + '\n')

    console.log('✅ リンクテスト完了')
    console.log('\n💡 確認方法:')
    console.log('   1. http://localhost:3000 でホームページを開く')
    console.log('   2. 最新記事のリンクをクリック')
    console.log('   3. 人気記事ランキングのリンクをクリック')
    console.log('   4. フッターのサイトマップから記事へアクセス\n')

  } catch (error) {
    console.error('❌ エラー:', error.message)
    throw error
  }
}

if (require.main === module) {
  testLinks().catch(console.error)
}

module.exports = { testLinks }
