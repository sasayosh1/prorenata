const { createClient } = require('next-sanity')

const projectId = '72m8vhy2'
const dataset = 'production'
const apiVersion = '2024-01-01'

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
})

async function testConnection() {
  try {
    console.log('Testing Sanity connection...')
    console.log('Project ID:', projectId)
    console.log('Dataset:', dataset)
    console.log('API Version:', apiVersion)
    
    // クエリをテスト
    const query = `*[_type == "post" && defined(publishedAt)] | order(publishedAt desc) {
      _id,
      title,
      slug,
      publishedAt,
      excerpt,
      mainImage,
      "categories": categories[]->title,
      "author": author->{name, slug},
      body
    }`
    
    console.log('\nExecuting query:', query)
    
    const posts = await client.fetch(query)
    console.log('\nQuery result:')
    console.log('Posts found:', posts.length)
    
    if (posts.length > 0) {
      console.log('First post:', JSON.stringify(posts[0], null, 2))
    }
    
  } catch (error) {
    console.error('Connection error:', error)
  }
}

testConnection()