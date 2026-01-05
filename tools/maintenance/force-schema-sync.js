const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  token: 'skkTjwpdrsjKKpaDxKVShzCSI7GMWE1r5TQdwl0b7LTylVPoAxzBg0oPqhtUQyfPjyvtZW2mu6nfUMNUJ',
  useCdn: false,
  apiVersion: '2024-01-01'
})

async function forceSchemaSync() {
  console.log('🔄 強制スキーマ同期を開始...')
  
  // 記事の現在の状態を確認
  const article = await client.getDocument('Jx7ptA0c3Aq7il8T99GtdA')
  console.log('📋 現在のBodyフィールド:')
  console.log('- Type:', Array.isArray(article.body) ? 'Array' : typeof article.body)
  console.log('- Length:', Array.isArray(article.body) ? article.body.length : 0)
  
  if (Array.isArray(article.body) && article.body.length > 0) {
    console.log('\n🔧 スキーマ同期のため一時的にbodyを削除・再設定...')
    
    // 1. bodyフィールドを一時的に削除
    await client.patch('Jx7ptA0c3Aq7il8T99GtdA')
      .unset(['body'])
      .commit()
    console.log('✅ Body フィールド一時削除完了')
    
    // 2. 少し待機
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 3. bodyフィールドを再設定
    await client.patch('Jx7ptA0c3Aq7il8T99GtdA')
      .set({ body: article.body })
      .commit()
    console.log('✅ Body フィールド再設定完了')
    
    // 4. 検証
    const updatedArticle = await client.getDocument('Jx7ptA0c3Aq7il8T99GtdA')
    console.log('\n✅ 更新完了:')
    console.log('- Body Length:', Array.isArray(updatedArticle.body) ? updatedArticle.body.length : 0)
    console.log('- 最初の要素:', updatedArticle.body[0]?.children[0]?.text?.substring(0, 50) + '...')
    
  } else {
    console.log('❌ Body データが見つかりません')
  }
}

forceSchemaSync().catch(console.error)