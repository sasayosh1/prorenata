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
 * 「あわせて読みたい」セクションに関連記事リンクを追加
 */

async function addRelatedArticleLinks(slug) {
    console.log(`\n🔧 関連記事リンクを追加: ${slug}\n`)

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
    await createBackup(article._id, 'add-related-links')
    console.log('✅ バックアップ作成完了\n')

    // 「あわせて読みたい」セクションを見つける
    const relatedIndex = article.body.findIndex(b =>
        (b.style === 'h2' || b.style === 'h3') &&
        b.children?.[0]?.text?.includes('あわせて読みたい')
    )

    if (relatedIndex === -1) {
        console.log('ℹ️  「あわせて読みたい」セクションが見つかりません')
        return
    }

    // 関連記事リンクを作成
    const relatedArticles = [
        {
            title: '看護助手の1日スケジュールを徹底紹介',
            slug: 'nursing-assistant-detailed-daily-schedule'
        },
        {
            title: '看護助手の夜勤はきつい？一晩の流れを紹介',
            slug: 'nursing-assistant-night-shift-hard'
        },
        {
            title: '看護助手の仕事内容を新人でもわかりやすく解説',
            slug: 'nursing-assistant-job-description-beginners'
        }
    ]

    // リンクブロックを作成
    const linkBlocks = relatedArticles.map((article, index) => ({
        _key: `related-link-${Date.now()}-${index}`,
        _type: 'block',
        children: [
            {
                _key: `span-${Date.now()}-${index}`,
                _type: 'span',
                marks: [`link-${Date.now()}-${index}`],
                text: article.title
            }
        ],
        markDefs: [
            {
                _key: `link-${Date.now()}-${index}`,
                _type: 'link',
                href: `/posts/${article.slug}`
            }
        ],
        level: 1,
        listItem: 'bullet',
        style: 'normal'
    }))

    // 新しいbodyを構築
    const newBody = [...article.body]

    // 「この記事を読んだ方には...」のテキストブロックを見つけて削除
    let insertIndex = relatedIndex + 1
    while (insertIndex < newBody.length) {
        const block = newBody[insertIndex]
        if (block.children?.[0]?.text?.includes('この記事を読んだ方には')) {
            newBody.splice(insertIndex, 1)
            break
        }
        if (block.style === 'h2' || block.style === 'h3' ||
            JSON.stringify(block).includes('免責')) {
            break
        }
        insertIndex++
    }

    // リンクブロックを挿入
    newBody.splice(relatedIndex + 1, 0, ...linkBlocks)

    console.log('📝 関連記事リンクを追加しました:')
    relatedArticles.forEach(a => console.log(`  - ${a.title}`))
    console.log()

    // Sanityを更新
    await client
        .patch(article._id)
        .set({ body: newBody })
        .commit()

    console.log('✅ 更新完了\n')
    console.log('='.repeat(60))
    console.log('✅ 関連記事リンクの追加が完了しました')
    console.log('='.repeat(60))

    return { modified: true }
}

// 実行
if (require.main === module) {
    const slug = process.argv[2] || 'nursing-assistant-patient-transfer-safety'
    addRelatedArticleLinks(slug).catch(console.error)
}

module.exports = {
    addRelatedArticleLinks
}
