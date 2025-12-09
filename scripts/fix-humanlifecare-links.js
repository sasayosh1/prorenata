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
 * ヒューマンライフケアのリンクをレントラックスに修正
 */

// レントラックスの正しいコード
const RENTRACKS_CODE = '<img src="https://www.rentracks.jp/adx/p.gifx?idx=0.71551.371865.8943.12704&dna=148900" border="0" height="1" width="1"><a href="https://www.rentracks.jp/adx/r.html?idx=0.71551.371865.8943.12704&dna=148900" rel="nofollow noopener" target="_blank">ヒューマンライフケア</a>'

// 置換対象のパターン
const PATTERNS_TO_REPLACE = [
    // Moshimoのヒューマンライフケアリンク
    {
        pattern: /\/\/af\.moshimo\.com\/af\/c\/click\?a_id=5207863&p_id=6140&pc_id=17239&pl_id=78717/g,
        description: 'Moshimo ヒューマンライフケアリンク'
    },
    // バリューコマースのリンク（もしあれば）
    {
        pattern: /\/\/ck\.jp\.ap\.valuecommerce\.com\/servlet\/referral\?[^"]*human-lifecare/gi,
        description: 'バリューコマース ヒューマンライフケアリンク'
    }
]

const DRY_RUN = process.argv.includes('--dry-run')
const FORCE = process.argv.includes('--force')

async function fixHumanLifecareLinks() {
    console.log('🔧 ヒューマンライフケアリンク修正を開始...\n')
    console.log(`モード: ${DRY_RUN ? 'DRY RUN（実際には更新しません）' : '本番実行'}`)
    console.log()

    // 全記事を取得
    const articles = await client.fetch(`
    *[_type == "post" && !(_id in path("drafts.**"))] {
      _id,
      title,
      slug,
      body
    }
  `)

    console.log(`📊 対象記事数: ${articles.length}\n`)

    let updatedCount = 0
    let errorCount = 0

    for (const article of articles) {
        try {
            let modified = false
            let changes = []

            if (!article.body || !Array.isArray(article.body)) {
                continue
            }

            // bodyの各ブロックをチェック
            const newBody = article.body.map(block => {
                // markDefsをチェック（リンク）
                if (block.markDefs && Array.isArray(block.markDefs)) {
                    const newMarkDefs = block.markDefs.map(markDef => {
                        if (markDef._type === 'link' && markDef.href) {
                            // Moshimoリンクをチェック
                            for (const { pattern, description } of PATTERNS_TO_REPLACE) {
                                if (pattern.test(markDef.href)) {
                                    changes.push(`  - ${description} を検出`)
                                    modified = true
                                    return {
                                        ...markDef,
                                        href: 'https://www.rentracks.jp/adx/r.html?idx=0.71551.371865.8943.12704&dna=148900'
                                    }
                                }
                            }

                            // バリューコマースの壊れたHTMLリンクをチェック
                            if (markDef.href.includes('ck.jp.ap.valuecommerce.com') &&
                                markDef.href.includes('892314166')) {
                                changes.push(`  - バリューコマース 壊れたヒューマンライフケアリンク を検出`)
                                modified = true
                                return {
                                    ...markDef,
                                    href: 'https://www.rentracks.jp/adx/r.html?idx=0.71551.371865.8943.12704&dna=148900'
                                }
                            }
                        }
                        return markDef
                    })

                    if (JSON.stringify(newMarkDefs) !== JSON.stringify(block.markDefs)) {
                        return { ...block, markDefs: newMarkDefs }
                    }
                }

                // htmlブロックをチェック (affiliateLink と affiliateEmbed の両方)
                if ((block._type === 'affiliateLink' || block._type === 'affiliateEmbed') && block.html) {
                    let newHtml = block.html

                    // Moshimoリンクを置換
                    if (newHtml.includes('af.moshimo.com/af/c/click?a_id=5207863')) {
                        changes.push('  - Moshimo HTMLブロック (ヒューマンライフケア) を検出')
                        modified = true

                        // HTMLブロック全体を置換
                        newHtml = `<div style="background: linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%); border: 1px solid #b3d9ff; border-radius: 8px; padding: 16px; margin: 16px 0;">
  <p style="margin: 0 0 12px 0; color: #1a1a1a; line-height: 1.6;">「まとめ」で感じた課題を整理するときはヒューマンライフケアに相談して条件やサポート体制を具体化してみてください。</p>
  <p style="margin: 0;">
    [PR]
    ${RENTRACKS_CODE}
  </p>
</div>`
                    }

                    if (newHtml !== block.html) {
                        return {
                            ...block,
                            html: newHtml,
                            provider: 'ヒューマンライフケア',
                            label: 'ヒューマンライフケア',
                            linkKey: 'humanlifecare'
                        }
                    }
                }
                return block
            })

            if (modified) {
                console.log(`✏️  ${article.title}`)
                console.log(`   Slug: ${article.slug?.current}`)
                changes.forEach(change => console.log(change))

                if (!DRY_RUN) {
                    // バックアップ作成
                    await createBackup(article._id, 'humanlifecare-link-fix')

                    // 更新実行
                    await client
                        .patch(article._id)
                        .set({ body: newBody })
                        .commit()

                    console.log('   ✅ 更新完了')
                } else {
                    console.log('   ⏭️  DRY RUN - スキップ')
                }

                updatedCount++
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
    console.log(`✅ 修正した記事: ${updatedCount}件`)
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
    fixHumanLifecareLinks().catch(console.error)
}

module.exports = {
    fixHumanLifecareLinks
}
