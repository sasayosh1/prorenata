/**
 * 記事メンテナンスツール
 *
 * 記事の品質チェック・修正支援ツール
 * - 古い記事の検出
 * - メタデータ不足の記事検出
 * - 画像なし記事の検出
 * - 文字数不足の記事検出
 */

const path = require('path')
const { spawn } = require('child_process')
const { createClient } = require('@sanity/client')
const {
  blocksToPlainText,
  generateExcerpt,
  generateMetaDescription,
  generateSlugFromTitle,
  selectBestCategory,
} = require('./utils/postHelpers')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

function normalizeTitle(title) {
  return (title || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

function getRecencyScore(post) {
  const updated = post._updatedAt ? new Date(post._updatedAt).getTime() : 0
  const created = post._createdAt ? new Date(post._createdAt).getTime() : 0
  return Math.max(updated, created)
}

async function getCategoryResources() {
  try {
    const categories = await client.fetch(`*[_type == "category"] { _id, title }`)
    const map = new Map()

    categories.forEach(category => {
      if (category?._id && category?.title) {
        map.set(category.title, category._id)
      }
    })

    return {
      categories,
      map,
      fallback: categories[0] || null,
    }
  } catch (error) {
    console.error('❌ カテゴリ取得エラー:', error.message)
    return { categories: [], map: new Map(), fallback: null }
  }
}

function sanitiseSlugValue(slug) {
  return (slug || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

async function ensureUniqueSlug(candidate, excludeId) {
  let base = sanitiseSlugValue(candidate)
  if (!base) {
    base = generateSlugFromTitle('看護助手-article')
  }

  let attempt = 0
  let slug = base

  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await client.fetch(
      `*[_type == "post" && slug.current == $slug && _id != $id][0] { _id }`,
      { slug, id: excludeId }
    )

    if (!existing) {
      return slug
    }

    attempt += 1
    slug = sanitiseSlugValue(`${base}-${Date.now().toString().slice(-6)}-${attempt}`)
  }
}

async function removeDuplicatePosts(apply = false) {
  const query = `*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    _createdAt,
    _updatedAt
  }`

  try {
    const posts = await client.fetch(query)
    const duplicateGroups = []
    const deletions = new Map()

    const collectDuplicates = (keyFn, type) => {
      const map = new Map()

      posts.forEach(post => {
        const key = keyFn(post)
        if (!key) return
        if (!map.has(key)) {
          map.set(key, [])
        }
        map.get(key)?.push(post)
      })

      map.forEach((group, key) => {
          if (!group || group.length < 2) return
          const sorted = group.sort((a, b) => getRecencyScore(b) - getRecencyScore(a))
          const keeper = sorted[0]
          const removed = sorted.slice(1)

          removed.forEach(post => {
            if (!deletions.has(post._id)) {
              deletions.set(post._id, { post, reason: `${type}:${key}`, keep: keeper })
            }
          })

          duplicateGroups.push({
            type,
            key,
            keep: keeper,
            remove: removed,
          })
      })
    }

    collectDuplicates(post => post.slug?.toLowerCase(), 'slug')
    collectDuplicates(post => normalizeTitle(post.title), 'title')

    if (duplicateGroups.length === 0) {
      console.log('\n✅ 重複するタイトル/Slugは見つかりませんでした。\n')
      return { duplicateGroups, deletions: [] }
    }

    console.log(`\n⚠️ 重複記事を検出: ${duplicateGroups.length}グループ / 削除候補 ${deletions.size}件\n`)

    duplicateGroups.forEach((group, index) => {
      console.log(`${index + 1}. 重複タイプ: ${group.type} (${group.key})`)
      console.log(`   残す記事: ${group.keep.title} (${group.keep._id})`)
      if (group.remove.length > 0) {
        group.remove.forEach(post => {
          console.log(`   削除候補: ${post.title} (${post._id}) 更新: ${post._updatedAt || 'N/A'}`)
        })
      }
      console.log('')
    })

    if (!apply) {
      console.log('ℹ️  削除を実行するには --apply オプションを付けて再実行してください。')
      return { duplicateGroups, deletions: Array.from(deletions.values()) }
    }

    console.log('\n🗑️  重複記事の削除を実行します...\n')
    for (const { post, reason, keep } of deletions.values()) {
      try {
        await client.delete(post._id)
        console.log(`✅ Deleted: ${post.title} (${post._id}) [${reason}] -> kept ${keep._id}`)
      } catch (error) {
        console.error(`❌ 削除失敗: ${post._id} (${reason}) - ${error.message}`)
      }
    }

    console.log('\n🎉 重複記事の処理が完了しました。\n')
    return { duplicateGroups, deletions: Array.from(deletions.values()) }
  } catch (error) {
    console.error('❌ 重複チェック中にエラーが発生しました:', error.message)
    return { duplicateGroups: [], deletions: [] }
  }
}

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
      // 100-180文字を目安（ユーザビリティやSEO優先）
      if (!post.metaDescription) {
        issues.noMetaDescription.push(post)
      } else {
        const length = post.metaDescription.length
        if (length < 100) {
          issues.metaDescriptionTooShort.push({ ...post, metaLength: length })
        } else if (length > 180) {
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
    console.log(`  ⚠️  Meta Description 短すぎ (<100文字): ${issues.metaDescriptionTooShort.length}件`)
    console.log(`  ⚠️  Meta Description 長すぎ (>180文字): ${issues.metaDescriptionTooLong.length}件`)

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
        if (length < 100) { count++; problems.push('MetaDesc短') }
        else if (length > 180) { count++; problems.push('MetaDesc長') }
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

async function recategorizeAllPosts() {
  console.log('\n🔄 全記事のカテゴリ再評価を開始します\n')

  const { categories, fallback } = await getCategoryResources()

  const posts = await client.fetch(`
    *[_type == "post"] {
      _id,
      title,
      body,
      "categories": categories[]->{ _id, title }
    }
  `)

  if (!posts || posts.length === 0) {
    console.log('✅ 記事が見つかりません')
    return { total: 0, updated: 0 }
  }

  console.log(`対象記事: ${posts.length}件\n`)

  let updated = 0
  let unchanged = 0

  for (const post of posts) {
    const publishedId = post._id.startsWith('drafts.') ? post._id.replace(/^drafts\./, '') : post._id
    const currentCategories = Array.isArray(post.categories) ? post.categories.filter(Boolean) : []

    // 本文からテキスト抽出
    const plainText = blocksToPlainText(post.body)

    // 最適なカテゴリを選択
    const bestCategory = selectBestCategory(post.title, plainText, categories)

    if (!bestCategory) {
      console.log(`⚠️ ${post.title}`)
      console.log(`   カテゴリを自動選択できませんでした\n`)
      continue
    }

    // 現在のカテゴリと比較
    const currentCategoryId = currentCategories.length > 0 ? currentCategories[0]._id : null
    const currentCategoryTitle = currentCategories.length > 0 ? currentCategories[0].title : 'なし'

    if (currentCategoryId === bestCategory._id) {
      unchanged++
      continue
    }

    // カテゴリを更新
    const categoryRefs = [{ _type: 'reference', _ref: bestCategory._id }]

    await client
      .patch(post._id)
      .set({ categories: categoryRefs })
      .commit()

    if (post._id !== publishedId) {
      await client
        .patch(publishedId)
        .set({ categories: categoryRefs })
        .commit()
        .catch(() => null)
    }

    updated++
    console.log(`✅ ${post.title}`)
    console.log(`   カテゴリ変更: ${currentCategoryTitle} → ${bestCategory.title}\n`)
  }

  console.log(`\n🔄 カテゴリ再評価完了: ${updated}件を更新、${unchanged}件は変更なし（合計: ${posts.length}件）\n`)

  return { total: posts.length, updated, unchanged }
}

async function autoFixMetadata() {
  console.log('\n🛠️ メタデータ自動修復を開始します\n')

  const { categories, fallback } = await getCategoryResources()

  const posts = await client.fetch(`
    *[_type == "post" && (
      !defined(slug.current) ||
      count(categories) == 0 ||
      !defined(excerpt) ||
      length(excerpt) < 50 ||
      !defined(metaDescription) ||
      length(metaDescription) < 100 ||
      length(metaDescription) > 180
    )] {
      _id,
      title,
      slug,
      excerpt,
      metaDescription,
      body,
      "categories": categories[]->{ _id, title }
    }
  `)

  if (!posts || posts.length === 0) {
    console.log('✅ 修復対象の記事はありません')
    return { total: 0, updated: 0 }
  }

  console.log(`対象記事: ${posts.length}件\n`)

  let updated = 0

  for (const post of posts) {
    const updates = {}
    const publishedId = post._id.startsWith('drafts.') ? post._id.replace(/^drafts\./, '') : post._id
    const currentCategories = Array.isArray(post.categories) ? post.categories.filter(Boolean) : []
    let categoryRefs = currentCategories
      .filter(category => category?._id)
      .map(category => ({ _type: 'reference', _ref: category._id }))

    // カテゴリが空の場合、本文から最適なカテゴリを自動選択
    if (categoryRefs.length === 0) {
      const plainText = blocksToPlainText(post.body)
      const bestCategory = selectBestCategory(post.title, plainText, categories)
      if (bestCategory) {
        categoryRefs = [{ _type: 'reference', _ref: bestCategory._id }]
      } else if (fallback) {
        categoryRefs = [{ _type: 'reference', _ref: fallback._id }]
      }
    }

    if ((!post.slug || !post.slug.current) && publishedId) {
      const slugCandidate = generateSlugFromTitle(post.title)
      // eslint-disable-next-line no-await-in-loop
      const uniqueSlug = await ensureUniqueSlug(slugCandidate, publishedId)
      updates.slug = {
        _type: 'slug',
        current: uniqueSlug,
      }
    }

    if (categoryRefs.length > 0 && (!post.categories || post.categories.length === 0)) {
      updates.categories = categoryRefs
    }

    const plainText = blocksToPlainText(post.body)

    if (!post.excerpt || post.excerpt.length < 50) {
      const excerpt = generateExcerpt(plainText, post.title)
      updates.excerpt = excerpt
    }

    const categoriesForMeta = (updates.categories || categoryRefs || currentCategories)
      .map(ref => {
        if (ref?._ref) {
          const match = categories.find(category => category._id === ref._ref)
          return match?.title
        }
        return ref?.title
      })
      .filter(Boolean)

    // Meta Description は plainText から直接生成（excerpt とは別）
    // 100-180文字を目安（ユーザビリティやSEO優先）
    if (!post.metaDescription || post.metaDescription.length < 100 || post.metaDescription.length > 180) {
      const metaDescription = generateMetaDescription(post.title, plainText, categoriesForMeta)
      updates.metaDescription = metaDescription
    }

    if (Object.keys(updates).length === 0) {
      continue
    }

    await client
      .patch(post._id)
      .set(updates)
      .commit()

    if (post._id !== publishedId) {
      await client
        .patch(publishedId)
        .set(updates)
        .commit()
        .catch(() => null)
    }

    updated += 1
    console.log(`✅ ${post.title}`)
    if (updates.slug) {
      console.log(`   スラッグ: ${updates.slug.current}`)
    }
    if (updates.categories) {
      const selectedCategories = updates.categories
        .map(ref => categories.find(c => c._id === ref._ref)?.title)
        .filter(Boolean)
        .join(', ')
      console.log(`   カテゴリを自動設定: ${selectedCategories}`)
    }
    if (updates.excerpt) {
      console.log('   Excerpt を再生成しました')
    }
    if (updates.metaDescription) {
      console.log(`   Meta Description を再生成しました (${updates.metaDescription.length}文字)`)
    }
    console.log()
  }

  console.log(`🛠️ 自動修復完了: ${updated}/${posts.length}件を更新`)

  const repairTasks = [
    { script: 'convert-placeholder-links.js', args: [], label: 'プレースホルダーリンク変換' },
    { script: 'fix-all-link-issues.js', args: [], label: 'リンク問題一括修正' },
    { script: 'fix-affiliate-link-text.js', args: [], label: 'アフィリエイトリンクテキスト修正' },
    { script: 'remove-broken-internal-links.js', args: [], label: '壊れた内部リンク削除' },
    { script: 'remove-toc-headings.js', args: ['remove', '--apply'], label: 'Body内「もくじ」見出し削除' },
  ]

  for (const task of repairTasks) {
    // eslint-disable-next-line no-await-in-loop
    await runNodeScript(task.script, task.args, task.label)
  }

  return { total: posts.length, updated }
}

function runNodeScript(scriptName, args = [], label) {
  return new Promise((resolve) => {
    const scriptPath = path.resolve(__dirname, scriptName)
    console.log(`\n▶ ${label}`)
    const child = spawn('node', [scriptPath, ...args], {
      env: process.env,
      stdio: 'inherit',
    })

    child.on('exit', (code) => {
      if (code === 0) {
        console.log(`✅ ${label} 完了`)
      } else {
        console.log(`⚠️ ${label} でエラーが発生しました (exit ${code})`)
      }
      resolve({ code })
    })
  })
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
 * 3. ASPアフィリエイトリンク数（2個超過）
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
      tooManyLinks: [],      // リンク数が多すぎる（全体4個以上）
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
 * 内部リンクの適切性をチェック
 * 1. 内部リンクが少なすぎる記事を検出
 * 2. 壊れた内部リンクを検出
 * 3. 内部リンクが多すぎる記事を検出（3個超過）
 * 4. 内部リンクとアフィリエイトリンクが同時配置されている記事を検出
 */
async function checkInternalLinks() {
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
      tooFewLinks: [],       // 内部リンクが少ない（2個未満）
      tooManyLinks: [],      // 内部リンクが多すぎる（3個超過）
      brokenLinks: [],       // 壊れたリンク
      mixedWithAffiliate: [] // 内部リンクとアフィリエイトリンクが同じブロックに配置
    }

    // 全記事のslugを取得（壊れたリンク検出用）
    const allSlugs = new Set(posts.map(p => p.slug))

    posts.forEach(post => {
      if (!post.body || !Array.isArray(post.body)) return

      let internalLinkCount = 0
      const internalLinks = []
      const internalLinkBlockIndices = new Set()
      const affiliateLinkBlockIndices = new Set()

      post.body.forEach((block, index) => {
        if (!block.markDefs) return

        let hasInternalLink = false
        let hasAffiliateLink = false

        block.markDefs.forEach(def => {
          if (def._type === 'link' && def.href) {
            // 内部リンクの検出（/posts/で始まる）
            if (def.href.startsWith('/posts/')) {
              const targetSlug = def.href.replace('/posts/', '')
              internalLinkCount++
              hasInternalLink = true
              internalLinks.push({
                href: def.href,
                targetSlug,
                blockIndex: index,
                text: block.children?.map(c => c.text).join('').substring(0, 50)
              })

              // 壊れたリンクのチェック
              if (!allSlugs.has(targetSlug)) {
                if (!issues.brokenLinks.some(p => p._id === post._id)) {
                  issues.brokenLinks.push({
                    ...post,
                    brokenLink: def.href,
                    linkText: block.children?.map(c => c.text).join('')
                  })
                }
              }
            }

            // アフィリエイトリンクの検出
            if (def.href.includes('af.moshimo.com') ||
                def.href.includes('amazon.co.jp') ||
                def.href.includes('tcs-asp.net')) {
              hasAffiliateLink = true
            }
          }
        })

        if (hasInternalLink) {
          internalLinkBlockIndices.add(index)
        }
        if (hasAffiliateLink) {
          affiliateLinkBlockIndices.add(index)
        }
      })

      // 内部リンク数チェック（2個未満は少ない）
      if (internalLinkCount < 2) {
        issues.tooFewLinks.push({
          ...post,
          internalLinkCount
        })
      }

      // 内部リンク数チェック（3個超過）
      if (internalLinkCount > 3) {
        issues.tooManyLinks.push({
          ...post,
          internalLinkCount
        })
      }

      // 内部リンクとアフィリエイトリンクが近接しているかチェック
      // 同じブロックまたは隣接ブロック（±2ブロック以内）に両方が存在する場合
      for (const internalIdx of internalLinkBlockIndices) {
        for (const affiliateIdx of affiliateLinkBlockIndices) {
          if (Math.abs(internalIdx - affiliateIdx) <= 2) {
            if (!issues.mixedWithAffiliate.some(p => p._id === post._id)) {
              issues.mixedWithAffiliate.push({
                ...post,
                blockDistance: Math.abs(internalIdx - affiliateIdx)
              })
            }
            break
          }
        }
      }
    })

    console.log('\n🔗 内部リンクチェック:\n')
    console.log(`  ⚠️  内部リンクが少ない（2個未満）: ${issues.tooFewLinks.length}件`)
    console.log(`  🔴 内部リンクが多すぎる（3個超過）: ${issues.tooManyLinks.length}件（新ルール）`)
    console.log(`  🔴 内部リンクとアフィリエイトが近接: ${issues.mixedWithAffiliate.length}件（新ルール）`)
    console.log(`  🔴 壊れた内部リンク: ${issues.brokenLinks.length}件\n`)

    if (issues.tooFewLinks.length > 0) {
      console.log('🎯 内部リンクが少ない記事（TOP10）:\n')
      issues.tooFewLinks.slice(0, 10).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   内部リンク数: ${post.internalLinkCount}個（推奨: 2個以上）`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}\n`)
      })
    }

    if (issues.tooManyLinks.length > 0) {
      console.log('🎯 内部リンクが多すぎる記事（TOP10）:\n')
      issues.tooManyLinks.slice(0, 10).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   内部リンク数: ${post.internalLinkCount}個（推奨: 最大2-3個）`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}`)
        console.log(`   注: ユーザビリティ最優先。無理に最大数を配置しない\n`)
      })
    }

    if (issues.mixedWithAffiliate.length > 0) {
      console.log('🎯 内部リンクとアフィリエイトリンクが近接している記事（TOP10）:\n')
      issues.mixedWithAffiliate.slice(0, 10).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   ブロック間距離: ${post.blockDistance}ブロック以内`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}`)
        console.log(`   推奨: 内部リンクとアフィリエイトリンクは別の場所に配置\n`)
      })
    }

    if (issues.brokenLinks.length > 0) {
      console.log('🎯 壊れた内部リンクがある記事:\n')
      issues.brokenLinks.forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   壊れたリンク: ${post.brokenLink}`)
        console.log(`   リンクテキスト: ${post.linkText}`)
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
 * Body内の「もくじ」見出しを検出
 * 理由: body外部に自動生成される目次があるため、body内の「もくじ」見出しは不要
 */
async function findPostsWithTOC() {
  const query = `*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body,
    "categories": categories[]->title
  }`

  try {
    const posts = await client.fetch(query)
    const postsWithTOC = []

    posts.forEach(post => {
      if (!post.body || !Array.isArray(post.body)) return

      const tocBlocks = post.body.filter(block => {
        if (block._type !== 'block') return false
        if (block.style !== 'h2' && block.style !== 'h3') return false

        const text = block.children
          ?.map(c => c.text || '')
          .join('')
          .trim()

        return /^(もくじ|目次|この記事の目次)$/i.test(text)
      })

      if (tocBlocks.length > 0) {
        postsWithTOC.push({
          ...post,
          tocCount: tocBlocks.length,
          tocStyles: tocBlocks.map(b => b.style)
        })
      }
    })

    console.log(`\n📑 Body内に「もくじ」見出しを含む記事: ${postsWithTOC.length}件`)
    console.log('   理由: body外部に自動生成目次があるため、body内の「もくじ」見出しは削除推奨\n')

    if (postsWithTOC.length > 0) {
      console.log('🎯 「もくじ」見出しを含む記事（TOP10）:\n')
      postsWithTOC.slice(0, 10).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   もくじ見出し数: ${post.tocCount}個 (${post.tocStyles.join(', ')})`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}\n`)
      })

      if (postsWithTOC.length > 10) {
        console.log(`   ... 他${postsWithTOC.length - 10}件\n`)
      }

      console.log('   削除するには:')
      console.log('   node scripts/remove-toc-headings.js remove --apply\n')
    }

    return postsWithTOC
  } catch (error) {
    console.error('❌ エラー:', error.message)
    return []
  }
}

/**
 * 箇条書きでセクションを終えている記事を検出
 * 理由: 各セクションは本文（まとめ文）で締めくくる必要がある
 */
async function checkSectionEndings() {
  const query = `*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body,
    "categories": categories[]->title
  }`

  try {
    const posts = await client.fetch(query)
    const issues = []

    posts.forEach(post => {
      if (!post.body || !Array.isArray(post.body)) return

      const h2Indices = []
      post.body.forEach((block, index) => {
        if (block._type === 'block' && block.style === 'h2') {
          h2Indices.push(index)
        }
      })

      // 各H2セクションをチェック
      for (let i = 0; i < h2Indices.length; i++) {
        const sectionStart = h2Indices[i]
        const sectionEnd = i < h2Indices.length - 1 ? h2Indices[i + 1] : post.body.length

        // セクション内の最後のブロックを取得
        let lastContentBlock = null
        for (let j = sectionEnd - 1; j > sectionStart; j--) {
          const block = post.body[j]
          if (block._type === 'block' && (block.style === 'normal' || block.listItem)) {
            lastContentBlock = { block, index: j }
            break
          }
        }

        // 最後のブロックが箇条書き（listItem）かチェック
        if (lastContentBlock && lastContentBlock.block.listItem) {
          const h2Text = post.body[sectionStart].children?.map(c => c.text).join('') || ''

          if (!issues.some(p => p._id === post._id)) {
            issues.push({
              ...post,
              sectionTitle: h2Text,
              sectionIndex: i + 1,
              totalSections: h2Indices.length
            })
          }
          break // 1つ見つかれば記事全体として記録
        }
      }
    })

    console.log(`\n📝 箇条書きでセクションを終えている記事: ${issues.length}件`)
    console.log('   理由: 各セクションは本文（まとめ文）で締めくくる必要があります\n')

    if (issues.length > 0) {
      console.log('🎯 箇条書きでセクションを終えている記事（TOP15）:\n')
      issues.slice(0, 15).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   問題のセクション: 「${post.sectionTitle}」（${post.sectionIndex}/${post.totalSections}セクション目）`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}`)
        console.log(`   推奨: 箇条書きの後に2〜3文のまとめ文を追加\n`)
      })

      if (issues.length > 15) {
        console.log(`   ... 他${issues.length - 15}件\n`)
      }
    }

    return issues
  } catch (error) {
    console.error('❌ エラー:', error.message)
    return []
  }
}

/**
 * H2まとめセクション後にH2セクションがある記事を検出
 * 理由: 「まとめ」は記事の最後のH2セクションである必要がある
 */
async function checkH2AfterSummary() {
  const query = `*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    body,
    "categories": categories[]->title
  }`

  try {
    const posts = await client.fetch(query)
    const issues = []

    posts.forEach(post => {
      if (!post.body || !Array.isArray(post.body)) return

      const h2Blocks = []
      post.body.forEach((block, index) => {
        if (block._type === 'block' && block.style === 'h2') {
          const text = block.children?.map(c => c.text).join('') || ''
          h2Blocks.push({ text, index })
        }
      })

      // 「まとめ」セクションを探す
      const summaryIndex = h2Blocks.findIndex(h2 =>
        h2.text.includes('まとめ') || h2.text.includes('まとめ')
      )

      // 「まとめ」が見つかり、かつそれが最後のH2でない場合
      if (summaryIndex !== -1 && summaryIndex < h2Blocks.length - 1) {
        const sectionsAfterSummary = h2Blocks.slice(summaryIndex + 1).map(h2 => h2.text)

        issues.push({
          ...post,
          summaryTitle: h2Blocks[summaryIndex].text,
          sectionsAfter: sectionsAfterSummary,
          summaryPosition: summaryIndex + 1,
          totalH2Sections: h2Blocks.length
        })
      }
    })

    console.log(`\n📋 「まとめ」の後にH2セクションがある記事: ${issues.length}件`)
    console.log('   理由: 「まとめ」は記事の最後のH2セクションである必要があります\n')

    if (issues.length > 0) {
      console.log('🎯 「まとめ」の後にH2セクションがある記事:\n')
      issues.forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`)
        console.log(`   ID: ${post._id}`)
        console.log(`   「まとめ」の位置: ${post.summaryPosition}/${post.totalH2Sections}セクション目`)
        console.log(`   「まとめ」の後のセクション: ${post.sectionsAfter.join(', ')}`)
        console.log(`   カテゴリ: ${post.categories?.join(', ') || 'なし'}`)
        console.log(`   URL: /posts/${post.slug}`)
        console.log(`   推奨: 「まとめ」を最後のH2セクションに移動、または後続セクションを削除\n`)
      })
    }

    return issues
  } catch (error) {
    console.error('❌ エラー:', error.message)
    return []
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

  const internalLinkIssues = await checkInternalLinks()
  console.log('='.repeat(60))

  const ymylIssues = await checkYMYL()
  console.log('='.repeat(60))

  const postsWithTOC = await findPostsWithTOC()
  console.log('='.repeat(60))

  const sectionEndingIssues = await checkSectionEndings()
  console.log('='.repeat(60))

  const h2AfterSummaryIssues = await checkH2AfterSummary()
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
    console.log(`  🔴 ASPアフィリエイトが2個超過: ${affiliateIssues.tooManyASPLinks.length}件（新ルール）`)
    console.log(`  ⚠️  記事内容と関連性が低い可能性: ${affiliateIssues.irrelevantLinks.length}件`)
  }

  if (internalLinkIssues) {
    console.log(`  ⚠️  内部リンクが少ない（2個未満）: ${internalLinkIssues.tooFewLinks.length}件`)
    console.log(`  🔴 内部リンクが多すぎる（3個超過）: ${internalLinkIssues.tooManyLinks.length}件（新ルール）`)
    console.log(`  🔴 内部リンクとアフィリエイトが近接: ${internalLinkIssues.mixedWithAffiliate.length}件（新ルール）`)
    console.log(`  🔴 壊れた内部リンク: ${internalLinkIssues.brokenLinks.length}件`)
  }

  if (ymylIssues) {
    console.log(`  🔴 YMYL: 断定表現あり: ${ymylIssues.absoluteExpressions.length}件`)
    console.log(`  ⚠️  YMYL: 統計データの出典不明: ${ymylIssues.missingCitations.length}件`)
    console.log(`  ⚠️  YMYL: 古い給与・年収情報: ${ymylIssues.oldArticles.length}件`)
    console.log(`  ⚠️  YMYL: 医療行為の記述要確認: ${ymylIssues.medicalProcedures.length}件`)
  }

  console.log(`  🔴 Body内に「もくじ」見出しあり: ${postsWithTOC.length}件（削除推奨）`)

  console.log(`  🔴 箇条書きでセクションを終えている: ${sectionEndingIssues.length}件（新ルール）`)
  console.log(`  🔴 「まとめ」の後にH2セクションあり: ${h2AfterSummaryIssues.length}件（新ルール）`)

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

    case 'internallinks':
      checkInternalLinks().catch(console.error)
      break

    case 'ymyl':
      checkYMYL().catch(console.error)
      break

    case 'toc':
      findPostsWithTOC().catch(console.error)
      break

    case 'sectionendings':
      checkSectionEndings().catch(console.error)
      break

    case 'h2aftersummary':
      checkH2AfterSummary().catch(console.error)
      break

    case 'report':
      generateReport().catch(console.error)
      break

    case 'all':
      (async () => {
        try {
          console.log('\n📊 === 総合メンテナンス開始 ===\n')
          console.log('ステップ1: 総合レポート生成（問題検出）\n')
          await generateReport()
          console.log('\n' + '='.repeat(60))
          console.log('\nステップ2: カテゴリ再評価\n')
          await recategorizeAllPosts()
          console.log('\n' + '='.repeat(60))
          console.log('\nステップ3: 自動修復実行\n')
          await autoFixMetadata()
          console.log('\n' + '='.repeat(60))
          console.log('\n✅ === 総合メンテナンス完了 ===\n')
        } catch (error) {
          console.error('❌ 総合メンテナンス中にエラーが発生:', error.message)
          process.exit(1)
        }
      })()
      break

    case 'autofix':
      autoFixMetadata().catch(console.error)
      break

    case 'recategorize':
      recategorizeAllPosts().catch(console.error)
      break

    case 'dedupe':
      {
        const apply = args.includes('--apply')
        removeDuplicatePosts(apply).catch(console.error)
      }
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
                      - Meta Description（100-180文字推奨、SEO・ユーザビリティ優先）
  images              画像なしの記事を検出
  short [文字数]      文字数不足の記事を検出（デフォルト: 2000文字）
                      ※ユーザビリティ優先、内容の質を重視
  nextsteps           「次のステップ」セクションがない記事を検出
                      ※現在はフロントエンド側で自動表示
  affiliate           アフィリエイトリンクの適切性をチェック
                      - 連続するリンクの検出
                      - リンク数（推奨: 2-3個）
                      - 記事内容との関連性
  internallinks       内部リンクの適切性をチェック
                      - 内部リンク数（推奨: 2個以上、最大2-3個）
                      - 内部リンクとアフィリエイトの近接チェック
                      - 壊れたリンクの検出
  ymyl                YMYL（Your Money Your Life）対策チェック
                      - 断定表現の検出（「絶対」「必ず」など）
                      - 統計データの出典確認
                      - 古い給与・年収情報（6ヶ月以上更新なし）
                      - 医療行為の記述チェック
  toc                 Body内の「もくじ」見出しを検出
                      - body外部に自動生成目次があるため削除推奨
  sectionendings      箇条書きでセクションを終えている記事を検出
                      - 各セクションは本文（まとめ文）で締めくくる必要がある
  h2aftersummary      「まとめ」の後にH2セクションがある記事を検出
                      - 「まとめ」は記事の最後のH2セクションである必要がある
  dedupe [--apply]    タイトル・Slugの重複を検出し、古い記事を削除
                      - --apply を付けると削除を実行（デフォルトはプレビュー）
  report              総合レポートを生成（全チェックを一括実行）
  autofix             スラッグ・カテゴリ・メタディスクリプションを自動修復
                      - Excerpt・Meta Description を白崎セラ口調で再生成
                      - プレースホルダーリンク変換、壊れたリンク削除など
  recategorize        全記事のカテゴリを再評価して最適なカテゴリに変更
                      - タイトル・本文から最適なカテゴリを自動選択
                      - 現在のカテゴリと異なる場合のみ更新
  all                 総合メンテナンス（report + recategorize + autofix を順次実行）★推奨
                      - 問題を検出し、カテゴリ再評価、自動修復可能なものはすべて修正
                      - GitHub Actions で週3回自動実行（月・水・金 AM3:00）

例:
  # 総合メンテナンス（検出＋自動修正、最推奨）★
  SANITY_WRITE_TOKEN=$SANITY_WRITE_TOKEN node scripts/maintenance.js all

  # 総合レポート（検出のみ）
  SANITY_API_TOKEN=$SANITY_API_TOKEN node scripts/maintenance.js report

  # 自動修正のみ
  SANITY_WRITE_TOKEN=$SANITY_WRITE_TOKEN node scripts/maintenance.js autofix

  # 全記事のカテゴリを再評価
  SANITY_WRITE_TOKEN=$SANITY_WRITE_TOKEN node scripts/maintenance.js recategorize

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
  checkInternalLinks,
  checkYMYL,
  findPostsWithTOC,
  checkSectionEndings,
  checkH2AfterSummary,
  generateReport,
  autoFixMetadata,
  recategorizeAllPosts
}
