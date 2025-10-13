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

// 新しいアフィリエイトコード
const NEW_CODES = {
  albatross: {
    url: '//af.moshimo.com/af/c/click?a_id=5211244&p_id=5700&pc_id=15743&pl_id=74074',
    text: 'LINEのみで完結可能な転職サービス【アルバトロス転職】はこちら',
  },
  nursery: {
    url: '//ck.jp.ap.valuecommerce.com/servlet/referral?sid=3755453&pid=892161180',
    text: '看護助手向けワークシューズ・ケア用品なら【ナースリー】',
  },
  kaigobatake_new: {
    url: 'https://px.a8.net/svt/ejp?a8mat=2ZTT9A+D2Y8MQ+1W34+C8VWY',
    text: 'かいご畑',
  },
}

// 置き換え対象のパターン
const PATTERNS = {
  pasona: /a_id=5207867/,
  renewcare: /a_id=5207862/,
  claas: /a_id=5207866/,
  kaigobatake_old: /a8mat=3ZAXGX\+DKVSUA/,
}

async function replaceAffiliateLinks() {
  console.log('🔄 アフィリエイトリンク一括置き換え開始\n')
  console.log('⚠️  この操作は最重要インシデント級です。慎重に実行します。\n')
  console.log('='.repeat(80))

  const posts = await client.fetch(query)

  let totalUpdated = 0
  const updatedPosts = []
  const stats = {
    pasona: 0,
    renewcare: 0,
    claas: 0,
    kaigobatake_old: 0,
  }

  for (const post of posts) {
    if (!post.body) continue

    let postUpdated = false
    let changesInPost = 0

    post.body.forEach(block => {
      if (block._type === 'block' && block.markDefs) {
        block.markDefs.forEach(mark => {
          if (mark._type === 'link' && mark.href) {
            let replaced = false
            let replacementType = ''

            // 1. パソナライフケア → アルバトロス転職
            if (PATTERNS.pasona.test(mark.href)) {
              console.log(`\n📝 [${post.title}]`)
              console.log(`   旧: ${mark.href}`)
              console.log(`   新: ${NEW_CODES.albatross.url}`)

              mark.href = NEW_CODES.albatross.url

              // テキストも更新
              block.children.forEach(child => {
                if (child.marks && child.marks.includes(mark._key)) {
                  child.text = NEW_CODES.albatross.text
                }
              })

              replaced = true
              replacementType = 'パソナ→アルバトロス'
              stats.pasona++
            }

            // 2. リニューケア → アルバトロス転職
            if (PATTERNS.renewcare.test(mark.href)) {
              console.log(`\n📝 [${post.title}]`)
              console.log(`   旧: ${mark.href}`)
              console.log(`   新: ${NEW_CODES.albatross.url}`)

              mark.href = NEW_CODES.albatross.url

              // テキストも更新（リニューケアの文脈に合わせる）
              block.children.forEach(child => {
                if (child.marks && child.marks.includes(mark._key)) {
                  child.text = 'LINEで気軽に相談できる転職サービス【アルバトロス転職】はこちら'
                }
              })

              replaced = true
              replacementType = 'リニュー→アルバトロス'
              stats.renewcare++
            }

            // 3. クラースショップ → ナースリー
            if (PATTERNS.claas.test(mark.href)) {
              console.log(`\n📝 [${post.title}]`)
              console.log(`   旧: ${mark.href}`)
              console.log(`   新: ${NEW_CODES.nursery.url}`)

              mark.href = NEW_CODES.nursery.url

              // テキストも更新
              block.children.forEach(child => {
                if (child.marks && child.marks.includes(mark._key)) {
                  child.text = NEW_CODES.nursery.text
                }
              })

              replaced = true
              replacementType = 'クラース→ナースリー'
              stats.claas++
            }

            // 4. かいご畑 旧コード → 新コード
            if (PATTERNS.kaigobatake_old.test(mark.href)) {
              console.log(`\n📝 [${post.title}]`)
              console.log(`   旧: ${mark.href}`)
              console.log(`   新: ${NEW_CODES.kaigobatake_new.url}`)

              mark.href = NEW_CODES.kaigobatake_new.url
              // テキストはそのまま（「かいご畑」）

              replaced = true
              replacementType = 'かいご畑コード更新'
              stats.kaigobatake_old++
            }

            if (replaced) {
              console.log(`   種類: ${replacementType}`)
              postUpdated = true
              changesInPost++
              totalUpdated++
            }
          }
        })
      }
    })

    if (postUpdated) {
      updatedPosts.push({
        _id: post._id,
        title: post.title,
        slug: post.slug,
        changes: changesInPost,
        body: post.body,
      })
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log(`\n📊 置き換え統計:`)
  console.log(`パソナライフケア → アルバトロス転職: ${stats.pasona}件`)
  console.log(`リニューケア → アルバトロス転職: ${stats.renewcare}件`)
  console.log(`クラースショップ → ナースリー: ${stats.claas}件`)
  console.log(`かいご畑コード更新: ${stats.kaigobatake_old}件`)
  console.log(`\n更新対象記事: ${updatedPosts.length}件`)
  console.log(`総置き換えリンク数: ${totalUpdated}件`)

  if (updatedPosts.length === 0) {
    console.log('\n✅ 置き換え対象のリンクはありません')
    return
  }

  console.log('\n🔄 Sanityに変更を保存中...\n')

  let successCount = 0
  let failCount = 0
  const errors = []

  for (const post of updatedPosts) {
    try {
      await client
        .patch(post._id)
        .set({ body: post.body })
        .commit()

      console.log(`✅ ${post.title} (${post.changes}件のリンクを更新)`)
      successCount++
    } catch (error) {
      console.error(`❌ ${post.title}: ${error.message}`)
      errors.push({ title: post.title, error: error.message })
      failCount++
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log(`\n✅ 更新成功: ${successCount}件`)
  console.log(`❌ 更新失敗: ${failCount}件`)
  console.log(`📊 総置き換えリンク数: ${totalUpdated}件`)

  if (errors.length > 0) {
    console.log('\n⚠️  エラー詳細:')
    errors.forEach(err => {
      console.log(`  - ${err.title}: ${err.error}`)
    })
  }

  if (failCount === 0) {
    console.log('\n🎉 すべてのアフィリエイトリンクの置き換えが完了しました！')
  } else {
    console.log('\n⚠️  一部のリンク置き換えに失敗しました。エラーを確認してください。')
  }
}

replaceAffiliateLinks().catch(console.error)
