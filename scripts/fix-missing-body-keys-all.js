/**
 * Fix missing _key fields in Sanity Portable Text (body) for all posts.
 * Usage: SANITY_API_TOKEN=xxx node scripts/fix-missing-body-keys-all.js
 */

const { createClient } = require('next-sanity')
const crypto = require('crypto')

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01'
const token = process.env.SANITY_API_TOKEN

if (!token) {
  console.error('Error: SANITY_API_TOKEN is not set.')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token,
})

const genKey = () => crypto.randomUUID().replace(/-/g, '')

function ensureKeys(node) {
  if (Array.isArray(node)) {
    return node.map(ensureKeys)
  }
  if (node && typeof node === 'object') {
    const updated = { ...node }
    if (updated._type && !updated._key) {
      updated._key = genKey()
    }
    for (const k of Object.keys(updated)) {
      const v = updated[k]
      if (Array.isArray(v)) {
        updated[k] = v.map(ensureKeys)
      } else if (v && typeof v === 'object') {
        updated[k] = ensureKeys(v)
      }
    }
    return updated
  }
  return node
}

async function main() {
  const posts = await client.fetch(
    `*[_type == "post"]{_id, "slug": slug.current, body}`
  )

  let updated = 0
  for (const doc of posts) {
    const fixedBody = ensureKeys(doc.body || [])
    const changed = JSON.stringify(fixedBody) !== JSON.stringify(doc.body || [])
    if (!changed) continue

    await client
      .patch(doc._id)
      .set({ body: fixedBody })
      .commit({ autoGenerateArrayKeys: false })

    updated++
    console.log(`fixed: ${doc.slug || doc._id}`)
  }

  console.log(`✅ Completed. Updated ${updated} posts.`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
