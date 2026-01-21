import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const base = process.env.REVALIDATE_BASE_URL || 'https://prorenata.jp'
const secret = process.env.REVALIDATE_SECRET

if (!secret) {
  console.error('REVALIDATE_SECRET is missing')
  process.exit(1)
}

const pathArg = process.argv[2]
if (!pathArg) {
  console.error('usage: npm run revalidate -- /posts/slug')
  process.exit(1)
}

const url = `${base}/api/revalidate?path=${encodeURIComponent(pathArg)}`
const res = await fetch(url, { headers: { Authorization: `Bearer ${secret}` } })
const text = await res.text()

console.log(`status=${res.status}`)
console.log(text)
process.exit(res.ok ? 0 : 1)
