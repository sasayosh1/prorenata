const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
})

async function testSanityConnection() {
  try {
    console.log('Testing Sanity connection...')
    
    // 全記事取得テスト
    const posts = await client.fetch('*[_type == "post"]')
    console.log(`Found ${posts.length} posts`)
    
    if (posts.length > 0) {
      console.log('First post:', posts[0])
    }
    
    // カテゴリー確認
    const categories = await client.fetch('*[_type == "category"]')
    console.log(`Found ${categories.length} categories`)
    
    // 著者確認
    const authors = await client.fetch('*[_type == "author"]')
    console.log(`Found ${authors.length} authors`)
    
  } catch (error) {
    console.error('Sanity connection error:', error)
  }
}

testSanityConnection()