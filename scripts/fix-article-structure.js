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
 * 記事構造を修正
 */

async function fixArticleStructure(slug) {
    console.log(`\n🔧 記事構造を修正: ${slug}\n`)

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

    console.log(`📄 記事: ${article.title}`)

    // バックアップ作成
    await createBackup(article._id, 'structure-fix')
    console.log('✅ バックアップ作成完了\n')

    let modified = false
    const changes = []

    // 新しいbodyを構築
    let newBody = [...article.body]

    // 1. 長すぎる内部リンクを差し替え
    newBody = newBody.map(block => {
        if (block.children && block.markDefs) {
            let blockModified = false

            const newChildren = block.children.map(child => {
                if (child.marks && child.text && child.text.length > 50) {
                    const mark = block.markDefs.find(m => child.marks.includes(m._key))
                    if (mark && mark._type === 'link' && mark.href?.includes('nursing-assistant-patient-safety-key')) {
                        changes.push(`内部リンクを差し替え: "${child.text.substring(0, 30)}..." → "看護助手の1日スケジュールを徹底紹介"`)
                        blockModified = true
                        modified = true
                        return {
                            ...child,
                            text: '看護助手の1日スケジュールを徹底紹介'
                        }
                    }
                }
                return child
            })

            if (blockModified) {
                const newMarkDefs = block.markDefs.map(md => {
                    if (md.href?.includes('nursing-assistant-patient-safety-key')) {
                        return {
                            ...md,
                            href: '/posts/nursing-assistant-detailed-daily-schedule'
                        }
                    }
                    return md
                })

                return {
                    ...block,
                    children: newChildren,
                    markDefs: newMarkDefs
                }
            }
        }
        return block
    })

    // 2. 「あわせて読みたい」をH3に変更し、まとめの後に移動
    const relatedIndex = newBody.findIndex(b =>
        (b.style === 'h2' || b.style === 'h3') &&
        b.children?.[0]?.text?.includes('あわせて読みたい')
    )

    const summaryIndex = newBody.findIndex(b =>
        b.style === 'h2' &&
        b.children?.[0]?.text === 'まとめ'
    )

    if (relatedIndex !== -1 && summaryIndex !== -1) {
        // 「あわせて読みたい」ブロックとその後続ブロックを取得
        const relatedBlock = newBody[relatedIndex]

        // H2 → H3に変更
        if (relatedBlock.style === 'h2') {
            changes.push('「あわせて読みたい」をH2からH3に変更')
            modified = true
            relatedBlock.style = 'h3'
        }

        // まとめの後に移動（現在の位置がまとめより前の場合）
        if (relatedIndex < summaryIndex) {
            changes.push('「あわせて読みたい」をまとめの後に移動')
            modified = true

            // 関連記事セクションを抽出（見出しとその後の内容）
            let relatedSectionEnd = relatedIndex + 1
            while (relatedSectionEnd < newBody.length &&
                newBody[relatedSectionEnd].style !== 'h2' &&
                newBody[relatedSectionEnd].style !== 'h3') {
                relatedSectionEnd++
            }

            const relatedSection = newBody.splice(relatedIndex, relatedSectionEnd - relatedIndex)

            // まとめセクションの終わりを見つける
            let summaryEnd = summaryIndex
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

    if (modified) {
        console.log('📝 実施する変更:')
        changes.forEach(c => console.log(`  ✓ ${c}`))
        console.log()

        // Sanityを更新
        await client
            .patch(article._id)
            .set({ body: newBody })
            .commit()

        console.log('✅ 更新完了\n')
        console.log('='.repeat(60))
        console.log('✅ 記事構造を最適化しました')
        console.log('='.repeat(60))
    } else {
        console.log('ℹ️  修正の必要なし')
    }

    return { modified, changes }
}

// 実行
if (require.main === module) {
    const slug = process.argv[2] || 'nursing-assistant-patient-transfer-safety'
    fixArticleStructure(slug).catch(console.error)
}

module.exports = {
    fixArticleStructure
}
