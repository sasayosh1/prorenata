const { createClient } = require('@sanity/client')
require('dotenv').config()

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
})

async function checkSubscribers() {
  console.log('Fetching subscribers from Sanity...')
  try {
    const subscribers = await client.fetch('*[_type == "subscriber"] | order(subscribedAt desc)')
    console.log(`Found ${subscribers.length} subscribers:`)
    subscribers.forEach((s, i) => {
      console.log(`${i + 1}: ${s.email} (Subscribed at: ${s.subscribedAt})`)
    })
  } catch (err) {
    console.error('Error fetching subscribers:', err.message)
  }
}

checkSubscribers()
