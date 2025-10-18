/**
 * 記事メンテナンスツール
 *
 * 記事の品質チェック・修正支援ツール
 * - 古い記事の検出
 * - メタデータ不足の記事検出
 * - 画像なし記事の検出
 * - 文字数不足の記事検出
 */

const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

/**
 * 古い記事を検出（6ヶ月以上更新なし）
 */
async function findOldPosts(months = 6) {
  const monthsAgo = new Date()
  monthsAgo.setMonth(monthsAgo.getMonth() - months)
  const cutoffDate = monthsAgo.toISOString()

  const query = `*[_type == "post"
    && _updatedAt < $cutoffDate
  ] | order(_updatedAt asc) {
    _id,
    title,
    "slug": slug.current,
    _createdAt,
    _updatedAt,
    publishedAt,
    "categories": categories[]->title
  }`

  try {
    const posts = await client.fetch(query, { cutoffDate })

    console.log(`\n📅 ${months}ヶ月以上更新されていない記事: ${posts.length}件\n`)

    if (posts.length > 0) {
      posts.slice(0, 10).forEach((post, i) => {
        const lastUpdate = new Date(post._updatedAt)
        const daysSince = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))

        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   最終更新: ${daysSince}日前 (${lastUpdate.toLocaleDateString('ja-JP')})`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}\n`)
      })

      if (posts.length > 10) {
        console.log(`   ... 他${posts.length - 10}件\n`)
      }
    }

    return posts
  } catch (error) {
    console.error('❌ エラー:', error.message)
    return []
  }
}

/**
 * 必須フィールドとメタデータの包括的チェック
 * Slug、Categories、Tags、Excerpt、Meta Descriptionを検証
 */
async function findPostsMissingMetadata() {
  const query = `*[_type == "post"] {
    _id,
    title,
    slug,
    excerpt,
    metaDescription,
    tags,
    "categories": categories[]->title
  }`

  try {
    const posts = await client.fetch(query)

    const issues = {
      noSlug: [],
      noCategories: [],
      noTags: [],
      noExcerpt: [],
      noMetaDescription: [],
      excerptTooShort: [],
      metaDescriptionTooShort: [],
      metaDescriptionTooLong: []
    }

    posts.forEach(post => {
      // Slug チェック
      if (!post.slug || !post.slug.current) {
        issues.noSlug.push(post)
      }

      // Categories チェック
      if (!post.categories || post.categories.length === 0) {
        issues.noCategories.push(post)
      }

      // Tags チェック
      if (!post.tags || post.tags.length === 0) {
        issues.noTags.push(post)
      }

      // Excerpt チェック
      if (!post.excerpt) {
        issues.noExcerpt.push(post)
      } else if (post.excerpt.length < 50) {
        issues.excerptTooShort.push({ ...post, excerptLength: post.excerpt.length })
      }

      // Meta Description チェック（SEO）
      if (!post.metaDescription) {
        issues.noMetaDescription.push(post)
      } else {
        const length = post.metaDescription.length
        if (length < 120) {
          issues.metaDescriptionTooShort.push({ ...post, metaLength: length })
        } else if (length > 160) {
          issues.metaDescriptionTooLong.push({ ...post, metaLength: length })
        }
      }
    })

    console.log('\n📋 必須フィールド・メタデータチェック:\n')
    console.log('【必須フィールド】')
    console.log(`  🔴 Slug なし: ${issues.noSlug.length}件`)
    console.log(`  🔴 Categories なし: ${issues.noCategories.length}件`)
    console.log(`  ⚠️  Tags なし: ${issues.noTags.length}件`)
    console.log(`  ⚠️  Excerpt なし: ${issues.noExcerpt.length}件`)
    console.log(`  ⚠️  Excerpt 短すぎ (<50文字): ${issues.excerptTooShort.length}件`)

    console.log('\n【SEO（Meta Description）】')
    console.log(`  🔴 Meta Description なし: ${issues.noMetaDescription.length}件`)
    console.log(`  ⚠️  Meta Description 短すぎ (<120文字): ${issues.metaDescriptionTooShort.length}件`)
    console.log(`  ⚠️  Meta Description 長すぎ (>160文字): ${issues.metaDescriptionTooLong.length}件`)

    const criticalIssues = new Set([
      ...issues.noSlug.map(p => p._id),
      ...issues.noCategories.map(p => p._id),
      ...issues.noMetaDescription.map(p => p._id)
    ]).size

    const totalIssues = new Set([
      ...issues.noSlug.map(p => p._id),
      ...issues.noCategories.map(p => p._id),
      ...issues.noTags.map(p => p._id),
      ...issues.noExcerpt.map(p => p._id),
      ...issues.noMetaDescription.map(p => p._id),
      ...issues.excerptTooShort.map(p => p._id),
      ...issues.metaDescriptionTooShort.map(p => p._id),
      ...issues.metaDescriptionTooLong.map(p => p._id)
    ]).size

    console.log(`\n  🔴 重大な問題: ${criticalIssues}件（Slug、Categories、Meta Description欠損）`)
    console.log(`  📊 合計: ${totalIssues}件の記事に何らかの不足\n`)

    // 最も問題が多い記事TOP10を表示
    const postIssueCount = {}
    posts.forEach(post => {
      let count = 0
      const problems = []

      if (!post.slug || !post.slug.current) { count++; problems.push('Slug') }
      if (!post.categories || post.categories.length === 0) { count++; problems.push('Categories') }
      if (!post.tags || post.tags.length === 0) { count++; problems.push('Tags') }
      if (!post.excerpt) { count++; problems.push('Excerpt') }
      else if (post.excerpt.length < 50) { count++; problems.push('Excerpt短') }
      if (!post.metaDescription) { count++; problems.push('MetaDesc') }
      else {
        const length = post.metaDescription.length
        if (length < 120) { count++; problems.push('MetaDesc短') }
        else if (length > 160) { count++; problems.push('MetaDesc長') }
      }

      if (count > 0) {
        postIssueCount[post._id] = { post, count, problems }
      }
    })

    const sorted = Object.values(postIssueCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    if (sorted.length > 0) {
      console.log('🎯 優先対応が必要な記事（TOP10）:\n')
      sorted.forEach((item, i) => {
        const { post, count, problems } = item

        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   不足項目(${count}): ${problems.join(', ')}`)
        console.log(`   URL: /posts/${post.slug?.current || 'N/A'}\n`)
      })
    }

    return issues
  } catch (error) {
    console.error('❌ エラー:', error.message)
    return null
  }
}

/**
 * 画像なし記事を検出
 */
async function findPostsWithoutImages() {
  const query = `*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    mainImage,
    "hasBodyImages": count(body[_type == "image"]) > 0,
    "categories": categories[]->title
  }`

  try {
    const posts = await client.fetch(query)

    const noMainImage = posts.filter(p => !p.mainImage)
    const noBodyImages = posts.filter(p => !p.hasBodyImages)
    const noImages = posts.filter(p => !p.mainImage && !p.hasBodyImages)

    console.log('\n🖼️  画像なしの記事:\n')
    console.log(`  ⚠️  メイン画像なし: ${noMainImage.length}件`)
    console.log(`  ⚠️  本文画像なし: ${noBodyImages.length}件`)
    console.log(`  🔴 画像が全くなし: ${noImages.length}件\n`)

    if (noImages.length > 0) {
      console.log('🎯 画像が全くない記事（最大10件）:\n')
      noImages.slice(0, 10).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}\n`)
      })
    }

    return { noMainImage, noBodyImages, noImages }
  } catch (error) {
    console.error('❌ エラー:', error.message)
    return null
  }
}

/**
 * 文字数不足の記事を検出
 * デフォルト: 2000文字未満（ユーザビリティ重視）
 */
async function findShortPosts(minChars = 2000) {
  const query = `*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body,
    "categories": categories[]->title
  }`

  try {
    const posts = await client.fetch(query)
    const shortPosts = []

    posts.forEach(post => {
      if (!post.body || !Array.isArray(post.body)) {
        shortPosts.push({ ...post, charCount: 0 })
        return
      }

      let charCount = 0
      post.body.forEach(block => {
        if (block._type === 'block' && block.children) {
          block.children.forEach(child => {
            if (child.text) {
              charCount += child.text.length
            }
          })
        }
      })

      if (charCount < minChars) {
        shortPosts.push({ ...post, charCount })
      }
    })

    shortPosts.sort((a, b) => a.charCount - b.charCount)

    console.log(`\n📏 文字数不足の記事（${minChars}文字未満）: ${shortPosts.length}件`)
    console.log('   ⚠️ 注意: ユーザビリティを最優先し、必要に応じて文字数よりも内容の質を重視してください\n')

    if (shortPosts.length > 0) {
      console.log('🎯 文字数が特に少ない記事（TOP10）:\n')
      shortPosts.slice(0, 10).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   文字数: ${post.charCount}文字`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}\n`)
      })
    }

    return shortPosts
  } catch (error) {
    console.error('❌ エラー:', error.message)
    return []
  }
}

/**
 * 次のステップセクションがない記事を検出
 */
async function findPostsWithoutNextSteps() {
  const query = `*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body,
    _createdAt,
    "categories": categories[]->title
  }`

  try {
    const posts = await client.fetch(query)
    const missingNextSteps = []

    posts.forEach(post => {
      if (!post.body || !Array.isArray(post.body)) {
        missingNextSteps.push(post)
        return
      }

      // 「次のステップ」H2見出しの検出
      const hasNextStepsH2 = post.body.some(block =>
        block._type === 'block' &&
        block.style === 'h2' &&
        block.children?.some(child =>
          child.text?.includes('次のステップ')
        )
      )

      if (!hasNextStepsH2) {
        missingNextSteps.push(post)
      }
    })

    // 作成日でソート（新しい記事順）
    missingNextSteps.sort((a, b) => new Date(b._createdAt) - new Date(a._createdAt))

    console.log(`\n🔗 「次のステップ」セクションがない記事: ${missingNextSteps.length}件\n`)

    if (missingNextSteps.length > 0) {
      console.log('🎯 最近作成された記事で「次のステップ」がない記事（TOP15）:\n')
      missingNextSteps.slice(0, 15).forEach((post, i) => {
        const createdDate = new Date(post._createdAt)
        const daysAgo = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24))

        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   作成日: ${daysAgo}日前 (${createdDate.toLocaleDateString('ja-JP')})`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}\n`)
      })

      if (missingNextSteps.length > 15) {
        console.log(`   ... 他${missingNextSteps.length - 15}件\n`)
      }
    }

    return missingNextSteps
  } catch (error) {
    console.error('❌ エラー:', error.message)
    return []
  }
}

/**
 * アフィリエイトリンクの適切性をチェック
 * 1. 記事内容とリンクの関連性
 * 2. 連続するアフィリエイトリンクの検出
 */
async function checkAffiliateLinks() {
  const query = `*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body,
    "categories": categories[]->title
  }`

  try {
    const posts = await client.fetch(query)
    const issues = {
      consecutiveLinks: [], // 連続リンク
      tooManyLinks: [],      // リンク数が多すぎる
      irrelevantLinks: []    // 記事内容と関連性が低い
    }

    posts.forEach(post => {
      if (!post.body || !Array.isArray(post.body)) return

      let affiliateCount = 0
      let lastWasAffiliate = false
      let consecutiveCount = 0
      const affiliateBlocks = []
      let inSelectionSection = false // 「〇〇選」セクション内かどうか

      post.body.forEach((block, index) => {
        // 「〇〇選」セクションの検出（H2見出しに「3選」「5選」などが含まれる）
        if (block._type === 'block' && block.style === 'h2') {
          const h2Text = block.children?.map(c => c.text).join('') || ''
          const matches = h2Text.match(/([0-9]+)選/)

          if (matches) {
            const count = parseInt(matches[1])
            // 10選までを「〇〇選」セクションとして認識
            inSelectionSection = (count >= 1 && count <= 10)
          } else {
            inSelectionSection = false
          }
        }

        // アフィリエイトリンクの検出
        const isAffiliate = block.markDefs?.some(def =>
          def._type === 'link' &&
          (def.href?.includes('af.moshimo.com') ||
           def.href?.includes('amazon.co.jp') ||
           def.href?.includes('tcs-asp.net'))
        )

        if (isAffiliate) {
          affiliateCount++
          affiliateBlocks.push({ index, block })

          if (lastWasAffiliate) {
            consecutiveCount++
          } else {
            consecutiveCount = 1
          }

          lastWasAffiliate = true
        } else {
          // コンテンツブロック（normal, h2, h3など）
          if (block._type === 'block' && block.style && block.style.match(/^(normal|h2|h3)$/)) {
            lastWasAffiliate = false
          }
        }

        // 連続アフィリエイトリンクの検出（2個以上）
        // ただし「〇〇選」セクション内は除外
        if (consecutiveCount >= 2 && !inSelectionSection && !issues.consecutiveLinks.some(p => p._id === post._id)) {
          issues.consecutiveLinks.push({
            ...post,
            consecutiveCount,
            exampleText: block.children?.map(c => c.text).join('').substring(0, 50)
          })
        }
      })

      // アフィリエイトリンク数チェック（4個以上）
      if (affiliateCount >= 4) {
        issues.tooManyLinks.push({
          ...post,
          affiliateCount
        })
      }

      // 記事内容との関連性チェック（簡易版）
      // 「資格」記事に退職代行リンクなど
      const titleLower = post.title.toLowerCase()
      const hasRetirementLink = affiliateBlocks.some(ab =>
        ab.block.children?.some(child =>
          child.text?.includes('退職代行') ||
          child.text?.includes('汐留パートナーズ')
        )
      )

      if (hasRetirementLink && !titleLower.includes('退職') && !titleLower.includes('辞め')) {
        issues.irrelevantLinks.push({
          ...post,
          linkType: '退職代行',
          reason: 'タイトルに「退職」「辞める」が含まれていないのに退職代行リンクがあります'
        })
      }
    })

    console.log('\n🔗 アフィリエイトリンクチェック:\n')
    console.log(`  🔴 連続するアフィリエイトリンク: ${issues.consecutiveLinks.length}件`)
    console.log(`  ⚠️  リンク数が多すぎる（4個以上）: ${issues.tooManyLinks.length}件`)
    console.log(`  ⚠️  記事内容と関連性が低い可能性: ${issues.irrelevantLinks.length}件\n`)

    if (issues.consecutiveLinks.length > 0) {
      console.log('🎯 連続するアフィリエイトリンクがある記事:\n')
      issues.consecutiveLinks.slice(0, 10).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   連続数: ${post.consecutiveCount}個`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}\n`)
      })
    }

    if (issues.tooManyLinks.length > 0) {
      console.log('🎯 アフィリエイトリンクが多すぎる記事:\n')
      issues.tooManyLinks.slice(0, 10).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   リンク数: ${post.affiliateCount}個（推奨: 2-3個）`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}\n`)
      })
    }

    if (issues.irrelevantLinks.length > 0) {
      console.log('🎯 記事内容と関連性が低い可能性のある記事:\n')
      issues.irrelevantLinks.slice(0, 10).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   リンク種別: ${post.linkType}`)
        console.log(`   理由: ${post.reason}`)
        console.log(`   URL: /posts/${post.slug}\n`)
      })
    }

    return issues
  } catch (error) {
    console.error('❌ エラー:', error.message)
    return null
  }
}

/**
 * YMYL（Your Money Your Life）対策チェック
 * 1. 断定表現の検出
 * 2. 統計データ・数字の出典確認（簡易版）
 * 3. 古い記事の検出（給与・法律情報）
 * 4. 医療行為に関する記述チェック
 */
async function checkYMYL() {
  const query = `*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body,
    _updatedAt,
    "categories": categories[]->title
  }`

  try {
    const posts = await client.fetch(query)
    const issues = {
      absoluteExpressions: [],    // 断定表現
      missingCitations: [],        // 出典なしの数字・統計
      oldArticles: [],             // 古い記事（6ヶ月以上）
      medicalProcedures: []        // 医療行為の誤記述の可能性
    }

    // 断定表現の禁止ワード
    const absoluteWords = [
      '絶対に', '絶対', '必ず', '確実に', '100%',
      '誰でも', 'すべての人が', '間違いなく', '完璧',
      '保証します', '必ず〜できます'
    ]

    // 統計キーワード（出典が必要）
    const statisticsKeywords = [
      '平均', '年収', '月給', '時給', '万円', '調査',
      'データ', '統計', '割合', '%', 'パーセント'
    ]

    // 医療行為の注意キーワード
    const medicalKeywords = [
      '注射', '採血', '点滴', '投薬', '診断', '処方',
      '医療行為', '治療'
    ]

    // 6ヶ月前の基準日
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    posts.forEach(post => {
      if (!post.body || !Array.isArray(post.body)) return

      // 本文テキストを抽出
      const bodyText = post.body
        .filter(block => block._type === 'block' && block.children)
        .map(block => block.children.map(child => child.text || '').join(''))
        .join('\n')

      // 1. 断定表現のチェック
      const foundAbsolutes = []
      absoluteWords.forEach(word => {
        if (bodyText.includes(word)) {
          foundAbsolutes.push(word)
        }
      })

      if (foundAbsolutes.length > 0) {
        issues.absoluteExpressions.push({
          ...post,
          foundWords: [...new Set(foundAbsolutes)], // 重複削除
          count: foundAbsolutes.length
        })
      }

      // 2. 統計データの出典確認（簡易版）
      // 統計キーワードを含むがリンクがないブロックを検出
      const hasStatistics = statisticsKeywords.some(keyword => bodyText.includes(keyword))

      if (hasStatistics) {
        const hasExternalLink = post.body.some(block =>
          block.markDefs?.some(def =>
            def._type === 'link' &&
            def.href &&
            (def.href.includes('mhlw.go.jp') ||      // 厚生労働省
             def.href.includes('meti.go.jp') ||      // 経済産業省
             def.href.includes('go.jp') ||           // その他官公庁
             def.href.includes('jil.go.jp'))         // 労働政策研究
          )
        )

        if (!hasExternalLink) {
          issues.missingCitations.push({
            ...post,
            reason: '統計データや数字が含まれていますが、公的機関へのリンクが見つかりません'
          })
        }
      }

      // 3. 古い記事の検出（給与・法律情報を含む記事）
      const lastUpdate = new Date(post._updatedAt)
      const isSalaryRelated = post.title.includes('給料') ||
                             post.title.includes('年収') ||
                             post.title.includes('月給') ||
                             bodyText.includes('平均年収') ||
                             bodyText.includes('平均月給')

      if (isSalaryRelated && lastUpdate < sixMonthsAgo) {
        const daysSince = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))
        issues.oldArticles.push({
          ...post,
          daysSinceUpdate: daysSince,
          reason: '給与・年収情報を含む記事は6ヶ月ごとの更新が推奨されます'
        })
      }

      // 4. 医療行為に関する記述チェック
      const hasMedicalKeywords = medicalKeywords.some(keyword => bodyText.includes(keyword))

      if (hasMedicalKeywords) {
        // 「できない」「禁止」などの否定表現があるかチェック
        const hasNegation = bodyText.includes('できません') ||
                           bodyText.includes('できない') ||
                           bodyText.includes('禁止') ||
                           bodyText.includes('行えません')

        if (!hasNegation) {
          issues.medicalProcedures.push({
            ...post,
            reason: '医療行為に関する記述がありますが、看護助手ができないことを明記していない可能性があります'
          })
        }
      }
    })

    console.log('\n🏥 YMYL（Your Money Your Life）対策チェック:\n')
    console.log(`  🔴 断定表現あり: ${issues.absoluteExpressions.length}件`)
    console.log(`  ⚠️  統計データの出典不明: ${issues.missingCitations.length}件`)
    console.log(`  ⚠️  古い給与・年収情報（6ヶ月以上更新なし）: ${issues.oldArticles.length}件`)
    console.log(`  ⚠️  医療行為の記述要確認: ${issues.medicalProcedures.length}件\n`)

    if (issues.absoluteExpressions.length > 0) {
      console.log('🎯 断定表現が含まれる記事:\n')
      issues.absoluteExpressions.slice(0, 10).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   検出された断定表現: ${post.foundWords.join(', ')}`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}`)
        console.log(`   推奨: 「〜の傾向があります」「一般的には〜」などに変更\n`)
      })
    }

    if (issues.missingCitations.length > 0) {
      console.log('🎯 統計データの出典が不明な記事:\n')
      issues.missingCitations.slice(0, 10).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   理由: ${post.reason}`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}`)
        console.log(`   推奨: 厚生労働省などの公的機関データへのリンクを追加\n`)
      })
    }

    if (issues.oldArticles.length > 0) {
      console.log('🎯 更新が必要な給与・年収情報を含む記事:\n')
      issues.oldArticles.slice(0, 10).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   最終更新: ${post.daysSinceUpdate}日前`)
        console.log(`   理由: ${post.reason}`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}\n`)
      })
    }

    if (issues.medicalProcedures.length > 0) {
      console.log('🎯 医療行為の記述を確認すべき記事:\n')
      issues.medicalProcedures.slice(0, 10).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   理由: ${post.reason}`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}`)
        console.log(`   推奨: 看護助手が「できないこと」を明確に記載\n`)
      })
    }

    return issues
  } catch (error) {
    console.error('❌ エラー:', error.message)
    return null
  }
}

/**
 * 総合レポートを生成
 */
async function generateReport() {
  console.log('🔍 ProReNata 記事品質レポート')
  console.log('='.repeat(60))

  const oldPosts = await findOldPosts(6)
  console.log('='.repeat(60))

  const metadataIssues = await findPostsMissingMetadata()
  console.log('='.repeat(60))

  const imageIssues = await findPostsWithoutImages()
  console.log('='.repeat(60))

  const shortPosts = await findShortPosts(2000)
  console.log('='.repeat(60))

  // 次のステップチェックは無効化（RelatedPostsコンポーネントで自動表示済み）
  // const missingNextSteps = await findPostsWithoutNextSteps()
  // console.log('='.repeat(60))

  const affiliateIssues = await checkAffiliateLinks()
  console.log('='.repeat(60))

  const ymylIssues = await checkYMYL()
  console.log('='.repeat(60))

  // サマリー
  console.log('\n📊 サマリー\n')
  console.log(`  古い記事（6ヶ月以上更新なし）: ${oldPosts.length}件`)

  if (metadataIssues) {
    const criticalIssues = new Set([
      ...metadataIssues.noSlug.map(p => p._id),
      ...metadataIssues.noCategories.map(p => p._id),
      ...metadataIssues.noMetaDescription.map(p => p._id)
    ]).size

    const totalMetadataIssues = new Set([
      ...metadataIssues.noSlug.map(p => p._id),
      ...metadataIssues.noCategories.map(p => p._id),
      ...metadataIssues.noTags.map(p => p._id),
      ...metadataIssues.noExcerpt.map(p => p._id),
      ...metadataIssues.noMetaDescription.map(p => p._id),
      ...metadataIssues.excerptTooShort.map(p => p._id),
      ...metadataIssues.metaDescriptionTooShort.map(p => p._id),
      ...metadataIssues.metaDescriptionTooLong.map(p => p._id)
    ]).size

    console.log(`  🔴 重大な問題（Slug/Categories/MetaDesc欠損）: ${criticalIssues}件`)
    console.log(`  必須フィールド・メタデータ不足: ${totalMetadataIssues}件`)
  }

  if (imageIssues) {
    console.log(`  画像が全くなし: ${imageIssues.noImages.length}件`)
  }

  console.log(`  文字数不足（<2000文字）: ${shortPosts.length}件 ※ユーザビリティ優先`)
  // 「次のステップ」チェックは無効化（RelatedPostsコンポーネントで自動表示済み）
  // console.log(`  「次のステップ」セクションなし: ${missingNextSteps.length}件`)

  if (affiliateIssues) {
    console.log(`  🔴 連続するアフィリエイトリンク: ${affiliateIssues.consecutiveLinks.length}件`)
    console.log(`  ⚠️  リンク数が多すぎる: ${affiliateIssues.tooManyLinks.length}件`)
    console.log(`  ⚠️  記事内容と関連性が低い可能性: ${affiliateIssues.irrelevantLinks.length}件`)
  }

  if (ymylIssues) {
    console.log(`  🔴 YMYL: 断定表現あり: ${ymylIssues.absoluteExpressions.length}件`)
    console.log(`  ⚠️  YMYL: 統計データの出典不明: ${ymylIssues.missingCitations.length}件`)
    console.log(`  ⚠️  YMYL: 古い給与・年収情報: ${ymylIssues.oldArticles.length}件`)
    console.log(`  ⚠️  YMYL: 医療行為の記述要確認: ${ymylIssues.medicalProcedures.length}件`)
  }

  console.log('\n='.repeat(60))
}

// CLI実行
if (require.main === module) {
  const args = process.argv.slice(2)
  const command = args[0]

  switch (command) {
    case 'old':
      const months = parseInt(args[1]) || 6
      findOldPosts(months).catch(console.error)
      break

    case 'metadata':
      findPostsMissingMetadata().catch(console.error)
      break

    case 'images':
      findPostsWithoutImages().catch(console.error)
      break

    case 'short':
      const minChars = parseInt(args[1]) || 2000
      findShortPosts(minChars).catch(console.error)
      break

    case 'nextsteps':
      findPostsWithoutNextSteps().catch(console.error)
      break

    case 'affiliate':
      checkAffiliateLinks().catch(console.error)
      break

    case 'ymyl':
      checkYMYL().catch(console.error)
      break

    case 'report':
      generateReport().catch(console.error)
      break

    default:
      console.log(`
📝 ProReNata 記事メンテナンスツール

使い方:
  SANITY_API_TOKEN=<token> node scripts/maintenance.js <コマンド> [オプション]

コマンド:
  old [月数]          古い記事を検出（デフォルト: 6ヶ月）
  metadata            必須フィールド・メタデータ不足を包括的にチェック
                      - Slug、Categories、Tags
                      - Excerpt（50文字以上推奨）
                      - Meta Description（120-160文字推奨）
  images              画像なしの記事を検出
  short [文字数]      文字数不足の記事を検出（デフォルト: 2000文字）
                      ※ユーザビリティ優先、内容の質を重視
  nextsteps           「次のステップ」セクションがない記事を検出
                      ※現在はフロントエンド側で自動表示
  affiliate           アフィリエイトリンクの適切性をチェック
                      - 連続するリンクの検出
                      - リンク数（推奨: 2-3個）
                      - 記事内容との関連性
  ymyl                YMYL（Your Money Your Life）対策チェック
                      - 断定表現の検出（「絶対」「必ず」など）
                      - 統計データの出典確認
                      - 古い給与・年収情報（6ヶ月以上更新なし）
                      - 医療行為の記述チェック
  report              総合レポートを生成（全チェックを一括実行）

例:
  # 総合レポート（推奨）
  SANITY_API_TOKEN=$SANITY_API_TOKEN node scripts/maintenance.js report

  # 個別チェック
  SANITY_API_TOKEN=$SANITY_API_TOKEN node scripts/maintenance.js old 3
  SANITY_API_TOKEN=$SANITY_API_TOKEN node scripts/maintenance.js metadata
  SANITY_API_TOKEN=$SANITY_API_TOKEN node scripts/maintenance.js short 2500

チェック項目:
  🔴 重大: Slug、Categories、Meta Description欠損
  ⚠️  推奨: Tags、Excerpt、文字数、画像

環境変数:
  SANITY_API_TOKEN が必要です（書き込み権限不要）
      `)
  }
}

module.exports = {
  findOldPosts,
  findPostsMissingMetadata,
  findPostsWithoutImages,
  findShortPosts,
  findPostsWithoutNextSteps,
  checkAffiliateLinks,
  checkYMYL,
  generateReport
}
