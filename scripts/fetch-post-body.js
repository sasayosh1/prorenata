require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_WRITE_TOKEN,
  useCdn: false
})

async function fetchArticle() {
  const slug = 'nursing-assistant-recommended-shoes'
  const post = await client.fetch(`*[_type == 'post' && slug.current == $slug][0]`, { slug })
  console.log(JSON.stringify(post.body, null, 2))
}

fetchArticle().catch(error => {
  console.error(error)
})
