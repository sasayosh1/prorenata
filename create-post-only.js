const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
})

async function createPost() {
  try {
    console.log('Creating welcome post for Pro Re Nata...')
    
    // 既存の著者とカテゴリーを取得
    const authors = await client.fetch('*[_type == "author"]')
    const categories = await client.fetch('*[_type == "category"]')
    
    console.log(`Found ${authors.length} authors and ${categories.length} categories`)
    
    if (authors.length === 0 || categories.length === 0) {
      console.error('Author or category not found')
      return
    }
    
    // 記事作成
    console.log('Creating post...')
    const post = await client.create({
      _type: 'post',
      title: 'Pro Re Nataへようこそ',
      slug: {
        _type: 'slug',
        current: 'welcome-to-pro-re-nata'
      },
      author: {
        _type: 'reference',
        _ref: authors[0]._id
      },
      categories: [
        {
          _type: 'reference',
          _ref: categories[0]._id
        }
      ],
      publishedAt: new Date().toISOString(),
      excerpt: '新しいサイトPro Re Nataの紹介記事です。必要に応じて最適な情報をお届けします。',
      body: [
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: 'Pro Re Nataへようこそ！'
            }
          ],
          style: 'h1'
        },
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: '「必要に応じて、その都度」という意味のラテン語"Pro Re Nata"を名前に冠した本サイトでは、状況に応じた最適な情報をお届けします。'
            }
          ],
          style: 'normal'
        },
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: 'サイトの特徴'
            }
          ],
          style: 'h2'
        },
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: '• 技術情報とライフハックの融合\n• 実用的で即座に活用できる内容\n• 読者のニーズに応じた情報提供'
            }
          ],
          style: 'normal'
        },
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: '今後の予定'
            }
          ],
          style: 'h2'
        },
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: '様々なトピックを扱っていく予定です：\n• ウェブ開発技術\n• AI・機械学習\n• 生産性向上のヒント\n• 最新テクノロジー動向\n\nどうぞよろしくお願いいたします。'
            }
          ],
          style: 'normal'
        }
      ]
    })
    console.log('Post created:', post._id)
    
    console.log('✅ Welcome post created successfully!')
    
    // 作成されたコンテンツを確認
    const allPosts = await client.fetch('*[_type == "post"]')
    console.log(`Total posts in database: ${allPosts.length}`)
    
  } catch (error) {
    console.error('Error creating post:', error)
  }
}

createPost()