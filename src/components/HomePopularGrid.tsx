import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import Image from 'next/image'
import { client, urlFor, type Post } from '@/lib/sanity'
import { sanitizeTitle } from '@/lib/title'
import { THUMBNAIL_MAPPINGS } from '@/data/thumbnail_mappings'

type GscRow = {
  page?: string
  query?: string
  clicks?: string
  impressions?: string
  ctr?: string
  position?: string
}

type Ga4Row = {
  pagePath?: string
  sessions?: string
  engagementRate?: string
  averageSessionDuration?: string
}

function parseCsv(content: string): Record<string, string>[] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  const pushField = () => {
    row.push(field)
    field = ''
  }
  const pushRow = () => {
    rows.push(row)
    row = []
  }

  for (let index = 0; index < content.length; index++) {
    const ch = content[index]
    if (inQuotes) {
      if (ch === '"') {
        const next = content[index + 1]
        if (next === '"') {
          field += '"'
          index++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
      continue
    }

    if (ch === '"') {
      inQuotes = true
      continue
    }

    if (ch === ',') {
      pushField()
      continue
    }
    if (ch === '\r') continue
    if (ch === '\n') {
      pushField()
      pushRow()
      continue
    }
    field += ch
  }

  pushField()
  if (row.length > 1 || (row.length === 1 && row[0] !== '')) pushRow()

  const header = rows.shift() || []
  const records: Record<string, string>[] = []
  for (const r of rows) {
    if (r.length === 1 && r[0] === '') continue
    const rec: Record<string, string> = {}
    for (let i = 0; i < header.length; i++) {
      rec[header[i]] = r[i] ?? ''
    }
    records.push(rec)
  }
  return records
}

function loadCsv<T extends Record<string, string>>(relativePath: string): T[] | null {
  try {
    const filePath = path.join(process.cwd(), relativePath)
    if (!fs.existsSync(filePath)) return null
    const content = fs.readFileSync(filePath, 'utf8')
    if (!content.trim()) return []
    return parseCsv(content) as T[]
  } catch (error) {
    console.error(`Failed to read CSV: ${relativePath}`, error)
    return null
  }
}

function toPathFromUrl(url: string | undefined): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    return u.pathname || '/'
  } catch {
    return null
  }
}

function slugFromPostPath(pathname: string): string | null {
  if (!pathname.startsWith('/posts/')) return null
  const parts = pathname.split('/').filter(Boolean)
  return parts[1] || null
}

function safeNumber(value: unknown): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function log1p(value: number): number {
  return Math.log(1 + Math.max(0, value))
}

function computeRevenueBoost(post: Pick<Post, 'title' | 'categories' | 'tags' | 'slug'>): number {
  const title = (post.title || '').toLowerCase()
  const slug = post.slug?.current?.toLowerCase?.() || ''
  const tags = (post.tags || []).map((t) => String(t).toLowerCase())
  const categorySlugs = (post.categories || [])
    .map((c) => (c?.slug ? String(c.slug).toLowerCase() : ''))
    .filter(Boolean)

  const haystack = [title, slug, ...tags, ...categorySlugs].join(' ')

  // High intent / monetization-adjacent topics (lightweight heuristic).
  const strong = [
    '転職',
    '退職',
    '退職代行',
    '志望動機',
    '面接',
    '履歴書',
    '給料',
    '年収',
    '手当',
    '夜勤',
    'job-hunting',
    'retirement',
    'resignation',
    'agency',
    'agent',
    'salary',
    'pay',
    'interview',
  ]

  const medium = [
    'メンタル',
    '人間関係',
    'ストレス',
    'つらい',
    '疲れ',
    '不安',
    'health',
    'mental',
    'stress',
  ]

  const strongHit = strong.some((k) => haystack.includes(k.toLowerCase()))
  const mediumHit = medium.some((k) => haystack.includes(k.toLowerCase()))

  if (strongHit) return 0.1
  if (mediumHit) return 0.05
  return 0
}

async function fetchFallbackPosts(limit: number): Promise<Post[]> {
  // 閲覧数が多い順、または「悩み」の深い特定カテゴリを優先して表示
  // 1. views (閲覧数) の降順
  // 2. 特定カテゴリ（退職、転職、給料、人間関係）が含まれるか（ブースト）
  // 3. 最新順
  const query = `*[_type == "post" && (!defined(internalOnly) || internalOnly == false) && defined(slug.current)] 
    | score(
      views > 0,
      categories[]->title match "退職" || categories[]->title match "辞めたい" || categories[]->title match "退職代行" || categories[]->title match "転職",
      categories[]->title match "給料" || categories[]->title match "年収" || categories[]->title match "手当",
      categories[]->title match "人間関係" || categories[]->title match "悩み"
    )
    | order(
      views desc,
      _score desc,
      publishedAt desc
    )[0...$limit]{
      _id,
      title,
      slug,
      _createdAt,
      publishedAt,
      excerpt,
      mainImage,
      "categories": categories[]->{title,"slug":slug.current},
      tags,
      internalOnly,
      views
    }`
  return await client.fetch(query, { limit })
}

async function safeFetchFallbackPosts(limit: number): Promise<Post[]> {
  // Tier 1: Try the score()-based query
  try {
    const result = await fetchFallbackPosts(limit)
    if (result && result.length > 0) return result
  } catch (error) {
    console.error('safeFetchFallbackPosts: score query failed, trying simple fallback:', error)
  }

  // Tier 2: Simple fallback - just fetch by publishedAt (universally reliable)
  try {
    const simpleQuery = `*[_type == "post" && (!defined(internalOnly) || internalOnly == false) && defined(slug.current)] 
      | order(publishedAt desc)[0...$limit]{
        _id,
        title,
        slug,
        _createdAt,
        publishedAt,
        excerpt,
        mainImage,
        "categories": categories[]->{title,"slug":slug.current},
        tags,
        internalOnly
      }`
    return await client.fetch(simpleQuery, { limit })
  } catch (error) {
    console.error('safeFetchFallbackPosts: simple fallback also failed:', error)
    return []
  }
}

async function fetchPostsBySlugs(slugs: string[], limit: number): Promise<Post[]> {
  if (slugs.length === 0) return []

  const query = `*[_type == "post" && slug.current in $slugs && (!defined(internalOnly) || internalOnly == false)]{
    _id,
    title,
    slug,
    _createdAt,
    publishedAt,
    excerpt,
    mainImage,
    "categories": categories[]->{title,"slug":slug.current},
    tags,
    internalOnly
  }`

  const posts: Post[] = await client.fetch(query, { slugs })
  const bySlug = new Map(posts.map((p) => [p.slug.current, p]))
  return slugs.map((s) => bySlug.get(s)).filter(Boolean).slice(0, limit) as Post[]
}

function getLocalThumbnail(slug: string): string | null {
  const dir = path.join(process.cwd(), 'public', 'blog_thumbnails')
  if (!fs.existsSync(dir)) return null

  // 1. Check for manual mapping first
  const mappedFilename = THUMBNAIL_MAPPINGS[slug]
  if (mappedFilename) {
    const filePath = path.join(dir, mappedFilename)
    if (fs.existsSync(filePath)) {
      return `/blog_thumbnails/${mappedFilename}`
    }
  }

  // 2. Fallback to slug-based auto-discovery
  try {
    const files = fs.readdirSync(dir)
    const pattern = new RegExp(`^${slug}(-v\\d+)?\\.png$`)
    const matches = files.filter((f) => pattern.test(f))

    if (matches.length === 0) return null

    // Sort to get the latest version (e.g., -v22 before -v21 before base)
    matches.sort((a, b) => {
      const vA = a.match(/-v(\d+)\.png$/)?.[1]
      const vB = b.match(/-v(\d+)\.png$/)?.[1]
      if (vA && vB) return parseInt(vB) - parseInt(vA)
      if (vA) return -1
      if (vB) return 1
      return 0
    })

    return `/blog_thumbnails/${matches[0]}`
  } catch (error) {
    console.error('Local thumbnail check failed:', error)
    return null
  }
}

function renderPopularSection(picked: Post[]) {
  return (
    <section className="mb-20">
      <div className="flex items-end justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">人気記事</h2>
          <p className="mt-1 text-sm text-gray-600">いま注目されている記事をまとめました。</p>
        </div>
        <Link href="/posts" className="text-cyan-700 hover:text-cyan-800 text-sm font-semibold">
          記事一覧 →
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {picked.map((post) => {
          const title = sanitizeTitle(post.title)
          const href = `/posts/${post.slug.current}`
          const category = post.categories && post.categories.length > 0 ? post.categories[0]?.title : null

          return (
            <Link
              key={post._id}
              href={href}
              className="group block h-full no-underline"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <article className="h-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                  {post.mainImage ? (
                    <Image
                      src={urlFor(post.mainImage).width(900).height(560).url()}
                      alt={title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : getLocalThumbnail(post.slug.current) ? (
                    <Image
                      src={getLocalThumbnail(post.slug.current)!}
                      alt={title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-100 to-blue-50 opacity-60"></div>
                  )}
                  {category ? (
                    <div className="absolute bottom-3 left-3">
                      <span className="inline-block px-3 py-1 bg-white/90 backdrop-blur-sm text-cyan-700 text-xs font-bold rounded-full shadow-sm">
                        {category}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="p-5">
                  <h3 className="text-base font-bold text-gray-900 line-clamp-2 group-hover:text-cyan-700 transition-colors">
                    {title}
                  </h3>
                  {post.excerpt ? <p className="mt-2 text-sm text-gray-600 line-clamp-2">{post.excerpt}</p> : null}
                </div>
              </article>
            </Link>
          )
        })}
      </div>

      <div className="mt-12 flex justify-center">
        <Link
          href="/posts"
          className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-base font-bold text-cyan-700 ring-1 ring-cyan-100 shadow-sm hover:bg-cyan-50 hover:ring-cyan-200 transition-all duration-200"
        >
          記事一覧を見る →
        </Link>
      </div>
    </section>
  )
}

// --- Strategic Pins (3-slot reserved) ---
const STRATEGIC_PINS = [
  'nursing-assistant-latest-salary-comparison', // 💰 Revenue
  'nursing-assistant-resignation-advice-insights', // 💰 Revenue
  'nursing-assistant-care-guide-compassa', // ❤️ Trust
]

// Priority order for analytic signals: Sessions(GA4) > Impressions(GSC) > CTR(GSC)
export default async function HomePopularGrid({ limit = 9 }: { limit?: number }) {
  try {
    // 1. Load Data
    const ga4Data = loadCsv<Ga4Row>('data/ga4_last30d.csv') || []
    const gscData = loadCsv<GscRow>('data/gsc_last30d.csv') || []

    // 2. Score and Rank
    const scoreMap = new Map<string, number>()

    // GA4 Scoring (Sessions = Heavy weight)
    for (const row of ga4Data) {
      const slug = slugFromPostPath(row.pagePath || '')
      if (!slug) continue
      const sessions = safeNumber(row.sessions)
      scoreMap.set(slug, (scoreMap.get(slug) || 0) + log1p(sessions) * 1.5)
    }

    // GSC Scoring (Impressions = Discovery weight)
    for (const row of gscData) {
      const slug = slugFromPostPath(toPathFromUrl(row.page) || '')
      if (!slug) continue
      const impressions = safeNumber(row.impressions)
      scoreMap.set(slug, (scoreMap.get(slug) || 0) + log1p(impressions) * 0.5)
    }

    // 3. Select Hybrid Articles
    // Top 6 from Data (excluding strategic pins)
    const sortedSlugs = Array.from(scoreMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([slug]) => slug)
      .filter((s) => !STRATEGIC_PINS.includes(s))

    const topDataSlugs = sortedSlugs.slice(0, 6)

    // Combine: Strategic(3) + Data(6) = 9
    const finalSlugs = [...STRATEGIC_PINS, ...topDataSlugs].slice(0, limit)

    // 4. Fetch Meta
    const picked = await fetchPostsBySlugs(finalSlugs, limit)

    // Fallback if results are too low
    if (picked.length < limit) {
      const fallback = await safeFetchFallbackPosts(limit)
      const existingIds = new Set(picked.map((p) => p._id))
      for (const f of fallback) {
        if (!existingIds.has(f._id)) {
          picked.push(f)
          if (picked.length >= limit) break
        }
      }
    }

    return renderPopularSection(picked)
  } catch (error) {
    console.error('HomePopularGrid failed:', error)
    // Absolute safety: Fetch anything if pipeline crashes
    const emergencyFallback = await safeFetchFallbackPosts(limit)
    return renderPopularSection(emergencyFallback)
  }
}
