const fs = require('fs')
const path = require('path')

const CONFIG_PATH = path.join(__dirname, '../config/protected-content.json')

/**
 * Load protected content configuration
 */
function loadConfig() {
    if (!fs.existsSync(CONFIG_PATH)) {
        throw new Error(`Protected content config not found: ${CONFIG_PATH}`)
    }
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
}

/**
 * Check if an article is protected
 * @param {Object} article - Article object with slug, _createdAt, etc.
 * @param {number} pvCount - Optional page view count
 * @returns {Object} - { isProtected: boolean, reasons: string[] }
 */
function isArticleProtected(article, pvCount = 0) {
    const config = loadConfig()
    const reasons = []

    // Check if slug is in protected list
    if (config.protectedSlugs.includes(article.slug?.current)) {
        reasons.push(`Article slug '${article.slug.current}' is in protected list`)
    }

    // Check if article has high page views
    if (pvCount >= config.minPvThreshold) {
        reasons.push(`Article has ${pvCount} page views (threshold: ${config.minPvThreshold})`)
    }

    // Check if article is recently created
    if (article._createdAt) {
        const createdDate = new Date(article._createdAt)
        const daysSinceCreation = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)

        if (daysSinceCreation <= config.recentArticleDays) {
            reasons.push(`Article is recent (${Math.floor(daysSinceCreation)} days old, threshold: ${config.recentArticleDays} days)`)
        }
    }

    return {
        isProtected: reasons.length > 0,
        reasons
    }
}

/**
 * Check if a link is protected
 * @param {string} url - The URL to check
 * @returns {Object} - { isProtected: boolean, type: string, reason: string }
 */
function isLinkProtected(url) {
    const config = loadConfig()

    // Check against protected patterns
    for (const pattern of config.protectedLinkPatterns) {
        if (url.includes(pattern)) {
            // Determine link type
            const isAffiliate = ['affiliate', 'moshimo', 'valuecommerce', 'a8'].some(k => url.includes(k))
            const isOfficial = url.includes('mhlw.go.jp')

            const type = isAffiliate ? 'affiliate' : (isOfficial ? 'official' : 'protected')

            return {
                isProtected: true,
                type,
                reason: `URL contains protected pattern: ${pattern}`
            }
        }
    }

    return {
        isProtected: false,
        type: 'regular',
        reason: null
    }
}

/**
 * Check if a change violates anomaly thresholds
 * @param {Object} changes - Object describing the changes
 * @returns {Object} - { hasAnomaly: boolean, violations: string[] }
 */
function checkAnomalies(changes) {
    const config = loadConfig()
    const violations = []

    // Check links deleted
    if (changes.linksDeleted > config.anomalyThresholds.maxLinksDeletedPerArticle) {
        violations.push(
            `Too many links deleted: ${changes.linksDeleted} (max: ${config.anomalyThresholds.maxLinksDeletedPerArticle})`
        )
    }

    // Check content reduction
    if (changes.contentReductionPercent > config.anomalyThresholds.maxContentReductionPercent) {
        violations.push(
            `Content reduced by ${changes.contentReductionPercent}% (max: ${config.anomalyThresholds.maxContentReductionPercent}%)`
        )
    }

    // Check blocks deleted
    if (changes.blocksDeleted > config.anomalyThresholds.maxBlocksDeletedPerArticle) {
        violations.push(
            `Too many blocks deleted: ${changes.blocksDeleted} (max: ${config.anomalyThresholds.maxBlocksDeletedPerArticle})`
        )
    }

    return {
        hasAnomaly: violations.length > 0,
        violations
    }
}

/**
 * Get protection rules for a specific link type
 * @param {string} linkType - 'affiliate', 'internal', or 'external'
 * @returns {Object} - Protection rules
 */
function getProtectionRules(linkType) {
    const config = loadConfig()
    return config.protectionRules[linkType + 'Links'] || config.protectionRules.externalLinks
}

/**
 * Validate a proposed change against protection rules
 * @param {Object} article - The article being modified
 * @param {Object} changes - Proposed changes
 * @param {Object} options - { force: boolean, pvCount: number }
 * @returns {Object} - { allowed: boolean, warnings: string[], errors: string[] }
 */
function validateChange(article, changes, options = {}) {
    const { force = false, pvCount = 0 } = options
    const warnings = []
    const errors = []

    // Check if article is protected
    const articleProtection = isArticleProtected(article, pvCount)
    if (articleProtection.isProtected && !force) {
        warnings.push('⚠️  This article is protected:')
        articleProtection.reasons.forEach(r => warnings.push(`   - ${r}`))
        warnings.push('   Use --force to override')
    }

    // Check for anomalies
    const anomalyCheck = checkAnomalies(changes)
    if (anomalyCheck.hasAnomaly) {
        errors.push('❌ Anomalies detected:')
        anomalyCheck.violations.forEach(v => errors.push(`   - ${v}`))

        if (!force) {
            errors.push('   Use --force to override (not recommended)')
        }
    }

    // Check protected links
    if (changes.linksToDelete) {
        changes.linksToDelete.forEach(link => {
            const linkProtection = isLinkProtected(link.url)
            if (linkProtection.isProtected) {
                const rules = getProtectionRules(linkProtection.type)

                if (!rules.allowDeletion) {
                    errors.push(`❌ Cannot delete ${linkProtection.type} link: ${link.url}`)
                } else if (rules.requireConfirmation && !force) {
                    warnings.push(`⚠️  Deleting ${linkProtection.type} link: ${link.url}`)
                    warnings.push(`   Reason: ${linkProtection.reason}`)
                }
            }
        })
    }

    return {
        allowed: errors.length === 0 || force,
        warnings,
        errors
    }
}

module.exports = {
    loadConfig,
    isArticleProtected,
    isLinkProtected,
    checkAnomalies,
    getProtectionRules,
    validateChange
}

// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2)
    const command = args[0]

    if (command === 'check-article') {
        const slug = args[1]
        const pvCount = parseInt(args[2]) || 0

        const result = isArticleProtected({ slug: { current: slug } }, pvCount)
        console.log(`\nArticle: ${slug}`)
        console.log(`Protected: ${result.isProtected}`)
        if (result.reasons.length > 0) {
            console.log('Reasons:')
            result.reasons.forEach(r => console.log(`  - ${r}`))
        }
    } else if (command === 'check-link') {
        const url = args[1]
        const result = isLinkProtected(url)
        console.log(`\nURL: ${url}`)
        console.log(`Protected: ${result.isProtected}`)
        console.log(`Type: ${result.type}`)
        if (result.reason) {
            console.log(`Reason: ${result.reason}`)
        }
    } else {
        console.log('Usage:')
        console.log('  node protection-utility.js check-article <slug> [pvCount]')
        console.log('  node protection-utility.js check-link <url>')
    }
}
