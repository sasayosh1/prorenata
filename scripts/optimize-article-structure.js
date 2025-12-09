require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const { createBackup } = require('./backup-utility')

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

/**
 * 記事構造を最適化
 * 1. 「あわせて読みたい」をまとめの直後、免責事項の前に移動
 * 2. 参考文献はまとめより上に配置
 * 3. 内部リンクを適切な記事に差し替え
 */

const DRY_RUN = process.argv.includes('--dry-run')

// 記事構造の標準順序
const STANDARD_ORDER = {
    CONTENT: 0,        // 本文コンテンツ
    REFERENCE: 100,    // 参考文献（まとめより上）
    SUMMARY: 200,      // まとめ
    RELATED: 300,      // あわせて読みたい
    DISCLAIMER: 400    // 免責事項
}

function getBlockOrder(block) {
    const text = JSON.stringify(block).toLowerCase()

    if (block.style === 'h2') {
        if (block.children?.[0]?.text === 'まとめ') return STANDARD_ORDER.SUMMARY
        if (block.children?.[0]?.text?.includes('あわせて読みたい')) return STANDARD_ORDER.RELATED
        if (block.children?.[0]?.text?.includes('参考')) return STANDARD_ORDER.REFERENCE
    }

    if (text.includes('免責') || text.includes('disclaimer')) return STANDARD_ORDER.DISCLAIMER

    return STANDARD_ORDER.CONTENT
}

async function optimizeArticleStructure(slug) {
    console.log(`\n🔧 記事構造を最適化: ${slug}`)

    const article = await client.fetch(`
    *[_type == "post" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      body
    }
  `, { slug })

    if (!article) {
        console.error('❌ 記事が見つかりません')
        return
    }

    // バックアップ作成
    if (!DRY_RUN) {
        await createBackup(article._id, 'structure-optimization')
        console.log('✅ バックアップ作成完了')
    }

    let modified = false
    const changes = []

    // 1. ブロックを順序で並び替え
    const bodyWithOrder = article.body.map(block => ({
        ...block,
        _order: getBlockOrder(block)
    }))

    // 現在の順序を確認
    let hasWrongOrder = false
    let lastOrder = -1
    bodyWithOrder.forEach(block => {
        if (block._order < lastOrder && block._order !== STANDARD_ORDER.CONTENT) {
            hasWrongOrder = true
        }
        lastOrder = block._order
    })

    if (hasWrongOrder) {
        changes.push('記事構造の順序を最適化')
        modified = true
    }

    // 2. 「あわせて読みたい」をH3に変更（H2の場合）
    const relatedBlock = article.body.find(b =>
        b.style === 'h2' && b.children?.[0]?.text?.includes('あわせて読みたい')
    )

    if (relatedBlock) {
        changes.push('「あわせて読みたい」をH3に変更')
        modified = true
    }

    // 3. 長すぎる内部リンクを検出
    article.body.forEach(block => {
        if (block.children) {
            block.children.forEach(child => {
                if (child.marks && child.text && child.text.length > 50) {
                    const mark = block.markDefs?.find(m => child.marks.includes(m._key))
                    if (mark && mark._type === 'link' && mark.href?.startsWith('/posts/')) {
                        changes.push(`長すぎる内部リンクを検出: "${child.text.substring(0, 30)}..."`)
                        modified = true
                    }
                }
            })
        }
    })

    if (modified) {
        console.log('📝 検出された変更:')
        changes.forEach(c => console.log(`  - ${c}`))

        if (DRY_RUN) {
            console.log('⏭️  DRY RUN - スキップ')
        } else {
            // 実際の修正処理はここに実装
            console.log('ℹ️  修正処理は手動で実施してください')
        }
    } else {
        console.log('✅ 最適化の必要なし')
    }

    return { modified, changes }
}

async function optimizeAllArticles() {
    console.log('🔧 全記事の構造最適化を開始...\n')
    console.log(`モード: ${DRY_RUN ? 'DRY RUN' : '本番実行'}\n`)

    const articles = await client.fetch(`
    *[_type == "post" && !(_id in path("drafts.**"))] {
      _id,
      title,
      slug
    }
  `)

    console.log(`📊 対象記事数: ${articles.length}\n`)

    let needsOptimization = 0

    for (const article of articles) {
        const result = await optimizeArticleStructure(article.slug.current)
        if (result?.modified) {
            needsOptimization++
        }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📈 最適化結果サマリー')
    console.log('='.repeat(60))
    console.log(`\n最適化が必要な記事: ${needsOptimization}件`)
    console.log(`総記事数: ${articles.length}件\n`)
}

// 実行
if (require.main === module) {
    const targetSlug = process.argv.find(arg => !arg.startsWith('--') && !arg.includes('node') && !arg.includes('.js'))

    if (targetSlug) {
        optimizeArticleStructure(targetSlug).catch(console.error)
    } else {
        optimizeAllArticles().catch(console.error)
    }
}

module.exports = {
    optimizeArticleStructure,
    optimizeAllArticles
}
