/**
 * Replace old retirement affiliate names/phrases with current three services:
 * - 弁護士法人みやび
 * - 退職代行 即ヤメ
 * - 弁護士法人ガイア法律事務所
 *
 * Usage: SANITY_API_TOKEN=xxx node scripts/update-retirement-affiliates.js
 */

const { createClient } = require('next-sanity')

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01'
const token = process.env.SANITY_API_TOKEN

if (!token) {
  console.error('Error: SANITY_API_TOKEN is not set.')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token,
})

const replacements = [
  // サービス名
  { from: '弁護士法人あおば（退職110番）', to: '弁護士法人みやび' },
  { from: '弁護士法人あおば', to: '弁護士法人みやび' },
  { from: '退職110番', to: '弁護士法人みやび' },
  { from: '退職代行モームリ', to: '退職代行 即ヤメ' },
  { from: 'モームリ', to: '即ヤメ' },
  { from: 'セルフ退職ムリサポ', to: '弁護士法人ガイア法律事務所' },
  { from: 'ムリサポ', to: '弁護士法人ガイア法律事務所' },
  // 見出し
  { from: '第２位：退職代行モームリ', to: '第２位：退職代行 即ヤメ' },
  { from: '第３位：セルフ退職ムリサポ', to: '第３位：弁護士法人ガイア法律事務所' },
  // 料金・特徴（ざっくり置換）
  { from: '料金：13,000円（税込）', to: '料金：16,500円（税込）' },
  { from: '料金：相談無料（詳細は公式サイトへ）', to: '料金：15,000円（税込）' },
  { from: '形式：セルフ退職支援・テンプレート提供', to: '形式：民間退職代行・LINEで完結' },
  { from: '形式：セルフ退職支援', to: '形式：民間退職代行・LINEで完結' },
  { from: '特徴：法律相談付き・自分で手続き・コスパ重視', to: '特徴：即日OK・夜間相談可・LINE相談' },
  { from: '料金：相談無料', to: '料金：14,000円（税込）' },
  { from: '形式：セルフ退職支援・テンプレート提供', to: '形式：弁護士監修の退職代行' },
  { from: '形式：セルフ退職支援・テンプレート提供', to: '形式：弁護士監修の退職代行' },
]

function replaceText(text) {
  let out = text
  for (const { from, to } of replacements) {
    if (out.includes(from)) {
      out = out.split(from).join(to)
    }
  }
  return out
}

function updateBody(body = []) {
  let changed = false
  const newBody = body.map(block => {
    if (block && block._type === 'block' && Array.isArray(block.children)) {
      const newChildren = block.children.map(child => {
        if (child && typeof child.text === 'string') {
          const newText = replaceText(child.text)
          if (newText !== child.text) {
            changed = true
            return { ...child, text: newText }
          }
        }
        return child
      })
      return { ...block, children: newChildren }
    }
    return block
  })
  return { newBody, changed }
}

async function main() {
  const posts = await client.fetch(
    `*[_type == "post"]{_id, "slug": slug.current, body}`
  )
  let updated = 0

  for (const doc of posts) {
    const { newBody, changed } = updateBody(doc.body || [])
    if (!changed) continue

    await client
      .patch(doc._id)
      .set({ body: newBody })
      .commit({ autoGenerateArrayKeys: false })

    updated++
    console.log(`updated: ${doc.slug || doc._id}`)
  }

  console.log(`✅ Completed. Updated ${updated} posts.`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
