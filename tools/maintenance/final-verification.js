const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  token: 'skkTjwpdrsjKKpaDxKVShzCSI7GMWE1r5TQdwl0b7LTylVPoAxzBg0oPqhtUQyfPjyvtZW2mu6nfUMNUJ',
  useCdn: false,
  apiVersion: '2024-01-01'
})

async function finalVerification() {
  try {
    console.log('🔍 最終検証: Sanity Studio bodyフィールド状況\n')
    
    // 1. データの最終確認
    const article = await client.getDocument('Jx7ptA0c3Aq7il8T99GtdA')
    console.log('=== データ状況 ===')
    console.log('✅ 記事存在:', !!article)
    console.log('✅ タイトル:', article.title)
    console.log('✅ Body存在:', !!article.body)
    console.log('✅ Body形式:', Array.isArray(article.body) ? 'Array (正常)' : typeof article.body)
    console.log('✅ Body要素数:', Array.isArray(article.body) ? article.body.length : 0)
    
    // 2. 全記事のBody状況
    console.log('\n=== 全記事Body状況 ===')
    const allArticles = await client.fetch(`*[_type == "post"]{
      _id, 
      title,
      "hasBody": defined(body), 
      "bodyLength": length(body)
    } | order(bodyLength desc)[0...15]`)
    
    let withBodyCount = 0
    let emptyBodyCount = 0
    
    allArticles.forEach(article => {
      const hasBody = article.bodyLength > 0
      if (hasBody) {
        withBodyCount++
        console.log(`✅ ${article.title} (${article.bodyLength}要素)`)
      } else {
        emptyBodyCount++
        console.log(`❌ ${article.title} (空)`)
      }
    })
    
    console.log(`\n📊 統計:`)
    console.log(`   Body有り: ${withBodyCount}記事`)
    console.log(`   Body無し: ${emptyBodyCount}記事`)
    
    // 3. リッチテキスト要素の確認
    if (article.body && article.body.length > 0) {
      console.log('\n=== リッチテキスト要素確認 ===')
      const styles = new Set()
      const marks = new Set()
      
      article.body.forEach(block => {
        if (block.style) styles.add(block.style)
        if (block.children) {
          block.children.forEach(child => {
            if (child.marks) {
              child.marks.forEach(mark => marks.add(mark))
            }
          })
        }
      })
      
      console.log('✅ 使用スタイル:', Array.from(styles).join(', '))
      console.log('✅ 使用マーク:', Array.from(marks).join(', ') || 'なし')
    }
    
    console.log('\n🎯 Studio URL: http://localhost:3333/structure/post;Jx7ptA0c3Aq7il8T99GtdA')
    console.log('📝 期待される表示: 30要素のリッチテキスト (H2見出し, 段落, リスト等)')
    
  } catch (error) {
    console.error('❌ エラー:', error.message)
  }
}

finalVerification()