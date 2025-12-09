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

const DRY_RUN = process.argv.includes('--dry-run')

/**
 * 全記事のまとめセクションと関連記事リンクを修正
 */

async function fixAllArticles() {
    console.log('🔧 全記事の最終修正を開始...\n')
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

    let fixedCount = 0
    let errorCount = 0

    for (const article of articles) {
        try {
            let modified = false
            let changes = []
            let newBody = [...article.body]

            // 1. 「あわせて読みたい」セクションに実際のリンクがあるかチェック
            const relatedIndex = newBody.findIndex(b =>
                (b.style === 'h2' || b.style === 'h3') &&
                b.children?.[0]?.text?.includes('あわせて読みたい')
            )

            if (relatedIndex !== -1) {
                // 次のセクションまでのブロックを確認
                let hasActualLinks = false
                let emptyTextIndex = -1

                for (let i = relatedIndex + 1; i < newBody.length; i++) {
                    const block = newBody[i]

                    // 次のセクションに到達したら終了
                    if (block.style === 'h2' || block.style === 'h3' ||
                        JSON.stringify(block).includes('免責')) {
                        break
                    }

                    // リンクがあるかチェック
                    if (block.markDefs && block.markDefs.some(md => md._type === 'link')) {
                        hasActualLinks = true
                    }

                    // 「この記事を読んだ方には...」のテキストを検出
                    if (block.children?.[0]?.text?.includes('この記事を読んだ方には') ||
                        block.children?.[0]?.text?.includes('以下の記事もおすすめです')) {
                        emptyTextIndex = i
                    }
                }

                // リンクがない場合、関連記事を追加
                if (!hasActualLinks) {
                    changes.push('関連記事リンクを追加')
                    modified = true

                    // 空のテキストブロックを削除
                    if (emptyTextIndex !== -1) {
                        newBody.splice(emptyTextIndex, 1)
                    }

                    // 関連記事を取得（ランダムに3件）
                    const relatedArticles = await client.fetch(`
            *[_type == "post" && slug.current != $currentSlug && !(_id in path("drafts.**"))] | order(_createdAt desc) [0...3] {
              title,
              "slug": slug.current
            }
          `, { currentSlug: article.slug.current })

                    if (relatedArticles.length > 0) {
                        const linkBlocks = relatedArticles.map((relArticle, index) => ({
                            _key: `related-link-${Date.now()}-${index}`,
                            _type: 'block',
                            children: [
                                {
                                    _key: `span-${Date.now()}-${index}`,
                                    _type: 'span',
                                    marks: [`link-${Date.now()}-${index}`],
                                    text: relArticle.title
                                }
                            ],
                            markDefs: [
                                {
                                    _key: `link-${Date.now()}-${index}`,
                                    _type: 'link',
                                    href: `/posts/${relArticle.slug}`
                                }
                            ],
                            level: 1,
                            listItem: 'bullet',
                            style: 'normal'
                        }))

                        newBody.splice(relatedIndex + 1, 0, ...linkBlocks)
                    }
                }
            }

            if (modified) {
                console.log(`✏️  ${article.title}`)
                console.log(`   Slug: ${article.slug.current}`)
                changes.forEach(c => console.log(`   - ${c}`))

                if (!DRY_RUN) {
                    // バックアップ作成
                    await createBackup(article._id, 'final-article-fixes')

                    // 更新実行
                    await client
                        .patch(article._id)
                        .set({ body: newBody })
                        .commit()

                    console.log('   ✅ 更新完了')
                } else {
                    console.log('   ⏭️  DRY RUN - スキップ')
                }

                fixedCount++
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
    console.log('📈 修正結果サマリー')
    console.log('='.repeat(60))
    console.log()
    console.log(`✅ 修正した記事: ${fixedCount}件`)
    console.log(`❌ エラー: ${errorCount}件`)
    console.log(`📊 総記事数: ${articles.length}件`)
    console.log()

    if (DRY_RUN) {
        console.log('💡 本番実行するには --dry-run フラグを外してください')
    } else {
        console.log('✅ 修正完了')
        console.log('📄 バックアップは backups/ ディレクトリに保存されています')
    }
}

// 実行
if (require.main === module) {
    fixAllArticles().catch(console.error)
}

module.exports = {
    fixAllArticles
}
