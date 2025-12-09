require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

/**
 * セラの口調チェッカー
 * 記事がセラのプロフィールに沿っているかチェック
 */

// セラの口調要素
const SERA_VOICE_ELEMENTS = {
    required: {
        firstPerson: 'わたし',
        noExclamation: true,
        currentTense: true
    },
    personal: {
        family: ['リンク', '猫', '妹', '両親', '家族'],
        hobbies: ['プリン', 'チーズケーキ', 'ミルクティー', '甘いもの', 'スイーツ'],
        technology: ['タブレット', 'パソコン', 'デジタル', 'スマホ'],
        career: ['看護師', 'キャリア', '将来', '目指'],
        values: ['続けられる優しさ', '経済的', '報酬']
    }
}

/**
 * 記事のテキストを抽出
 */
function extractText(body) {
    if (!body || !Array.isArray(body)) return ''

    return body
        .filter(block => block._type === 'block')
        .map(block => {
            if (!block.children) return ''
            return block.children
                .filter(child => child._type === 'span')
                .map(child => child.text || '')
                .join('')
        })
        .join(' ')
}

/**
 * セラの口調をチェック
 */
function checkSeraVoice(article) {
    const text = extractText(article.body)
    const results = {
        articleId: article._id,
        title: article.title,
        slug: article.slug?.current,
        checks: {},
        score: 0,
        suggestions: []
    }

    // 1. 一人称「わたし」のチェック
    const watashiCount = (text.match(/わたし/g) || []).length
    const wareCount = (text.match(/われ/g) || []).length
    const bokuCount = (text.match(/ぼく/g) || []).length

    results.checks.firstPerson = {
        pass: watashiCount > 0,
        count: watashiCount,
        details: `「わたし」: ${watashiCount}回, 「われ」: ${wareCount}回, 「ぼく」: ${bokuCount}回`
    }

    if (watashiCount === 0) {
        results.suggestions.push('一人称「わたし」を使用してください')
    }

    // 2. 感嘆符のチェック
    const exclamationCount = (text.match(/！/g) || []).length
    results.checks.noExclamation = {
        pass: exclamationCount === 0,
        count: exclamationCount,
        details: `感嘆符: ${exclamationCount}個`
    }

    if (exclamationCount > 0) {
        results.suggestions.push('感嘆符（！）を削除してください')
    }

    // 3. 現在形表現のチェック
    const currentTensePatterns = ['ています', 'います', 'ます', 'です']
    const currentTenseCount = currentTensePatterns.reduce((count, pattern) => {
        return count + (text.match(new RegExp(pattern, 'g')) || []).length
    }, 0)

    results.checks.currentTense = {
        pass: currentTenseCount > 10,
        count: currentTenseCount,
        details: `現在形表現: ${currentTenseCount}回`
    }

    // 4. セラの個性要素のチェック
    const personalElements = {
        family: 0,
        hobbies: 0,
        technology: 0,
        career: 0,
        values: 0
    }

    Object.keys(SERA_VOICE_ELEMENTS.personal).forEach(category => {
        const keywords = SERA_VOICE_ELEMENTS.personal[category]
        keywords.forEach(keyword => {
            if (text.includes(keyword)) {
                personalElements[category]++
            }
        })
    })

    results.checks.personalElements = {
        pass: Object.values(personalElements).some(count => count > 0),
        details: personalElements,
        total: Object.values(personalElements).reduce((a, b) => a + b, 0)
    }

    if (results.checks.personalElements.total === 0) {
        results.suggestions.push('セラの個性要素（家族、趣味、テクノロジー、キャリア、価値観）を追加してください')
    }

    // 5. 漢字ひらがな比率のチェック（簡易版）
    const kanjiCount = (text.match(/[\u4e00-\u9faf]/g) || []).length
    const hiraganaCount = (text.match(/[\u3040-\u309f]/g) || []).length
    const ratio = kanjiCount / (hiraganaCount || 1)

    results.checks.kanjiHiraganaRatio = {
        pass: ratio >= 0.2 && ratio <= 0.5, // 3:7 = 0.43
        ratio: ratio.toFixed(2),
        details: `漢字: ${kanjiCount}, ひらがな: ${hiraganaCount}`
    }

    if (ratio > 0.5) {
        results.suggestions.push('漢字が多すぎます。ひらがなを増やしてください（目標: 3:7）')
    } else if (ratio < 0.2) {
        results.suggestions.push('ひらがなが多すぎます。適度に漢字を使用してください')
    }

    // スコア計算
    const passedChecks = Object.values(results.checks).filter(check => check.pass).length
    const totalChecks = Object.keys(results.checks).length
    results.score = Math.round((passedChecks / totalChecks) * 100)

    return results
}

/**
 * 全記事をチェック
 */
async function checkAllArticles() {
    console.log('🔍 セラの口調チェックを開始...\n')

    const articles = await client.fetch(`
    *[_type == "post" && !(_id in path("drafts.**"))] {
      _id,
      title,
      slug,
      body
    }
  `)

    console.log(`📊 対象記事数: ${articles.length}\n`)

    const results = articles.map(article => checkSeraVoice(article))

    // スコア別に分類
    const excellent = results.filter(r => r.score >= 80)
    const good = results.filter(r => r.score >= 60 && r.score < 80)
    const needsWork = results.filter(r => r.score >= 40 && r.score < 60)
    const poor = results.filter(r => r.score < 40)

    console.log('='.repeat(60))
    console.log('📈 セラの口調チェック結果サマリー')
    console.log('='.repeat(60))
    console.log()
    console.log(`✅ 優秀 (80%以上):     ${excellent.length}記事`)
    console.log(`🟢 良好 (60-79%):      ${good.length}記事`)
    console.log(`🟡 要改善 (40-59%):    ${needsWork.length}記事`)
    console.log(`🔴 要大幅改善 (<40%):  ${poor.length}記事`)
    console.log()

    // 詳細表示（スコアが低い順）
    console.log('='.repeat(60))
    console.log('📋 要改善記事の詳細（スコアが低い順）')
    console.log('='.repeat(60))
    console.log()

    const sortedResults = [...results].sort((a, b) => a.score - b.score)

    sortedResults.slice(0, 10).forEach((result, index) => {
        console.log(`${index + 1}. ${result.title}`)
        console.log(`   スコア: ${result.score}%`)
        console.log(`   Slug: ${result.slug}`)
        console.log(`   チェック結果:`)
        console.log(`     一人称: ${result.checks.firstPerson.pass ? '✅' : '❌'} ${result.checks.firstPerson.details}`)
        console.log(`     感嘆符なし: ${result.checks.noExclamation.pass ? '✅' : '❌'} ${result.checks.noExclamation.details}`)
        console.log(`     現在形: ${result.checks.currentTense.pass ? '✅' : '❌'} ${result.checks.currentTense.details}`)
        console.log(`     個性要素: ${result.checks.personalElements.pass ? '✅' : '❌'} 合計${result.checks.personalElements.total}個`)
        console.log(`     漢字比率: ${result.checks.kanjiHiraganaRatio.pass ? '✅' : '❌'} ${result.checks.kanjiHiraganaRatio.ratio}`)

        if (result.suggestions.length > 0) {
            console.log(`   提案:`)
            result.suggestions.forEach(s => console.log(`     - ${s}`))
        }
        console.log()
    })

    // JSONファイルに保存
    const fs = require('fs')
    const reportPath = require('path').join(__dirname, '../reports/sera_voice_check.json')
    fs.writeFileSync(reportPath, JSON.stringify({
        summary: {
            total: articles.length,
            excellent: excellent.length,
            good: good.length,
            needsWork: needsWork.length,
            poor: poor.length
        },
        results: sortedResults
    }, null, 2))

    console.log(`📄 詳細レポート: ${reportPath}\n`)
}

// 実行
if (require.main === module) {
    checkAllArticles().catch(console.error)
}

module.exports = {
    checkSeraVoice,
    checkAllArticles
}
