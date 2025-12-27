import process from 'node:process'

function requiredEnv(name) {
  const value = process.env[name]
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required ENV/Secret: ${name}`)
  }
  return String(value).trim()
}

function optionalEnv(name, fallback = '') {
  const value = process.env[name]
  return value ? String(value).trim() : fallback
}

function nowJstHour(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    hour12: false,
  })
  return Number(formatter.format(date))
}

function isoDaysAgo(days) {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  return d.toISOString()
}

function buildSanityQuery({ postType, mode, freshDays, evergreenDays }) {
  const createdOrPublished = 'coalesce(publishedAt,_createdAt)'
  if (mode === 'fresh') {
    return `
      *[_type == "${postType}" && defined(slug.current) && ${createdOrPublished} >= $since]
        | order(${createdOrPublished} desc)[0...100]{
          _id,
          title,
          "slug": slug.current,
          publishedAt,
          _createdAt,
          body
        }
    `
  }

  return `
    *[_type == "${postType}" && defined(slug.current) && ${createdOrPublished} <= $since]
      | order(${createdOrPublished} desc)[0...200]{
        _id,
        title,
        "slug": slug.current,
        publishedAt,
        _createdAt,
        body
      }
  `
}

function pickOne(posts, { mode }) {
  if (!Array.isArray(posts) || posts.length === 0) return null

  const normalized = posts
    .filter((p) => p && typeof p === 'object')
    .filter((p) => typeof p._id === 'string' && typeof p.slug === 'string')

  if (normalized.length === 0) return null

  // fresh: newest / evergreen: random from the pool
  if (mode === 'fresh') return normalized[0]

  const index = Math.floor(Math.random() * normalized.length)
  return normalized[index]
}

export function resolveMailMode() {
  const forced = optionalEnv('MAIL_MODE', '').toLowerCase()
  if (forced === 'fresh' || forced === 'evergreen') return forced
  const hourJst = nowJstHour()
  return hourJst < 12 ? 'fresh' : 'evergreen'
}

export async function fetchOnePost() {
  const SANITY_PROJECT_ID = requiredEnv('SANITY_PROJECT_ID')
  const SANITY_DATASET = requiredEnv('SANITY_DATASET')
  const SANITY_API_VERSION = requiredEnv('SANITY_API_VERSION')
  const SANITY_TOKEN = optionalEnv('SANITY_TOKEN', '')

  const postType = optionalEnv('POST_TYPE', 'post')
  const mode = resolveMailMode()

  const freshDays = Number(optionalEnv('FRESH_DAYS', '7'))
  const evergreenDays = Number(optionalEnv('EVERGREEN_DAYS', '30'))

  const since =
    mode === 'fresh' ? isoDaysAgo(freshDays) : isoDaysAgo(evergreenDays)

  const groq = buildSanityQuery({ postType, mode, freshDays, evergreenDays })
  const queryParam = encodeURIComponent(groq)
  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${queryParam}&$since=${JSON.stringify(
    since
  )}`

  const res = await fetch(url, {
    headers: SANITY_TOKEN ? { Authorization: `Bearer ${SANITY_TOKEN}` } : {},
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(
      `Sanity fetch failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`
    )
  }

  const json = await res.json()
  const posts = json?.result
  const picked = pickOne(posts, { mode })

  if (!picked) {
    throw new Error(`No eligible "${postType}" found for mode=${mode} since=${since}`)
  }

  return {
    mode,
    since,
    post: {
      id: picked._id,
      title: String(picked.title || '').trim(),
      slug: String(picked.slug || '').trim(),
      publishedAt: picked.publishedAt || null,
      createdAt: picked._createdAt || null,
      body: picked.body || [],
    },
  }
}

