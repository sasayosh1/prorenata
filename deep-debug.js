const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  token: 'skkTjwpdrsjKKpaDxKVShzCSI7GMWE1r5TQdwl0b7LTylVPoAxzBg0oPqhtUQyfPjyvtZW2mu6nfUMNUJ',
  useCdn: false,
  apiVersion: '2024-01-01'
})

async function deepDebug() {
  try {
    console.log('🔍 DEEP DEBUG: 根本原因の徹底調査\n')
    
    const articleId = 'Jx7ptA0c3Aq7il8T99GtdA'
    
    // 1. 生のドキュメントデータを取得
    console.log('=== 1. RAW DOCUMENT DATA ===')
    const rawDoc = await client.getDocument(articleId)
    console.log('Document ID:', rawDoc._id)
    console.log('Document Type:', rawDoc._type)
    console.log('Title:', rawDoc.title)
    console.log('Body exists:', !!rawDoc.body)
    console.log('Body type:', Array.isArray(rawDoc.body) ? 'Array' : typeof rawDoc.body)
    console.log('Body length:', Array.isArray(rawDoc.body) ? rawDoc.body.length : 'N/A')
    
    if (rawDoc.body && Array.isArray(rawDoc.body)) {
      console.log('\n=== 2. BODY STRUCTURE ANALYSIS ===')
      console.log('First 3 blocks:')
      rawDoc.body.slice(0, 3).forEach((block, i) => {
        console.log(`Block ${i + 1}:`)
        console.log('  _type:', block._type)
        console.log('  _key:', block._key)
        console.log('  style:', block.style)
        console.log('  children count:', block.children?.length || 0)
        if (block.children && block.children[0]) {
          console.log('  first child _type:', block.children[0]._type)
          console.log('  first child text:', block.children[0].text?.substring(0, 50) + '...')
        }
        console.log('')
      })
    }
    
    // 3. スキーマ検証
    console.log('=== 3. SCHEMA VALIDATION ===')
    const allSchemaTypes = await client.fetch(`*[_type == "_type" && name == "post"][0]`)
    console.log('Post schema exists:', !!allSchemaTypes)
    
    // 4. 他の記事との比較
    console.log('=== 4. OTHER ARTICLES COMPARISON ===')
    const otherArticles = await client.fetch(`*[_type == "post" && _id != "${articleId}"][0...3]{_id, title, "hasBody": defined(body), "bodyLength": length(body)}`)
    otherArticles.forEach(article => {
      console.log(`${article._id}: ${article.title}`)
      console.log(`  Has body: ${article.hasBody}, Length: ${article.bodyLength || 0}`)
    })
    
    // 5. GROQ クエリでの詳細検証
    console.log('\n=== 5. GROQ QUERY VALIDATION ===')
    const groqResult = await client.fetch(`*[_id == "${articleId}"][0]{
      _id,
      title,
      body,
      "bodyType": string::type(body),
      "bodyLength": length(body),
      "firstBlockType": body[0]._type,
      "firstBlockStyle": body[0].style
    }`)
    console.log('GROQ Result:', JSON.stringify(groqResult, null, 2))
    
    // 6. 実際のJSON構造の出力
    console.log('\n=== 6. ACTUAL BODY JSON STRUCTURE ===')
    if (rawDoc.body && rawDoc.body[0]) {
      console.log('First block JSON:')
      console.log(JSON.stringify(rawDoc.body[0], null, 2))
    }
    
  } catch (error) {
    console.error('❌ Debug Error:', error)
  }
}

deepDebug()