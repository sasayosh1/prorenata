/**
 * Sanity記事タグの整理ツール
 *
 * 目的:
 * - ほぼ全記事に付いてしまっている汎用タグ（例: 看護助手/看護）を抑制
 * - 同義語・表記ゆれ（給与/給料、メンタル/メンタルケア など）を統合
 * - 「・」等の複合タグを分解して、サイト側のタグカタログに寄せる
 *
 * 使い方:
 *   node scripts/cleanup-tags.cjs --dry-run
 *   node scripts/cleanup-tags.cjs --apply
 *
 * 環境変数:
 *   SANITY_API_TOKEN が必要
 */

const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env.private' })
const { createClient } = require('@sanity/client')

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01'

const token = process.env.SANITY_API_TOKEN || process.env.SANITY_WRITE_TOKEN
if (!token) {
  console.error('SANITY_API_TOKEN (or SANITY_WRITE_TOKEN) is required')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
})

const PUBLIC_POST_FILTER = '(!defined(internalOnly) || internalOnly == false)'

function parseArgs(argv) {
  const args = new Set(argv.slice(2))
  const getValue = (name, fallback) => {
    const idx = argv.indexOf(name)
    if (idx === -1) return fallback
    const value = argv[idx + 1]
    return value ?? fallback
  }

  const apply = args.has('--apply')
  const dryRun = args.has('--dry-run') || !apply
  const limit = Number(getValue('--limit', '0')) || 0
  const offset = Number(getValue('--offset', '0')) || 0
  const maxTags = Number(getValue('--max-tags', '10')) || 10

  return { apply, dryRun, limit, offset, maxTags }
}

function normalizeTag(value) {
  return String(value ?? '')
    .trim()
    .replace(/^#/, '')
    .replace(/[　]+/g, ' ')
    .replace(/\s+/g, ' ')
}

function loadCatalogTitles() {
  const filePath = path.join(process.cwd(), 'src/data/tagCatalog.ts')
  const source = fs.readFileSync(filePath, 'utf8')
  const start = source.indexOf('export const TAG_CATALOG')
  const end = source.indexOf('function normalizeTagInput')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Failed to locate TAG_CATALOG section in src/data/tagCatalog.ts')
  }

  const chunk = source.slice(start, end)
  const titles = new Set()
  const re = /title:\s*'([^']+)'/g
  let match
  while ((match = re.exec(chunk))) {
    const title = match[1]?.trim()
    if (title) titles.add(title)
  }
  return titles
}

function buildCanonicalizer(catalogTitles) {
  const canonical = (title) => (catalogTitles.has(title) ? title : null)

  const synonymToCanonical = new Map([
    ['給料', '給与・待遇'],
    ['給与', '給与・待遇'],
    ['年収', '給与・待遇'],
    ['月給', '給与・待遇'],
    ['時給', '給与・待遇'],
    ['賞与', '給与・待遇'],
    ['ボーナス', '給与・待遇'],
    ['待遇', '給与・待遇'],

    ['手当', '手当・福利厚生'],
    ['福利厚生', '手当・福利厚生'],

    ['副業', '副業・働き方'],
    ['ダブルワーク', '副業・働き方'],
    ['兼業', '副業・働き方'],
    ['働き方', '副業・働き方'],

    ['転職', '転職準備'],
    ['求人', '転職準備'],
    ['就職', '転職準備'],
    ['応募', '転職準備'],
    ['履歴書', '転職準備'],
    ['職務経歴書', '転職準備'],
    ['就職・転職活動', '転職準備'],

    ['面接', '面接・志望動機'],
    ['志望動機', '面接・志望動機'],
    ['自己PR', '面接・志望動機'],

    ['看護師', '看護師への道'],
    ['正看', '看護師への道'],
    ['准看', '看護師への道'],
    ['進学', '看護師への道'],

    ['メンタル', 'メンタルケア'],
    ['ストレス', 'メンタルケア'],

    ['コミュニケーション', '人間関係'],
    ['チーム', '人間関係'],
    ['先輩', '人間関係'],
    ['上司', '人間関係'],

    ['夜勤', '休息・シフト管理'],
    ['シフト', '休息・シフト管理'],
    ['睡眠', '休息・シフト管理'],
    ['休息', '休息・シフト管理'],
    ['体調管理', '休息・シフト管理'],

    ['悩み', '悩み'],
    ['相談', '悩み'],
    ['不安', '悩み'],
    ['モヤモヤ', '悩み'],
    ['悩み・相談', '悩み'],

    ['勉強法', '勉強法・研修'],
    ['研修', '勉強法・研修'],
    ['講座', '勉強法・研修'],
    ['学び直し', '勉強法・研修'],

    ['資格', '資格取得'],
    ['資格取得', '資格取得'],
    ['初任者研修', '資格取得'],
    ['実務者研修', '資格取得'],
    ['試験', '資格取得'],

    ['退職', '退職手続き'],
    ['退職届', '退職手続き'],

    ['有給', '有給消化'],
    ['休暇', '有給消化'],
    ['申請', '有給消化'],

    ['体験談', '体験談'],
    ['エピソード', '体験談'],

    ['新人', '新人の気づき'],

    ['基礎知識', '基礎知識'],
    ['入門', '基礎知識'],
    ['基本', '基礎知識'],
    ['仕事内容', '基礎知識'],
    ['基礎知識・入門', '基礎知識'],
    ['仕事内容・役割', '基礎知識'],

    ['感染対策', '感染対策'],
    ['清潔', '感染対策'],
    ['消毒', '感染対策'],
    ['感染', '感染対策'],
    ['衛生', '感染対策'],

    ['患者対応', '患者対応'],
    ['声かけ', '患者対応'],
    ['傾聴', '患者対応'],
    ['案内', '患者対応'],
    ['接遇', '患者対応'],

    ['業務効率', '業務効率'],
    ['効率', '業務効率'],
    ['段取り', '業務効率'],
    ['準備', '業務効率'],
    ['物品', '業務効率'],
    ['チェックリスト', '業務効率'],
    ['実務', '業務効率'],
    ['ノウハウ', '業務効率'],
    ['実務・ノウハウ', '業務効率'],
  ])

  const hardDrop = new Set([
    '看護', // 汎用すぎる
    '医療', // 汎用すぎる
    '患者', // 汎用すぎる
    '病院', // 汎用すぎる
    '介護', // 汎用すぎる
    'サポート', // 汎用すぎる
    '業務', // 汎用すぎる
    '仕事', // 汎用すぎる
    '経験', // 抽象
    '取得', // 抽象
    '技術', // 抽象
    'スキル', // 抽象
    'キャリア', // 抽象
    '補助', // 抽象
    'ケア', // 抽象（用途が広すぎる）
    '勤務', // 抽象
    '必要', // 抽象
    '理由', // 抽象
    '具体的', // 抽象
  ])

  function mapOne(raw) {
    const normalized = normalizeTag(raw)
    if (!normalized) return []

    // まずタグカタログのタイトルに一致するものはそのまま
    const direct = canonical(normalized)
    if (direct) return [direct]

    const pieces = normalized
      .split(/[・/]/)
      .map(part => part.trim())
      .filter(Boolean)

    const candidates = [normalized, ...pieces]
    const mapped = []

    for (const candidate of candidates) {
      const c = normalizeTag(candidate)
      if (!c) continue
      if (hardDrop.has(c)) continue

      const directCandidate = canonical(c)
      if (directCandidate) {
        mapped.push(directCandidate)
        continue
      }

      const to = synonymToCanonical.get(c)
      if (to && canonical(to)) {
        mapped.push(to)
      }
    }

    return mapped
  }

  return { mapOne, hardDrop }
}

function dedupeStable(list) {
  const seen = new Set()
  const out = []
  for (const item of list) {
    if (!item) continue
    if (seen.has(item)) continue
    seen.add(item)
    out.push(item)
  }
  return out
}

function computeTagFreq(posts) {
  const freq = new Map()
  for (const p of posts) {
    for (const t of p.tags || []) {
      const n = normalizeTag(t)
      if (!n) continue
      freq.set(n, (freq.get(n) || 0) + 1)
    }
  }
  return freq
}

async function main() {
  const { apply, dryRun, limit, offset, maxTags } = parseArgs(process.argv)
  const catalogTitles = loadCatalogTitles()
  const { mapOne } = buildCanonicalizer(catalogTitles)

  const range = limit > 0 ? `[${offset}...${offset + limit}]` : ''
  const posts = await client.fetch(
    `*[_type==\"post\" && ${PUBLIC_POST_FILTER}] | order(_updatedAt desc) ${range} { _id, title, tags }`
  )

  const total = posts.length
  const beforeFreq = computeTagFreq(posts)

  const changes = []
  const afterFreq = new Map()

  for (const post of posts) {
    const before = Array.isArray(post.tags) ? post.tags.map(normalizeTag).filter(Boolean) : []
    const mapped = []

    for (const raw of before) {
      mapped.push(...mapOne(raw))
    }

    // 「看護助手」は全体に付与されがちなので、最終的に他タグが十分あるなら落とす
    let next = dedupeStable(mapped)
    if (next.includes('看護助手') && next.length > 2) {
      next = next.filter(t => t !== '看護助手')
    }

    // タグが空になった場合は、事故防止として最低限「看護助手」だけ付与する（カタログ準拠）
    if (next.length === 0) {
      next = catalogTitles.has('看護助手') ? ['看護助手'] : []
    }

    next = next.slice(0, maxTags)

    for (const t of next) {
      afterFreq.set(t, (afterFreq.get(t) || 0) + 1)
    }

    const beforeKey = JSON.stringify(dedupeStable(before))
    const afterKey = JSON.stringify(dedupeStable(next))
    if (beforeKey !== afterKey) {
      changes.push({
        _id: post._id,
        title: post.title,
        before: dedupeStable(before),
        after: dedupeStable(next),
      })
    }
  }

  const top = (freq) =>
    [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([tag, count]) => ({ tag, count }))

  console.log(`posts=${total}`)
  console.log(`changed=${changes.length}`)
  console.log(`uniqueTags(before)=${beforeFreq.size} uniqueTags(after)=${afterFreq.size}`)
  console.log('top(before):', top(beforeFreq))
  console.log('top(after):', top(afterFreq))

  const report = {
    generatedAt: new Date().toISOString(),
    projectId,
    dataset,
    total,
    changed: changes.length,
    sampleChanges: changes.slice(0, 20),
  }

  const reportPath = path.join(process.cwd(), '.analytics', 'tag-cleanup-report.json')
  fs.mkdirSync(path.dirname(reportPath), { recursive: true })
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`report: ${reportPath}`)

  if (dryRun) {
    console.log('DRY RUN: no changes applied')
    return
  }

  if (!apply) {
    console.error('Refusing to apply without --apply (use --dry-run to preview)')
    process.exit(1)
  }

  // backup
  const backupPath = path.join(
    process.cwd(),
    '.analytics',
    `tag-cleanup-backup-${new Date().toISOString().slice(0, 10)}.json`
  )
  fs.writeFileSync(backupPath, JSON.stringify(changes, null, 2))
  console.log(`backup: ${backupPath}`)

  let updated = 0
  for (const change of changes) {
    await client.patch(change._id).set({ tags: change.after }).commit({ autoGenerateArrayKeys: true })
    updated += 1
    if (updated % 10 === 0) {
      console.log(`applied ${updated}/${changes.length}`)
    }
    await new Promise((r) => setTimeout(r, 200))
  }

  console.log(`DONE: applied ${updated} updates`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
