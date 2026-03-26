const { createClient } = require('@sanity/client')
const fs = require('fs/promises')
const path = require('path')
const envPath = path.join(__dirname, '../.env.local')
require('dotenv').config({ path: envPath })

async function syncSubscribers() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2'
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
  const token = process.env.SANITY_API_TOKEN

  if (!token) {
    console.error('Error: SANITY_API_TOKEN is not defined in .env.local')
    process.exit(1)
  }

  const client = createClient({
    projectId,
    dataset,
    useCdn: false,
    apiVersion: '2024-01-01',
    token,
  })

  console.log('Fetching active subscribers from Sanity...')
  try {
    const subscribers = await client.fetch('*[_type == "subscriber" && !defined(unsubscribedAt)] | order(subscribedAt asc)')
    
    const csvHeader = 'subscribedAt,email\n'
    const csvLines = subscribers.map(s => `${s.subscribedAt || ''},${s.email || ''}`).join('\n')
    const finalCsv = csvHeader + csvLines + '\n'

    const targetPath = path.join(__dirname, '../06_メルマガ/リスト/subscribers.csv')
    await fs.writeFile(targetPath, finalCsv)

    console.log(`Successfully synced ${subscribers.length} subscribers to ${targetPath}`)
  } catch (err) {
    console.error('Error syncing subscribers:', err.message)
  }
}

syncSubscribers()
