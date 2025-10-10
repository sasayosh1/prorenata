require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const { MOSHIMO_LINKS } = require('./moshimo-affiliate-links')
const https = require('https')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

// URLの有効性をチェック
function checkUrlHealth(url) {
  return new Promise((resolve) => {
    const urlToCheck = url.startsWith('//') ? 'https:' + url : url
    
    const req = https.request(urlToCheck, { method: 'HEAD', timeout: 5000 }, (res) => {
      resolve({
        url,
        status: res.statusCode,
        ok: res.statusCode >= 200 && res.statusCode < 400
      })
    })

    req.on('error', () => {
      resolve({ url, status: null, ok: false })
    })

    req.on('timeout', () => {
      req.destroy()
      resolve({ url, status: null, ok: false })
    })

    req.end()
  })
}

async function main() {
  const line = '='.repeat(60)
  console.log(line)
  console.log('🔍 アフィリエイトリンク健全性チェック')
  console.log(line)
  console.log()
  console.log('実行日時: ' + new Date().toLocaleString('ja-JP'))
  console.log()

  // もしもアフィリエイトリンクのチェック
  console.log('📊 もしもアフィリエイトリンク:')
  console.log(line)

  const results = []

  for (const [key, link] of Object.entries(MOSHIMO_LINKS)) {
    if (!link.active) {
      console.log('⏸️  ' + link.name + ' (無効化済み)')
      continue
    }

    process.stdout.write('🔍 ' + link.name + ' をチェック中... ')
    
    const result = await checkUrlHealth(link.url)
    results.push({ key, ...link, health: result })

    if (result.ok) {
      console.log('✅ OK (' + result.status + ')')
    } else {
      console.log('❌ エラー (' + (result.status || 'タイムアウト') + ')')
    }
  }

  console.log()
  console.log(line)
  console.log('📈 チェック結果サマリー')
  console.log(line)

  const totalLinks = results.length
  const healthyLinks = results.filter(r => r.health.ok).length
  const unhealthyLinks = results.filter(r => !r.health.ok).length

  console.log('総リンク数: ' + totalLinks + '個')
  console.log('✅ 正常: ' + healthyLinks + '個 (' + ((healthyLinks / totalLinks) * 100).toFixed(1) + '%)')
  console.log('❌ 異常: ' + unhealthyLinks + '個 (' + ((unhealthyLinks / totalLinks) * 100).toFixed(1) + '%)')
  console.log()

  if (unhealthyLinks > 0) {
    console.log('⚠️  異常なリンク:')
    results.filter(r => !r.health.ok).forEach(r => {
      console.log('   - ' + r.name + ' (' + r.key + ')')
      console.log('     URL: ' + r.url)
    })
    console.log()
  }

  // Sanity内のリンク使用状況もチェック
  console.log(line)
  console.log('📝 記事内のリンク使用状況:')
  console.log(line)

  const posts = await client.fetch('*[_type == "post"] { _id, title, body }')
  
  const linkUsage = {}
  Object.keys(MOSHIMO_LINKS).forEach(key => {
    linkUsage[key] = 0
  })

  posts.forEach(post => {
    if (!post.body) return

    post.body.forEach(block => {
      if (!block.markDefs) return

      block.markDefs.forEach(mark => {
        if (mark._type !== 'link' || !mark.href) return

        Object.entries(MOSHIMO_LINKS).forEach(([key, link]) => {
          if (mark.href.includes(link.url) || link.url.includes(mark.href)) {
            linkUsage[key]++
          }
        })
      })
    })
  })

  Object.entries(linkUsage).forEach(([key, count]) => {
    const link = MOSHIMO_LINKS[key]
    console.log(link.name + ': ' + count + '箇所')
  })

  console.log()
  console.log(line)
  console.log('✨ チェック完了')
  console.log(line)
  console.log()

  // 異常がある場合は終了コード1
  if (unhealthyLinks > 0) {
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch(console.error)
}
