const { createClient } = require('@sanity/client')
const fs = require('fs/promises')
const path = require('path')
const envPath = path.join(__dirname, '../.env.local')
require('dotenv').config({ path: envPath })

async function syncSubscribers() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2'
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
  const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN

  if (!token) {
    console.error('Error: SANITY_WRITE_TOKEN or SANITY_API_TOKEN is not defined')
    process.exit(1)
  }

  const client = createClient({
    projectId,
    dataset,
    useCdn: false,
    apiVersion: '2024-01-01',
    token,
  })

  const targetPath = path.join(__dirname, '../06_メルマガ/リスト/subscribers.csv')

  console.log('Fetching active subscribers from Sanity...')
  try {
    const subscribers = await client.fetch('*[_type == "subscriber" && !defined(unsubscribedAt)] | order(subscribedAt asc)')

    // Sanityが0件の場合、既存CSVにデータがあれば上書きしない（データ消失防止）
    if (subscribers.length === 0) {
      try {
        const existing = await fs.readFile(targetPath, 'utf-8')
        const existingLines = existing.trim().split('\n').filter(l => l.trim() !== '')
        if (existingLines.length > 1) {
          console.warn(`⚠️  Sanity returned 0 subscribers but CSV has ${existingLines.length - 1} entries.`)
          console.warn('Skipping overwrite to prevent data loss. Check if SANITY_WRITE_TOKEN is configured correctly.')
          process.exit(0)
        }
      } catch {
        // CSVファイルが存在しない場合はそのまま続行
      }
    }

    const csvHeader = 'subscribedAt,email\n'
    const csvLines = subscribers.map(s => {
      let dateStr = s.subscribedAt || ''
      if (dateStr && dateStr.includes('Z')) {
        // UTCをJSTに変換
        const date = new Date(dateStr)
        const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000)
        dateStr = jstDate.toISOString().replace('Z', '+09:00')
      }
      return `${dateStr},${s.email || ''}`
    }).join('\n')
    const finalCsv = csvHeader + csvLines + '\n'

    await fs.writeFile(targetPath, finalCsv)

    console.log(`✅ Successfully synced ${subscribers.length} subscribers to ${targetPath}`)
  } catch (err) {
    console.error('Error syncing subscribers:', err.message)
    process.exit(1)
  }
}

syncSubscribers()
