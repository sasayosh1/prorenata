/**
 * Fix missing _key fields in Sanity Portable Text (body) for a given post slug.
 * Usage: SANITY_API_TOKEN=xxx node scripts/fix-missing-body-keys.js <slug>
 */

const { createClient } = require('next-sanity')
const crypto = require('crypto')

const slug = process.argv[2]
if (!slug) {
  console.error('Usage: node scripts/fix-missing-body-keys.js <slug>')
  process.exit(1)
}

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
  const doc = await client.fetch(
    `*[_type == "post" && slug.current == $slug][0]{_id, title, body}`,
    { slug },
  )

  if (!doc?._id) {
    console.error('Post not found for slug:', slug)
    process.exit(1)
  }

  const fixedBody = ensureKeys(doc.body || [])
  await client
    .patch(doc._id)
    .set({ body: fixedBody })
    .commit({ autoGenerateArrayKeys: false })

  console.log(`✅ Fixed missing _key in body for "${slug}" (id: ${doc._id})`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
