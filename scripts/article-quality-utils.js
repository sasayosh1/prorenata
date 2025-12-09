/**
 * 記事品質チェックと自動修正のユーティリティ
 * 
 * 新規記事作成時や既存記事更新時に使用
 */

const ARTICLE_QUALITY_RULES = {
    // 記事構造のルール
    structure: {
        // 必須セクション
        requiredSections: ['まとめ'],

        // 推奨セクション
        recommendedSections: ['あわせて読みたい'],

        // セクションの順序
        sectionOrder: [
            'content',      // 本文コンテンツ
            'reference',    // 参考文献（オプション）
            'summary',      // まとめ
            'related',      // あわせて読みたい
            'disclaimer'    // 免責事項
        ],

        // 見出しレベルのルール
        headingRules: {
            'まとめ': 'h2',
            'あわせて読みたい': 'h3',
            '参考文献': 'h2'
        }
    },

    // 内部リンクのルール
    internalLinks: {
        // 最小数
        minimum: 1,

        // リンクテキストの最大文字数
        maxTextLength: 50,

        // 推奨: 関連性の高い記事へのリンク
        preferRelated: true
    },

    // 関連記事セクションのルール
    relatedArticles: {
        // 見出しレベル
        headingLevel: 'h3',

        // 配置: まとめの直後、免責事項の前
        position: 'after-summary',

        // 推奨記事数
        recommendedCount: 3,

        // 最小記事数
        minimumCount: 2
    },

    // まとめセクションのルール
    summary: {
        // 見出しレベル
        headingLevel: 'h2',

        // 最小文字数
        minimumLength: 100,

        // 推奨文字数
        recommendedLength: 200,

        // 必須要素
        shouldInclude: [
            '記事の要約',
            '実践的なアドバイス',
            '前向きな締めくくり'
        ]
    }
}

/**
 * 記事の品質をチェック
 */
function checkArticleQuality(article) {
    const issues = []
    const warnings = []

    // 1. 「あわせて読みたい」セクションのチェック
    const relatedSection = article.body.find(b =>
        (b.style === 'h2' || b.style === 'h3') &&
        b.children?.[0]?.text?.includes('あわせて読みたい')
    )

    if (relatedSection) {
        // 見出しレベルのチェック
        if (relatedSection.style !== 'h3') {
            issues.push({
                type: 'heading_level',
                section: 'あわせて読みたい',
                expected: 'h3',
                actual: relatedSection.style,
                message: '「あわせて読みたい」はH3にする必要があります'
            })
        }

        // 実際のリンクがあるかチェック
        const relatedIndex = article.body.indexOf(relatedSection)
        let hasLinks = false

        for (let i = relatedIndex + 1; i < article.body.length; i++) {
            const block = article.body[i]
            if (block.style === 'h2' || block.style === 'h3') break
            if (block.markDefs && block.markDefs.some(md => md._type === 'link')) {
                hasLinks = true
                break
            }
        }

        if (!hasLinks) {
            issues.push({
                type: 'missing_links',
                section: 'あわせて読みたい',
                message: '「あわせて読みたい」セクションに実際のリンクがありません'
            })
        }
    } else {
        warnings.push({
            type: 'missing_section',
            section: 'あわせて読みたい',
            message: '「あわせて読みたい」セクションがありません（推奨）'
        })
    }

    // 2. まとめセクションのチェック
    const summarySection = article.body.find(b =>
        b.style === 'h2' && b.children?.[0]?.text === 'まとめ'
    )

    if (!summarySection) {
        issues.push({
            type: 'missing_section',
            section: 'まとめ',
            severity: 'critical',
            message: 'まとめセクションが見つかりません'
        })
    }

    // 3. 内部リンクのチェック
    let internalLinkCount = 0
    let longLinks = []

    article.body.forEach((block, index) => {
        if (block.markDefs) {
            block.markDefs.forEach(markDef => {
                if (markDef._type === 'link' && markDef.href?.startsWith('/posts/')) {
                    internalLinkCount++

                    // リンクテキストの長さをチェック
                    const linkText = block.children?.find(c =>
                        c.marks?.includes(markDef._key)
                    )?.text

                    if (linkText && linkText.length > 50) {
                        longLinks.push({
                            text: linkText,
                            length: linkText.length,
                            blockIndex: index
                        })
                    }
                }
            })
        }
    })

    if (internalLinkCount === 0) {
        warnings.push({
            type: 'no_internal_links',
            message: '内部リンクが1つもありません（推奨: 最低1つ）'
        })
    }

    if (longLinks.length > 0) {
        issues.push({
            type: 'long_link_text',
            links: longLinks,
            message: `リンクテキストが長すぎます（${longLinks.length}件）`
        })
    }

    return {
        issues,
        warnings,
        score: calculateQualityScore(issues, warnings)
    }
}

/**
 * 品質スコアを計算
 */
function calculateQualityScore(issues, warnings) {
    let score = 100

    issues.forEach(issue => {
        if (issue.severity === 'critical') {
            score -= 20
        } else {
            score -= 10
        }
    })

    warnings.forEach(() => {
        score -= 5
    })

    return Math.max(0, score)
}

module.exports = {
    ARTICLE_QUALITY_RULES,
    checkArticleQuality,
    calculateQualityScore
}
