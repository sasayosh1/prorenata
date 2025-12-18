import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import Image from 'next/image'
import { client, urlFor, type Post } from '@/lib/sanity'
import { sanitizeTitle } from '@/lib/title'

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
  const filePath = path.join(process.cwd(), relativePath)
  if (!fs.existsSync(filePath)) return null
  const content = fs.readFileSync(filePath, 'utf8')
  if (!content.trim()) return []
  return parseCsv(content) as T[]
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

  if (strongHit) return 0.4
  if (mediumHit) return 0.15
  return 0.05
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

export default async function HomePopularGrid({ limit = 9 }: { limit?: number }) {
  const gsc = loadCsv<GscRow>('data/gsc_last30d.csv')
  const ga4 = loadCsv<Ga4Row>('data/ga4_last30d.csv')

  if (!gsc || !ga4) {
    return null
  }

  const gscAgg = new Map<
    string,
    { impressions: number; clicks: number; positionWeighted: number; positionWeight: number }
  >()
  for (const row of gsc) {
    const pagePath = toPathFromUrl(row.page)
    if (!pagePath) continue
    const slug = slugFromPostPath(pagePath)
    if (!slug) continue

    const impressions = safeNumber(row.impressions)
    const clicks = safeNumber(row.clicks)
    const position = safeNumber(row.position)

    if (!gscAgg.has(slug)) gscAgg.set(slug, { impressions: 0, clicks: 0, positionWeighted: 0, positionWeight: 0 })
    const acc = gscAgg.get(slug)!
    acc.impressions += impressions
    acc.clicks += clicks
    if (impressions > 0 && position > 0) {
      acc.positionWeighted += impressions * position
      acc.positionWeight += impressions
    }
  }

  const gaAgg = new Map<
    string,
    { sessions: number; durationWeighted: number; engagementWeighted: number }
  >()
  for (const row of ga4) {
    const pagePath = String(row.pagePath || '')
    const slug = slugFromPostPath(pagePath)
    if (!slug) continue

    const sessions = safeNumber(row.sessions)
    const duration = safeNumber(row.averageSessionDuration)
    const engagement = safeNumber(row.engagementRate)

    if (!gaAgg.has(slug)) gaAgg.set(slug, { sessions: 0, durationWeighted: 0, engagementWeighted: 0 })
    const acc = gaAgg.get(slug)!
    acc.sessions += sessions
    acc.durationWeighted += sessions * duration
    acc.engagementWeighted += sessions * engagement
  }

  const candidates = new Set<string>()
  const gscTop = [...gscAgg.entries()]
    .sort((a, b) => b[1].impressions - a[1].impressions)
    .slice(0, 250)
    .map(([slug]) => slug)
  const gaTop = [...gaAgg.entries()]
    .sort((a, b) => b[1].sessions - a[1].sessions)
    .slice(0, 250)
    .map(([slug]) => slug)

  for (const s of [...gscTop, ...gaTop]) candidates.add(s)

  // Quick pass: compute score without revenue boost.
  const scored = [...candidates].map((slug) => {
    const g = gscAgg.get(slug)
    const ga = gaAgg.get(slug)
    const impressions = g?.impressions || 0
    const clicks = g?.clicks || 0
    const sessions = ga?.sessions || 0
    const base = log1p(impressions) * 120 + clicks * 8 + log1p(sessions) * 90
    return { slug, base }
  })
  scored.sort((a, b) => b.base - a.base)

  const topSlugs = scored.slice(0, 120).map((s) => s.slug)
  const posts = await fetchPostsBySlugs(topSlugs, 120)

  const finalScored = posts.map((post) => {
    const slug = post.slug.current
    const g = gscAgg.get(slug)
    const ga = gaAgg.get(slug)
    const impressions = g?.impressions || 0
    const clicks = g?.clicks || 0
    const sessions = ga?.sessions || 0
    const avgDuration = ga && ga.sessions > 0 ? ga.durationWeighted / ga.sessions : 0
    const engagementRate = ga && ga.sessions > 0 ? ga.engagementWeighted / ga.sessions : 0

    const revenueBoost = computeRevenueBoost(post)
    const engagementPenalty = sessions >= 20 && avgDuration > 0 && avgDuration < 45 ? 0.9 : 1
    const base = log1p(impressions) * 120 + clicks * 8 + log1p(sessions) * 90
    const score = base * (1 + revenueBoost) * engagementPenalty + engagementRate * 10

    return { post, score }
  })
  finalScored.sort((a, b) => b.score - a.score)

  const picked = finalScored.slice(0, limit).map((x) => x.post)
  if (picked.length === 0) return null

  return (
    <section className="mb-20">
      <div className="flex items-end justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">人気記事</h2>
          <p className="mt-1 text-sm text-gray-600">
            GSC/GA4の動きから、読まれやすい記事を中心にピックアップしています。
          </p>
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
            <Link key={post._id} href={href} className="group block h-full">
              <article className="h-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                  {post.mainImage ? (
                    <Image
                      src={urlFor(post.mainImage).width(900).height(560).url()}
                      alt={title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
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
                  {post.excerpt ? (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">{post.excerpt}</p>
                  ) : null}
                </div>
              </article>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

