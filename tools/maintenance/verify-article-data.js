const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  token: 'skkTjwpdrsjKKpaDxKVShzCSI7GMWE1r5TQdwl0b7LTylVPoAxzBg0oPqhtUQyfPjyvtZW2mu6nfUMNUJ',
  useCdn: false,
  apiVersion: '2024-01-01'
})

async function verifyArticleData() {
  try {
    console.log('📋 記事データの検証を開始...\n')
    
    // 特定の記事を取得
    const articleId = 'Jx7ptA0c3Aq7il8T99GtdA'
    const article = await client.getDocument(articleId)
    
    console.log('記事ID:', article._id)
    console.log('記事タイトル:', article.title)
    console.log('Body フィールド存在:', !!article.body)
    
    if (article.body) {
      console.log('Body データ型:', Array.isArray(article.body) ? 'Array' : typeof article.body)
      console.log('Body 要素数:', Array.isArray(article.body) ? article.body.length : 0)
      
      if (Array.isArray(article.body) && article.body.length > 0) {
        console.log('\n✅ Body の最初の3要素:')
        article.body.slice(0, 3).forEach((block, index) => {
          console.log(`  ${index + 1}. Type: ${block._type}, Style: ${block.style}`)
          if (block.children && block.children[0]) {
            const text = block.children[0].text || ''
            console.log(`     Text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`)
          }
        })
      } else {
        console.log('❌ Body は空の配列です')
      }
    } else {
      console.log('❌ Body フィールドが存在しません')
    }
    
    // 全記事のbody状態を確認
    console.log('\n📊 全記事のBody状態:')
    const allArticles = await client.fetch(`*[_type == "post"]{_id, title, "hasBody": defined(body), "bodyLength": length(body)}`)
    
    allArticles.forEach(article => {
      const status = article.hasBody ? (article.bodyLength > 0 ? '✅' : '⚠️ 空') : '❌'
      console.log(`${status} ${article.title} (ID: ${article._id}) - Body: ${article.bodyLength || 0}要素`)
    })
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

verifyArticleData()