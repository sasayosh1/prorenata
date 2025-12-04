/**
 * Remove consecutive duplicate image blocks (same asset _ref) from all posts' body.
 * Usage: SANITY_API_TOKEN=xxx node scripts/dedupe-consecutive-images.js
 */

const { createClient } = require('next-sanity')

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

function dedupeBody(body = []) {
  const result = []
  for (const block of body) {
    const prev = result[result.length - 1]
    const isImage = block && block._type === 'image' && block.asset && block.asset._ref
    const isPrevImage = prev && prev._type === 'image' && prev.asset && prev.asset._ref
    if (isImage && isPrevImage && block.asset._ref === prev.asset._ref) {
      continue
    }
    result.push(block)
  }
  return result
}

async function main() {
  const posts = await client.fetch(`*[_type == "post"]{_id, "slug": slug.current, body}`)
  let updated = 0

  for (const doc of posts) {
    const fixed = dedupeBody(doc.body || [])
    const changed = JSON.stringify(fixed) !== JSON.stringify(doc.body || [])
    if (!changed) continue

    await client
      .patch(doc._id)
      .set({ body: fixed })
      .commit({ autoGenerateArrayKeys: false })

    updated++
    console.log(`deduped: ${doc.slug || doc._id}`)
  }

  console.log(`✅ Completed. Updated ${updated} posts.`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
