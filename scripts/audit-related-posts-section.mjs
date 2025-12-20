import { createClient } from 'next-sanity'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01'

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
})

function blockText(block) {
  const children = Array.isArray(block?.children) ? block.children : []
  return children.map((c) => (typeof c?.text === 'string' ? c.text : '')).join('').trim()
}

function hasSummaryH2(body) {
  if (!Array.isArray(body)) return false
  return body.some((b) => b?._type === 'block' && b.style === 'h2' && blockText(b).includes('まとめ'))
}

function hasDisclaimer(body) {
  if (!Array.isArray(body)) return false
  return body.some((b) => b?._type === 'block' && !b.style && blockText(b).startsWith('免責事項'))
}

async function main() {
  const posts = await client.fetch(
    `*[_type=="post" && defined(slug.current) && (!defined(internalOnly) || internalOnly == false)]{
      _id,
      title,
      "slug": slug.current,
      body
    }`
  )

  let total = 0
  let missingSummary = 0
  let missingDisclaimer = 0

  for (const post of posts) {
    total += 1
    const body = post.body
    if (!hasSummaryH2(body)) missingSummary += 1
    if (!hasDisclaimer(body)) missingDisclaimer += 1
  }

  console.log(`Total posts: ${total}`)
  console.log(`Missing summary (まとめ) H2: ${missingSummary}`)
  console.log(`Missing disclaimer (免責事項): ${missingDisclaimer}`)
  console.log('')
  console.log('Note: The site now injects the "あわせて読みたい" block before the first disclaimer when possible.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

