const { createClient } = require('@sanity/client')
require('dotenv').config({ path: '.env.local' })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN,
})

async function checkSubscriber() {
  try {
    console.log('🔍 メルマガ購読者のデータをチェック中...\n')
    
    // 全購読者を取得
    const subscribers = await client.fetch(
      `*[_type == "subscriber"] | order(subscribedAt desc) {
        _id,
        email,
        subscribedAt,
        lastStepSent,
        unsubscribedAt
      }[0...20]`
    )
    
    console.log(`📊 登録済み購読者数: ${subscribers.length}\n`)
    
    if (subscribers.length === 0) {
      console.log('⚠️  購読者がいません\n')
      return
    }
    
    // 特定のメールアドレスを検索
    const target = 'ptb875pmj49@gmail.com'
    const found = subscribers.find(s => s.email === target)
    
    console.log('📋 全購読者一覧:')
    console.log('━'.repeat(80))
    
    subscribers.forEach((sub, idx) => {
      const isTarget = sub.email === target ? ' 👈 ターゲット' : ''
      const subscribedDate = new Date(sub.subscribedAt).toLocaleString('ja-JP')
      const daysElapsed = Math.floor((Date.now() - new Date(sub.subscribedAt).getTime()) / (1000 * 60 * 60 * 24))
      
      console.log(`${idx + 1}. ${sub.email}${isTarget}`)
      console.log(`   登録日: ${subscribedDate} (${daysElapsed}日前)`)
      console.log(`   最終送信ステップ: ${sub.lastStepSent || '未送信'}`)
      if (sub.unsubscribedAt) {
        console.log(`   購読解除: ${new Date(sub.unsubscribedAt).toLocaleString('ja-JP')}`)
      }
      console.log('')
    })
    
    if (!found) {
      console.log(`❌ ${target} は登録されていません\n`)
    } else {
      console.log('━'.repeat(80))
      console.log(`✅ ${target} の詳細:`)
      console.log(JSON.stringify(found, null, 2))
      console.log('')
      
      // 期待されるステップを計算
      const daysElapsed = Math.floor((Date.now() - new Date(found.subscribedAt).getTime()) / (1000 * 60 * 60 * 24))
      const lastStepSent = found.lastStepSent || 1
      const nextStep = lastStepSent + 1
      
      console.log(`📈 進捗:`)
      console.log(`   経過日数: ${daysElapsed}日`)
      console.log(`   最終送信ステップ: ${lastStepSent}`)
      console.log(`   次のステップ: ${nextStep}`)
      console.log(`   送信予定日: ${nextStep - 1}日目`)
      console.log(`   状態: ${daysElapsed >= nextStep - 1 ? '✅ 送信可能' : '⏳ 待機中'}`)
    }
    
  } catch (err) {
    console.error('❌ エラー:', err.message)
    process.exit(1)
  }
}

checkSubscriber()
