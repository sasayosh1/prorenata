#!/usr/bin/env node
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_WRITE_TOKEN,
  useCdn: false
})
async function main() {
  if (!client.config().token) {
    console.error('❌ SANITY_API_TOKEN or SANITY_WRITE_TOKEN is required.')
    process.exit(1)
  }
  const posts = await client.fetch('*[_type == "post" && count(body[_type == "affiliateEmbed"]) > 0]{_id, title, "slug": slug.current, body}')
  console.log(`🔍 affiliateEmbed が含まれる記事: ${posts.length}件`)
  for (const post of posts) {
    const newBody = []
    for (let i = 0; i < (post.body || []).length; i++) {
      const block = post.body[i]
      if (block?._type === 'affiliateEmbed') {
        if (
          newBody.length > 0 &&
          newBody[newBody.length - 1]._type === 'block' &&
          newBody[newBody.length - 1].children?.[0]?.text?.includes('： ')
        ) {
          newBody.pop()
        }
        continue
      }
      newBody.push(block)
    }
    if (JSON.stringify(newBody) === JSON.stringify(post.body)) continue
    await client.patch(post._id).set({ body: newBody }).commit()
    console.log(`🧹 Removed affiliate blocks from ${post.slug || post._id}`)
  }
  console.log('✅ cleanup completed')
}
main().catch(err => {
  console.error(err)
  process.exit(1)
})
