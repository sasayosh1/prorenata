/**
 * subscribers.csv → Sanity へのインポートスクリプト
 * 使用方法: node scripts/import-csv-to-sanity.js
 * ※ 重複チェック済み（既存メールアドレスはスキップ）
 */
const { createClient } = require('@sanity/client')
const fs = require('fs/promises')
const path = require('path')
const envPath = path.join(__dirname, '../.env.local')
require('dotenv').config({ path: envPath })

async function importCsvToSanity() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2'
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
  const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN

  if (!token) {
    console.error('Error: SANITY_WRITE_TOKEN または SANITY_API_TOKEN が .env.local に設定されていません')
    process.exit(1)
  }

  const client = createClient({
    projectId,
    dataset,
    useCdn: false,
    apiVersion: '2024-01-01',
    token,
  })

  const csvPath = path.join(__dirname, '../06_メルマガ/リスト/subscribers.csv')

  console.log(`Reading CSV from: ${csvPath}`)
  let csvContent
  try {
    csvContent = await fs.readFile(csvPath, 'utf-8')
  } catch (err) {
    console.error('Error reading CSV:', err.message)
    process.exit(1)
  }

  const lines = csvContent.trim().split('\n').filter(l => l.trim() !== '')
  if (lines.length <= 1) {
    console.log('CSVにデータがありません。終了します。')
    return
  }

  // ヘッダー行をスキップ
  const dataLines = lines.slice(1)
  console.log(`Found ${dataLines.length} entries in CSV`)

  // 既存のSanityデータを取得
  console.log('Fetching existing subscribers from Sanity...')
  const existing = await client.fetch('*[_type == "subscriber"]{email}')
  const existingEmails = new Set(existing.map(s => s.email))
  console.log(`Found ${existingEmails.size} existing subscribers in Sanity`)

  let imported = 0
  let skipped = 0

  for (const line of dataLines) {
    const [subscribedAt, email] = line.split(',').map(s => s.trim())
    if (!email || !email.includes('@')) {
      console.warn(`  Skipping invalid line: ${line}`)
      skipped++
      continue
    }

    if (existingEmails.has(email)) {
      console.log(`  Skip (already exists): ${email}`)
      skipped++
      continue
    }

    try {
      await client.create({
        _type: 'subscriber',
        email,
        subscribedAt: subscribedAt || new Date().toISOString(),
      })
      console.log(`  ✅ Imported: ${email}`)
      imported++
    } catch (err) {
      console.error(`  ❌ Failed to import ${email}: ${err.message}`)
    }
  }

  console.log(`\nDone: ${imported} imported, ${skipped} skipped`)
}

importCsvToSanity()
