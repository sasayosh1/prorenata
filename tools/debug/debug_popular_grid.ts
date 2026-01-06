import fs from 'fs'
import path from 'path'

// Mocking some dependencies or using simple versions
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
            const h = (header[i] || '').trim().replace(/^\uFEFF/, '')
            rec[h] = r[i] ?? ''
        }
        records.push(rec)
    }
    return records
}

function loadCsv(relativePath: string) {
    const filePath = path.join(process.cwd(), relativePath)
    if (!fs.existsSync(filePath)) return null
    const content = fs.readFileSync(filePath, 'utf8')
    if (!content.trim()) return []
    return parseCsv(content)
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

async function debugLogic() {
    console.log('--- START DEBUG LOGIC ---')
    const gsc = loadCsv('data/gsc_last30d.csv')
    const ga4 = loadCsv('data/ga4_last30d.csv')

    console.log(`GSC: ${gsc ? gsc.length : 'NULL'} records`)
    console.log(`GA4: ${ga4 ? ga4.length : 'NULL'} records`)

    if (!gsc || !ga4) {
        console.log('FALLBACK TRIGGERED: gsc or ga4 is null')
        return
    }

    const gscAgg = new Map()
    for (const row of gsc) {
        const pagePath = toPathFromUrl(row.page)
        if (!pagePath) continue
        const slug = slugFromPostPath(pagePath)
        if (!slug) continue

        const impressions = safeNumber(row.impressions)
        if (!gscAgg.has(slug)) gscAgg.set(slug, { impressions: 0 })
        const acc = gscAgg.get(slug)
        acc.impressions += impressions
    }
    console.log(`GSC aggregated slugs: ${gscAgg.size}`)

    const gaAgg = new Map()
    for (const row of ga4) {
        const pagePath = String(row.pagePath || '')
        const slug = slugFromPostPath(pagePath)
        if (!slug) continue

        const sessions = safeNumber(row.sessions)
        if (!gaAgg.has(slug)) gaAgg.set(slug, { sessions: 0 })
        const acc = gaAgg.get(slug)
        acc.sessions += sessions
    }
    console.log(`GA4 aggregated slugs: ${gaAgg.size}`)

    const candidates = new Set()
    const gscTop = [...gscAgg.entries()]
        .sort((a, b) => b[1].impressions - a[1].impressions)
        .slice(0, 250)
        .map(([slug]) => slug)
    const gaTop = [...gaAgg.entries()]
        .sort((a, b) => b[1].sessions - a[1].sessions)
        .slice(0, 250)
        .map(([slug]) => slug)

    for (const s of [...gscTop, ...gaTop]) candidates.add(s)
    console.log(`Total candidates: ${candidates.size}`)

    const scored = [...candidates].map((slug) => {
        const g = gscAgg.get(slug)
        const ga = gaAgg.get(slug)
        const impressions = g?.impressions || 0
        const sessions = ga?.sessions || 0
        const base = log1p(impressions) * 120 + log1p(sessions) * 90
        return { slug, base }
    })
    scored.sort((a, b) => b.base - a.base)

    const topSlugs = scored.slice(0, 9).map(s => s.slug)
    console.log('Top 9 slugs from scoring:')
    console.log(topSlugs)

    // Check if these slugs exist in all-articles.json (as a proxy for Sanity)
    const allArticles = JSON.parse(fs.readFileSync('all-articles.json', 'utf8'))
    const foundArticles = topSlugs.filter(s => allArticles.some((p: any) => p.slug === s))
    console.log(`Found ${foundArticles.length} out of 9 in all-articles.json`)

    if (foundArticles.length === 0) {
        console.log('FALLBACK LIKELY: No matching posts found for top slugs')
    }
}

debugLogic()
