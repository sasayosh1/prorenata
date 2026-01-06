import fs from 'fs'
import path from 'path'

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
            const h = header[i].trim()
            rec[h] = r[i] ?? ''
        }
        records.push(rec)
    }
    return records
}

function loadCsv(relativePath: string) {
    const filePath = path.join(process.cwd(), relativePath)
    console.log(`Checking file: ${filePath}`)
    if (!fs.existsSync(filePath)) {
        console.log(`File NOT found: ${filePath}`)
        return null
    }
    const content = fs.readFileSync(filePath, 'utf8')
    console.log(`File size: ${content.length} bytes`)
    const records = parseCsv(content)
    console.log(`Found ${records.length} records`)
    if (records.length > 0) {
        console.log('Sample record:', records[0])
    }
    return records
}

function slugFromPostPath(pathname: string): string | null {
    if (!pathname.startsWith('/posts/')) return null
    const parts = pathname.split('/').filter(Boolean)
    return parts[1] || null
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

const gsc = loadCsv('data/gsc_last30d.csv')
const ga4 = loadCsv('data/ga4_last30d.csv')

if (gsc) {
    const slugs = new Set()
    gsc.forEach(row => {
        const path = toPathFromUrl(row.page)
        if (path) {
            const slug = slugFromPostPath(path)
            if (slug) slugs.add(slug)
        }
    })
    console.log(`GSC unique article slugs: ${slugs.size}`)
}

if (ga4) {
    const slugs = new Set()
    ga4.forEach(row => {
        const slug = slugFromPostPath(row.pagePath || '')
        if (slug) slugs.add(slug)
    })
    console.log(`GA4 unique article slugs: ${slugs.size}`)
}
