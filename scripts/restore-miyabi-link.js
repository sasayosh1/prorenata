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
 * 弁護士法人みやびのリンクを元のバリューコマースに戻す
 */

// 元の正しいバリューコマースリンク
const CORRECT_MIYABI_LINK = '//ck.jp.ap.valuecommerce.com/servlet/referral?sid=3757192&pid=892314166'

async function restoreMiyabiLink() {
    console.log('🔧 弁護士法人みやびのリンクを元に戻します...\n')

    // 該当記事を取得
    const article = await client.fetch(`
    *[_type == "post" && slug.current == "comparison-of-three-resignation-agencies"][0] {
      _id,
      title,
      slug,
      body
    }
  `)

    if (!article) {
        console.error('❌ 記事が見つかりません')
        return
    }

    console.log(`📄 記事: ${article.title}\n`)

    // バックアップ作成
    await createBackup(article._id, 'miyabi-link-restore')
    console.log('✅ バックアップ作成完了\n')

    let modified = false

    // bodyの各ブロックをチェック
    const newBody = article.body.map(block => {
        // H3見出しの「弁護士法人みやび」リンクを修正
        if (block.style === 'h3' && block.markDefs && Array.isArray(block.markDefs)) {
            const hasMiyabiText = block.children?.some(child => child.text?.includes('弁護士法人みやび'))

            if (hasMiyabiText) {
                const hasWrongLink = block.markDefs.some(markDef =>
                    markDef._type === 'link' &&
                    markDef.href &&
                    (markDef.href.includes('taishoku-service.com') || markDef.href.includes('rentracks.jp'))
                )

                if (hasWrongLink) {
                    console.log('🔍 誤ったリンクを検出: H3見出し「弁護士法人みやび」')
                    modified = true

                    const newMarkDefs = block.markDefs.map(markDef => {
                        if (markDef._type === 'link' && markDef.href) {
                            console.log(`   修正: ${markDef.href}`)
                            console.log(`      → ${CORRECT_MIYABI_LINK}`)
                            return {
                                ...markDef,
                                href: CORRECT_MIYABI_LINK
                            }
                        }
                        return markDef
                    })

                    return { ...block, markDefs: newMarkDefs }
                }
            }
        }

        return block
    })

    if (modified) {
        console.log('\n📝 Sanityを更新中...')

        await client
            .patch(article._id)
            .set({ body: newBody })
            .commit()

        console.log('✅ 更新完了\n')
        console.log('='.repeat(60))
        console.log('✅ 弁護士法人みやびのリンクを元のバリューコマースに戻しました')
        console.log('='.repeat(60))
    } else {
        console.log('ℹ️  修正が必要なリンクは見つかりませんでした')
    }
}

// 実行
if (require.main === module) {
    restoreMiyabiLink().catch(console.error)
}

module.exports = {
    restoreMiyabiLink
}
