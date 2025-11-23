#!/usr/bin/env node
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

const TITLE_TO_SLUG = {
  '仕事': 'work',
  '給与': 'salary',
  '資格': 'license',
  '転職': 'career-change',
  '退職': 'resignation',
  '心身': 'wellbeing',
  '体験': 'stories',
}

const DESIRED_ORDER = [
  'work',
  'salary',
  'license',
  'career-change',
  'resignation',
  'wellbeing',
  'stories',
]

async function fetchCategories () {
  return client.fetch(`*[_type == "category"]{_id,title,"slug":slug.current}`)
}

function chooseCanonical (categories) {
  const canonicalBySlug = {}

  for (const slug of DESIRED_ORDER) {
    const matches = categories.filter(cat => cat.slug === slug)
    if (matches.length === 0) {
      throw new Error(`必須カテゴリ ${slug} が見つかりません。Sanity Studioで作成してください。`)
    }
    const preferred = matches.find(cat => cat._id.startsWith('category-')) || matches[0]
    canonicalBySlug[slug] = preferred._id
  }

  return canonicalBySlug
}

function normalizeTitle (title) {
  if (!title) return ''
  return title.replace(/^#\d+\s*/, '').trim()
}

function buildReplacementMap (categories, canonicalBySlug) {
  const replacements = {}

  for (const cat of categories) {
    const normalizedTitle = normalizeTitle(cat.title)
    const slugFromTitle = TITLE_TO_SLUG[normalizedTitle]
    const mappedSlug = canonicalBySlug[cat.slug] ? cat.slug : slugFromTitle
    if (!mappedSlug) {
      throw new Error(`カテゴリ「${cat.title} (${cat.slug})」のマッピング先が不明です。`)
    }
    const canonicalId = canonicalBySlug[mappedSlug]
    if (!canonicalId) {
      throw new Error(`カテゴリ「${cat.title} (${cat.slug})」の正規IDを解決できません。`)
    }
    if (canonicalId !== cat._id) {
      replacements[cat._id] = canonicalId
    }
  }

  return replacements
}

async function remapPosts (replacementMap, canonicalBySlug) {
  const duplicateIds = Object.keys(replacementMap)
  if (duplicateIds.length === 0) {
    console.log('重複カテゴリはありません。')
    return
  }

  const posts = await client.fetch(
    `*[_type == "post" && count(categories[@._ref in $dupIds]) > 0]{
      _id,
      "categories": categories[]{_type,_ref}
    }`,
    { dupIds: duplicateIds }
  )

  console.log(`重複カテゴリを使用している記事: ${posts.length}件`)

  for (const post of posts) {
    const nextRefs = []
    for (const catRef of post.categories || []) {
      const targetId = replacementMap[catRef._ref] || catRef._ref
      if (!targetId) continue
      if (!nextRefs.find(ref => ref._ref === targetId)) {
        nextRefs.push({ _type: 'reference', _ref: targetId, _key: targetId })
      }
    }

    if (nextRefs.length === 0) {
      // 万一カテゴリが空になる場合は「仕事」を付与
      const fallbackWork = canonicalBySlug['work']
      nextRefs.push({ _type: 'reference', _ref: fallbackWork, _key: fallbackWork })
    }

    await client
      .patch(post._id)
      .set({ categories: nextRefs })
      .commit()

    console.log(`- ${post._id} を更新しました (${nextRefs.length}カテゴリ)`)
  }
}

async function deleteDuplicates (replacementMap) {
  for (const duplicateId of Object.keys(replacementMap)) {
    try {
      await client.delete(duplicateId)
      console.log(`重複カテゴリ ${duplicateId} を削除しました`)
    } catch (error) {
      console.warn(`カテゴリ ${duplicateId} の削除に失敗: ${error.message}`)
    }
  }
}

async function main () {
  const categories = await fetchCategories()
  const canonicalBySlug = chooseCanonical(categories)
  const replacements = buildReplacementMap(categories, canonicalBySlug)

  if (Object.keys(replacements).length === 0) {
    console.log('置き換え対象のカテゴリはありません。')
    return
  }

  await remapPosts(replacements, canonicalBySlug)
  await deleteDuplicates(replacements)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
