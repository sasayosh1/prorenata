require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const fs = require('fs')
const path = require('path')
const { listBackups } = require('./backup-utility')

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

/**
 * Rollback an article to a previous backup
 * @param {string} backupFilePath - Path to the backup file
 * @param {boolean} dryRun - If true, only show what would be restored
 */
async function rollback(backupFilePath, dryRun = false) {
    try {
        // Read backup file
        if (!fs.existsSync(backupFilePath)) {
            throw new Error(`Backup file not found: ${backupFilePath}`)
        }

        const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'))
        const { metadata, document } = backupData

        console.log('\n📄 Rollback Information:')
        console.log(`   Article: ${metadata.articleTitle}`)
        console.log(`   Slug: ${metadata.articleSlug}`)
        console.log(`   Backup Date: ${metadata.backupDate}`)
        console.log(`   Operation: ${metadata.operation}`)
        console.log(`   Article ID: ${metadata.articleId}\n`)

        if (dryRun) {
            console.log('🔍 DRY RUN - No changes will be made\n')
            console.log('Document preview:')
            console.log(`   Title: ${document.title}`)
            console.log(`   Body blocks: ${document.body?.length || 0}`)
            console.log(`   Description: ${document.description?.substring(0, 100) || 'N/A'}...\n`)
            return
        }

        // Confirm before restoring
        console.log('⚠️  This will overwrite the current version of the article.')
        console.log('   Make sure you have a recent backup if needed.\n')

        // Restore the document
        await client.createOrReplace(document)

        console.log('✅ Article successfully restored from backup\n')
        console.log('🔗 Verify in Sanity Studio:')
        console.log(`   https://sanity.io/@souya3c39v/prorenata/structure/post;${metadata.articleId}\n`)

    } catch (error) {
        console.error('❌ Rollback failed:', error.message)
        throw error
    }
}

/**
 * Interactive rollback - list backups and let user choose
 */
async function interactiveRollback(articleId = null) {
    const backups = listBackups(articleId)

    if (backups.length === 0) {
        console.log('No backups found')
        return
    }

    console.log('\n📋 Available Backups:\n')
    backups.slice(0, 20).forEach((b, i) => {
        console.log(`${i + 1}. ${b.articleTitle}`)
        console.log(`   File: ${b.filename}`)
        console.log(`   Operation: ${b.operation}`)
        console.log(`   Created: ${b.created.toISOString()}`)
        console.log(`   Size: ${(b.size / 1024).toFixed(2)} KB\n`)
    })

    console.log('To restore a backup, run:')
    console.log(`   node scripts/rollback.js --file backups/<filename>\n`)
}

// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2)

    const fileIndex = args.indexOf('--file')
    const dryRunIndex = args.indexOf('--dry-run')
    const articleIdIndex = args.indexOf('--article')

    const backupFile = fileIndex !== -1 ? args[fileIndex + 1] : null
    const dryRun = dryRunIndex !== -1
    const articleId = articleIdIndex !== -1 ? args[articleIdIndex + 1] : null

    if (backupFile) {
        // Resolve full path if relative
        const fullPath = backupFile.startsWith('/')
            ? backupFile
            : path.join(__dirname, '..', backupFile)

        rollback(fullPath, dryRun)
            .catch(err => {
                console.error('Rollback failed:', err.message)
                process.exit(1)
            })
    } else {
        // Interactive mode
        interactiveRollback(articleId)
    }
}

module.exports = {
    rollback,
    interactiveRollback
}
