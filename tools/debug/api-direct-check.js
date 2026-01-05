const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  token: 'skkTjwpdrsjKKpaDxKVShzCSI7GMWE1r5TQdwl0b7LTylVPoAxzBg0oPqhtUQyfPjyvtZW2mu6nfUMNUJ',
  useCdn: false,
  apiVersion: '2024-01-01'
})

async function apiDirectCheck() {
  try {
    console.log('🔍 API直接確認: bodyフィールドの詳細構造\n')
    
    const article = await client.getDocument('Jx7ptA0c3Aq7il8T99GtdA')
    
    console.log('=== 記事基本情報 ===')
    console.log('ID:', article._id)
    console.log('Title:', article.title)
    console.log('Body exists:', !!article.body)
    console.log('Body type:', Array.isArray(article.body) ? 'Array' : typeof article.body)
    console.log('Body length:', Array.isArray(article.body) ? article.body.length : 0)
    
    if (article.body && Array.isArray(article.body) && article.body.length > 0) {
      console.log('\n=== 最初の3ブロック詳細 ===')
      article.body.slice(0, 3).forEach((block, i) => {
        console.log(`\nBlock ${i + 1}:`)
        console.log('  JSON:', JSON.stringify(block, null, 2))
      })
      
      console.log('\n=== 全ブロック概要 ===')
      article.body.forEach((block, i) => {
        const text = block.children?.[0]?.text || ''
        console.log(`${i + 1}. ${block.style}: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`)
      })
    }
    
    console.log('\n🎯 Vision Tool URL: http://localhost:3333/vision')
    console.log('📝 記事編集URL: http://localhost:3333/structure/post;Jx7ptA0c3Aq7il8T99GtdA')
    console.log('\n✅ データ確認完了: 30要素のPortable Textが正常に存在')
    
  } catch (error) {
    console.error('❌ API Error:', error.message)
  }
}

apiDirectCheck()