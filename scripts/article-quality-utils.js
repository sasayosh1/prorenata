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
            'summary',      // まとめ
            'related',      // あわせて読みたい
            'reference',    // 参考文献（オプション）
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

    // 1. セクションの存在と順序チェック
    const sections = []

    // 参考文献
    const referenceIndex = article.body.findIndex(b =>
        (b.style === 'h2' || b.style === 'h3') && b.children?.[0]?.text?.includes('参考文献')
    )
    if (referenceIndex !== -1) sections.push({ name: 'reference', index: referenceIndex })

    // まとめ
    const summaryIndex = article.body.findIndex(b =>
        b.style === 'h2' && b.children?.[0]?.text === 'まとめ'
    )
    if (summaryIndex !== -1) {
        sections.push({ name: 'summary', index: summaryIndex })
    } else {
        issues.push({
            type: 'missing_section',
            section: 'まとめ',
            severity: 'critical',
            message: 'まとめセクションが見つかりません'
        })
    }

    // あわせて読みたい
    const relatedIndex = article.body.findIndex(b =>
        (b.style === 'h2' || b.style === 'h3') && b.children?.[0]?.text?.includes('あわせて読みたい')
    )
    if (relatedIndex !== -1) {
        sections.push({ name: 'related', index: relatedIndex })

        // 見出しレベルチェック
        const relatedBlock = article.body[relatedIndex]
        if (relatedBlock.style !== 'h3') {
            issues.push({
                type: 'heading_level',
                section: 'あわせて読みたい',
                expected: 'h3',
                actual: relatedBlock.style,
                message: '「あわせて読みたい」はH3にする必要があります'
            })
        }

        // リンク存在チェック
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

    // 免責事項（簡易チェック：最後のブロック付近にあるか）
    // 免責事項は通常、特定のスタイルやテキストで識別されるが、ここでは簡易的に
    // "免責事項"というテキストを含むブロックを探す
    const disclaimerIndex = article.body.findIndex(b =>
        JSON.stringify(b).includes('免責事項')
    )
    if (disclaimerIndex !== -1) {
        sections.push({ name: 'disclaimer', index: disclaimerIndex })
    }

    // 順序チェック
    // 期待される順序: reference -> summary -> related -> disclaimer
    // 見つかったセクションだけで順序を確認
    const foundSections = sections.sort((a, b) => a.index - b.index)
    const orderMap = { reference: 1, summary: 2, related: 3, disclaimer: 4 }

    let lastOrder = 0
    foundSections.forEach(section => {
        const currentOrder = orderMap[section.name]
        if (currentOrder < lastOrder) {
            issues.push({
                type: 'section_order',
                message: `セクションの順序が正しくありません: ${section.name} が前のセクションより後に来ています`
            })
        }
        lastOrder = currentOrder
    })

    // 2. 内部リンクのチェック
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

    // 3. セラボイス（簡易チェック）
    // 一人称が「私」ではなく「わたし」であるか
    // 文末が「だ/である」ではなく「です/ます」であるか（簡易判定）
    const bodyText = article.body
        .filter(b => b._type === 'block' && b.children)
        .map(b => b.children.map(c => c.text).join(''))
        .join('\n')

    if (bodyText.includes('私') && !bodyText.includes('わたし')) {
        warnings.push({
            type: 'sera_voice_pronoun',
            message: '一人称に「私」が使われています（推奨: 「わたし」）'
        })
    }

    // 「だ/である」調の簡易検出（文末判定は難しいので、特徴的な語尾で警告）
    if (bodyText.match(/である。/g) || bodyText.match(/だ。/g)) {
        warnings.push({
            type: 'sera_voice_tone',
            message: '「だ/である」調が検出されました（推奨: 「です/ます」調）'
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
