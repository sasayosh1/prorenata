const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: '2024-01-01'
})

async function createTestPost() {
  try {
    console.log('テスト記事を作成しています...')
    
    const testPost = {
      _type: 'post',
      title: 'TEST: Body Field Verification',
      slug: {
        _type: 'slug',
        current: 'test-body-field-verification'
      },
      body: [
        {
          _type: 'block',
          style: 'h2',
          children: [
            {
              _type: 'span',
              text: 'Test Heading'
            }
          ]
        },
        {
          _type: 'block',
          style: 'normal',
          children: [
            {
              _type: 'span',
              text: 'This is a test paragraph to verify that the body field is working correctly in Sanity Studio. This content should be visible in the Studio interface.'
            }
          ]
        },
        {
          _type: 'block',
          style: 'normal',
          listItem: 'bullet',
          level: 1,
          children: [
            {
              _type: 'span',
              marks: ['strong'],
              text: 'Bold list item'
            },
            {
              _type: 'span',
              text: ': This is a bullet point with bold text.'
            }
          ]
        }
      ],
      publishedAt: new Date().toISOString()
    }
    
    const result = await client.create(testPost)
    console.log('✅ テスト記事の作成完了')
    console.log('記事ID:', result._id)
    console.log('記事URL:', `http://localhost:3333/structure/post;${result._id}`)
    
    return result
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
    process.exit(1)
  }
}

createTestPost()