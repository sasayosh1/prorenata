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
 * まとめセクションの本文を修正
 */

async function fixSummarySection(slug) {
    console.log(`\n🔧 まとめセクションを修正: ${slug}\n`)

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
    await createBackup(article._id, 'summary-fix')
    console.log('✅ バックアップ作成完了\n')

    // まとめセクションのインデックスを見つける
    const summaryIndex = article.body.findIndex(b =>
        b.style === 'h2' && b.children?.[0]?.text === 'まとめ'
    )

    if (summaryIndex === -1) {
        console.log('ℹ️  まとめセクションが見つかりません')
        return
    }

    // 次のH2/H3までのブロックを取得
    let summaryEndIndex = summaryIndex + 1
    while (summaryEndIndex < article.body.length) {
        const block = article.body[summaryEndIndex]
        if (block.style === 'h2' || block.style === 'h3') break
        summaryEndIndex++
    }

    // 新しいまとめ本文を作成
    const newSummaryContent = [
        {
            _key: `summary-p1-${Date.now()}`,
            _type: 'block',
            children: [{
                _key: `span-${Date.now()}-1`,
                _type: 'span',
                marks: [],
                text: '患者移送の安全技術について、ストレッチャーと車椅子の正しい使い方をお伝えしました。'
            }],
            markDefs: [],
            style: 'normal'
        },
        {
            _key: `summary-p2-${Date.now()}`,
            _type: 'block',
            children: [{
                _key: `span-${Date.now()}-2`,
                _type: 'span',
                marks: [],
                text: '安全な患者移送には、事前準備と環境確認、ボディメカニクスの活用、そして患者さんへの声かけという3つの基本が大切です。ストレッチャーや車椅子を使う際は、ブレーキの確認や移送経路の安全確保を忘れずに行いましょう。'
            }],
            markDefs: [],
            style: 'normal'
        },
        {
            _key: `summary-p3-${Date.now()}`,
            _type: 'block',
            children: [{
                _key: `span-${Date.now()}-3`,
                _type: 'span',
                marks: [],
                text: '一つひとつの手順を丁寧に実践し、チームで情報を共有しながら進めることで、患者さんにとっても自分にとっても安全な移送が実現できます。今日学んだことを、明日の業務で少しずつ活かしていきましょう。'
            }],
            markDefs: [],
            style: 'normal'
        }
    ]

    // 参考資料ブロックを探す
    const referenceBlocks = []
    for (let i = summaryIndex + 1; i < summaryEndIndex; i++) {
        const block = article.body[i]
        const text = JSON.stringify(block)
        if (text.includes('参考') || text.includes('厚生労働省')) {
            referenceBlocks.push(block)
        }
    }

    // 新しいbodyを構築
    const newBody = [
        ...article.body.slice(0, summaryIndex),  // まとめより前
        article.body[summaryIndex],               // まとめ見出し
        ...newSummaryContent,                     // 新しいまとめ本文
        ...article.body.slice(summaryEndIndex)    // まとめより後（あわせて読みたいなど）
    ]

    console.log('📝 まとめセクションを修正しました\n')

    // Sanityを更新
    await client
        .patch(article._id)
        .set({ body: newBody })
        .commit()

    console.log('✅ 更新完了\n')
    console.log('='.repeat(60))
    console.log('✅ まとめセクションの修正が完了しました')
    console.log('='.repeat(60))

    return { modified: true }
}

// 実行
if (require.main === module) {
    const slug = process.argv[2] || 'nursing-assistant-patient-transfer-safety'
    fixSummarySection(slug).catch(console.error)
}

module.exports = {
    fixSummarySection
}
