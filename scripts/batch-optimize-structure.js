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
 * 全記事の構造を最適化
 */

const DRY_RUN = process.argv.includes('--dry-run')

async function optimizeAllArticles() {
    console.log('🔧 全記事の構造最適化を開始...\n')
    console.log(`モード: ${DRY_RUN ? 'DRY RUN' : '本番実行'}\n`)

    const articles = await client.fetch(`
    *[_type == "post" && !(_id in path("drafts.**"))] {
      _id,
      title,
      slug,
      body
    }
  `)

    console.log(`📊 対象記事数: ${articles.length}\n`)

    let optimizedCount = 0
    let errorCount = 0
            const changes = []

    for (const article of articles) {
        try {
            let modified = false
            const articleChanges = []
            const textOf = block => (block.children || []).map(c => c.text || '').join('')

            // リードで「この記事では」を改行して2段落に分ける
            const firstNormalIndex = workingBody.findIndex(b => b.style === 'normal')
            if (firstNormalIndex !== -1 && firstNormalIndex < (workingBody.findIndex(b => b.style === 'h2') || Infinity)) {
                const block = workingBody[firstNormalIndex]
                const original = textOf(block)
                const replaced = original.replace(/(。?)(この記事では)/, '$1\n$2')
                if (replaced !== original) {
                    const parts = replaced.split('\n')
                    const newChildren = []
                    for (let i = 0; i < parts.length; i++) {
                        if (i > 0) newChildren.push({ _type: 'span', text: '\n', marks: [] })
                        newChildren.push({ _type: 'span', text: parts[i], marks: [] })
                    }
                    workingBody[firstNormalIndex] = {
                        ...block,
                        children: newChildren,
                    }
                    modified = true
                    articleChanges.push('リードで「この記事では」を改行')
                }
            }

            // 0. 参考リンクをセクション末尾へ移動（リードやH2直下に置かない）
            let workingBody = [...article.body]
            const isRef = b => b.style === 'normal' && /参考[:：]/.test(textOf(b))

            const headingIdx = workingBody
                .map((b, i) => ({ b, i }))
                .filter(x => ['h1', 'h2', 'h3', 'h4'].includes(x.b.style))
                .map(x => x.i)
            headingIdx.push(workingBody.length) // sentinel for last section

            // リード直後の参考リンクをリード末尾に移動
            const firstH2Index = workingBody.findIndex(b => b.style === 'h2')
            if (firstH2Index !== -1) {
                const refsToMove = []
                const cleaned = []
                workingBody.forEach((block, idx) => {
                    const prevIsHeading = idx > 0 && ['h1', 'h2', 'h3', 'h4'].includes(workingBody[idx - 1].style)
                    const beforeFirstH2 = idx < firstH2Index
                    if (isRef(block) && (beforeFirstH2 || prevIsHeading)) {
                        refsToMove.push({
                            _type: 'block',
                            style: 'normal',
                            children: block.children || [],
                            markDefs: block.markDefs || [],
                        })
                        modified = true
                        articleChanges.push('リード直後の参考リンクを移動')
                    } else {
                        cleaned.push(block)
                    }
                })
                workingBody = cleaned
                if (refsToMove.length > 0) {
                    workingBody.splice(firstH2Index, 0, ...refsToMove)
                }
            }

            // セクション内にある参考リンクの位置を、そのセクションの末尾に再配置
            const sectionRefsMoved = []
            const headingsForSections = workingBody
                .map((b, i) => ({ b, i }))
                .filter(x => ['h1', 'h2', 'h3', 'h4'].includes(x.b.style))
                .map(x => x.i)
            if (headingsForSections.length === 0) {
                // 見出しがない場合は全体を1セクションとして扱う
                headingsForSections.push(0)
            }
            headingsForSections.push(workingBody.length)

            for (let h = 0; h < headingsForSections.length - 1; h++) {
                const start = headingsForSections[h]
                const end = headingsForSections[h + 1]
                const section = workingBody.slice(start, end)
                const refs = section.filter(isRef)
                if (refs.length === 0) continue

                const sectionWithoutRefs = section.filter(b => !isRef(b))
                const newSection = [...sectionWithoutRefs, ...refs]
                workingBody.splice(start, end - start, ...newSection)
                sectionRefsMoved.push(refs.length)
            }
            if (sectionRefsMoved.length > 0) {
                modified = true
                articleChanges.push(`参考リンクをセクション末尾に再配置 (${sectionRefsMoved.reduce((a, b) => a + b, 0)}件)`)
            }

            // 1. 「あわせて読みたい」をH3に変更し、まとめの後に移動
            const relatedIndex = workingBody.findIndex(b =>
                (b.style === 'h2' || b.style === 'h3') &&
                b.children?.[0]?.text?.includes('あわせて読みたい')
            )

            const summaryIndex = workingBody.findIndex(b =>
                b.style === 'h2' &&
                b.children?.[0]?.text === 'まとめ'
            )

            let newBody = [...workingBody]

            if (relatedIndex !== -1) {
                const relatedBlock = newBody[relatedIndex]

                // H2 → H3に変更
                if (relatedBlock.style === 'h2') {
                    articleChanges.push('H2→H3')
                    modified = true
                    relatedBlock.style = 'h3'
                }

                // まとめの後に移動
                if (summaryIndex !== -1 && relatedIndex < summaryIndex) {
                    articleChanges.push('まとめ後に移動')
                    modified = true

                    // 関連記事セクションを抽出
                    let relatedSectionEnd = relatedIndex + 1
                    while (relatedSectionEnd < newBody.length &&
                        newBody[relatedSectionEnd].style !== 'h2' &&
                        newBody[relatedSectionEnd].style !== 'h3') {
                        relatedSectionEnd++
                    }

                    const relatedSection = newBody.splice(relatedIndex, relatedSectionEnd - relatedIndex)

                    // まとめセクションの終わりを見つける
                    const newSummaryIndex = newBody.findIndex(b =>
                        b.style === 'h2' && b.children?.[0]?.text === 'まとめ'
                    )

                    let summaryEnd = newSummaryIndex + 1
                    while (summaryEnd < newBody.length &&
                        newBody[summaryEnd].style !== 'h2' &&
                        newBody[summaryEnd].style !== 'h3' &&
                        !JSON.stringify(newBody[summaryEnd]).includes('免責')) {
                        summaryEnd++
                    }

                    // まとめの後に挿入
                    newBody.splice(summaryEnd, 0, ...relatedSection)
                }
            }

            // 参考リンクをまとめ後に集約
            if (refBlocks.length > 0) {
                const summaryIdxNew = newBody.findIndex(b =>
                    (b.style === 'h1' || b.style === 'h2' || b.style === 'h3') &&
                    b.children?.[0]?.text === 'まとめ'
                )

                let insertPos = newBody.length
                if (summaryIdxNew !== -1) {
                    insertPos = summaryIdxNew + 1
                    while (
                        insertPos < newBody.length &&
                        !['h1', 'h2', 'h3', 'h4'].includes(newBody[insertPos].style)
                    ) {
                        insertPos++
                    }
                }

                newBody.splice(insertPos, 0, ...refBlocks)
                modified = true
                articleChanges.push(`参考リンク集約 (${refBlocks.length}件)`)
            }

            // 2. 長すぎる内部リンクを検出
            newBody.forEach(block => {
                if (block.children && block.markDefs) {
                    block.children.forEach(child => {
                        if (child.marks && child.text && child.text.length > 50) {
                            const mark = block.markDefs.find(m => child.marks.includes(m._key))
                            if (mark && mark._type === 'link' && mark.href?.startsWith('/posts/')) {
                                articleChanges.push(`長いリンク: "${child.text.substring(0, 30)}..."`)
                            }
                        }
                    })
                }
            })

            if (modified) {
                console.log(`✏️  ${article.title}`)
                console.log(`   Slug: ${article.slug.current}`)
                articleChanges.forEach(c => console.log(`   - ${c}`))

                if (!DRY_RUN) {
                    // バックアップ作成
                    await createBackup(article._id, 'batch-structure-optimization')

                    // 更新実行
                    await client
                        .patch(article._id)
                        .set({ body: newBody })
                        .commit()

                    console.log('   ✅ 更新完了')
                } else {
                    console.log('   ⏭️  DRY RUN - スキップ')
                }

                optimizedCount++
                changes.push({
                    title: article.title,
                    slug: article.slug.current,
                    changes: articleChanges
                })
                console.log()
            }
        } catch (error) {
            console.error(`❌ エラー: ${article.title}`)
            console.error(`   ${error.message}`)
            console.log()
            errorCount++
        }
    }

    console.log('='.repeat(60))
    console.log('📈 最適化結果サマリー')
    console.log('='.repeat(60))
    console.log()
    console.log(`✅ 最適化した記事: ${optimizedCount}件`)
    console.log(`❌ エラー: ${errorCount}件`)
    console.log(`📊 総記事数: ${articles.length}件`)
    console.log()

    if (DRY_RUN) {
        console.log('💡 本番実行するには --dry-run フラグを外してください')
    } else {
        console.log('✅ 最適化完了')
        console.log('📄 バックアップは backups/ ディレクトリに保存されています')
    }

    return { optimizedCount, errorCount, changes }
}

// 実行
if (require.main === module) {
    optimizeAllArticles().catch(console.error)
}

module.exports = {
    optimizeAllArticles
}
