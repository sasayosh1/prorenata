#!/usr/bin/env node

const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_WRITE_TOKEN,
  useCdn: false
})

const AFFILIATE_HOST_PATTERNS = [
  'af.moshimo.com',
  'moshimo.com',
  'a8.net',
  'px.a8.net',
  'valuecommerce.com',
  'amazon.co.jp',
  'rakuten.co.jp'
]

function normalizeUrl(href = '') {
  if (!href) return ''
  if (href.startsWith('//')) {
    return `https:${href}`
  }
  return href.trim()
}

function shouldSkip(url) {
  if (!url) return true
  if (url.startsWith('/')) return true
  return AFFILIATE_HOST_PATTERNS.some(pattern => url.includes(pattern))
}

async function getAllLinks() {
  const posts = await client.fetch(`*[_type == "post"]{
    _id,
    title,
    "slug": slug.current,
    body
  }`)

  const linkMap = new Map()

  posts.forEach(post => {
    if (!Array.isArray(post.body)) return
    post.body.forEach(block => {
      if (!block || block._type !== 'block' || !Array.isArray(block.children)) return
      if (!Array.isArray(block.markDefs) || block.markDefs.length === 0) return

      block.children.forEach(child => {
        if (!child || !Array.isArray(child.marks)) return
        child.marks.forEach(markKey => {
          const mark = block.markDefs.find(def => def?._key === markKey)
          if (!mark || mark._type !== 'link' || !mark.href) return
          const normalized = normalizeUrl(mark.href)
          if (shouldSkip(normalized)) return
          if (!linkMap.has(normalized)) {
            linkMap.set(normalized, [])
          }
          linkMap.get(normalized).push({
            postId: post._id,
            title: post.title,
            slug: post.slug,
            text: child.text || ''
          })
        })
      })
    })
  })

  return linkMap
}

async function testUrl(url) {
  const attempt = async method => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    try {
      const res = await fetch(url, {
        method,
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (link-checker)' }
      })
      clearTimeout(timeout)
      if (res && res.status && res.status < 400) {
        return { ok: true, status: res.status }
      }
      return { ok: false, status: res?.status || 0 }
    } catch (error) {
      clearTimeout(timeout)
      return { ok: false, error: error.message }
    }
  }

  let result = await attempt('HEAD')
  if (!result.ok) {
    result = await attempt('GET')
  }
  return result
}

async function main() {
  console.log('🔍 外部リンクを検証中...\n')
  const linkMap = await getAllLinks()
  console.log(`対象リンク: ${linkMap.size}件\n`)

  const failures = []
  for (const [url, posts] of linkMap.entries()) {
    const result = await testUrl(url)
    if (!result.ok) {
      failures.push({ url, posts, status: result.status, error: result.error })
      console.log(`❌ ${url} (${result.status || result.error || 'unknown'})`)
      posts.forEach(info => {
        console.log(`   - ${info.title} (/posts/${info.slug})`)
      })
    }
  }

  if (failures.length === 0) {
    console.log('\n✅ すべての外部リンクが有効です。')
  } else {
    console.log(`\n⚠️  失効リンク: ${failures.length}件`)
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('エラー:', error)
    process.exit(1)
  })
}
