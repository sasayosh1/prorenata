require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const fs = require('fs')
const path = require('path')

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

const BACKUP_DIR = path.join(__dirname, '../backups')
const BACKUP_RETENTION_DAYS = 30

/**
 * Create a backup of an article before making changes
 * @param {string} articleId - The Sanity document ID
 * @param {string} operation - Description of the operation (e.g., 'fix-links', 'update-content')
 * @returns {Promise<string>} - Path to the backup file
 */
async function createBackup(articleId, operation = 'unknown') {
    try {
        // Ensure backup directory exists
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true })
        }

        // Fetch the current document
        const document = await client.getDocument(articleId)

        if (!document) {
            throw new Error(`Document ${articleId} not found`)
        }

        // Create filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
        const safeOperation = operation.replace(/[^a-z0-9-]/gi, '_')
        const filename = `backup_${articleId}_${safeOperation}_${timestamp}.json`
        const filepath = path.join(BACKUP_DIR, filename)

        // Save backup
        const backupData = {
            metadata: {
                backupDate: new Date().toISOString(),
                operation,
                articleId,
                articleTitle: document.title || 'Untitled',
                articleSlug: document.slug?.current || 'no-slug'
            },
            document
        }

        fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2), 'utf8')

        console.log(`✅ Backup created: ${filename}`)
        return filepath

    } catch (error) {
        console.error(`❌ Failed to create backup for ${articleId}:`, error.message)
        throw error
    }
}

/**
 * Create backups for multiple articles
 * @param {string[]} articleIds - Array of Sanity document IDs
 * @param {string} operation - Description of the operation
 * @returns {Promise<string[]>} - Array of backup file paths
 */
async function createBulkBackup(articleIds, operation = 'bulk-operation') {
    console.log(`📦 Creating backups for ${articleIds.length} articles...`)

    const backupPaths = []
    let successCount = 0
    let failCount = 0

    for (const articleId of articleIds) {
        try {
            const backupPath = await createBackup(articleId, operation)
            backupPaths.push(backupPath)
            successCount++
        } catch (error) {
            console.error(`Failed to backup ${articleId}`)
            failCount++
        }
    }

    console.log(`\n📊 Backup Summary:`)
    console.log(`   ✅ Success: ${successCount}`)
    console.log(`   ❌ Failed: ${failCount}`)
    console.log(`   📁 Backups saved to: ${BACKUP_DIR}\n`)

    return backupPaths
}

/**
 * List all backups, optionally filtered by article ID
 * @param {string} articleId - Optional article ID to filter by
 * @returns {Array} - Array of backup file info
 */
function listBackups(articleId = null) {
    if (!fs.existsSync(BACKUP_DIR)) {
        return []
    }

    const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
        .map(f => {
            const filepath = path.join(BACKUP_DIR, f)
            const stats = fs.statSync(filepath)
            const content = JSON.parse(fs.readFileSync(filepath, 'utf8'))

            return {
                filename: f,
                filepath,
                created: stats.mtime,
                size: stats.size,
                articleId: content.metadata.articleId,
                articleTitle: content.metadata.articleTitle,
                operation: content.metadata.operation
            }
        })
        .sort((a, b) => b.created - a.created)

    if (articleId) {
        return files.filter(f => f.articleId === articleId)
    }

    return files
}

/**
 * Clean up old backups (older than BACKUP_RETENTION_DAYS)
 */
function cleanupOldBackups() {
    if (!fs.existsSync(BACKUP_DIR)) {
        return
    }

    const now = Date.now()
    const retentionMs = BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000

    const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('backup_') && f.endsWith('.json'))

    let deletedCount = 0

    files.forEach(f => {
        const filepath = path.join(BACKUP_DIR, f)
        const stats = fs.statSync(filepath)
        const age = now - stats.mtime.getTime()

        if (age > retentionMs) {
            fs.unlinkSync(filepath)
            deletedCount++
        }
    })

    if (deletedCount > 0) {
        console.log(`🗑️  Cleaned up ${deletedCount} old backup(s)`)
    }
}

module.exports = {
    createBackup,
    createBulkBackup,
    listBackups,
    cleanupOldBackups,
    BACKUP_DIR
}

// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2)
    const command = args[0]

    if (command === 'list') {
        const articleId = args[1]
        const backups = listBackups(articleId)

        console.log(`\n📋 Backups (${backups.length} found):\n`)
        backups.forEach((b, i) => {
            console.log(`${i + 1}. ${b.filename}`)
            console.log(`   Article: ${b.articleTitle}`)
            console.log(`   Operation: ${b.operation}`)
            console.log(`   Created: ${b.created.toISOString()}`)
            console.log(`   Size: ${(b.size / 1024).toFixed(2)} KB\n`)
        })
    } else if (command === 'cleanup') {
        cleanupOldBackups()
    } else if (command === 'create' && args[1]) {
        const articleId = args[1]
        const operation = args[2] || 'manual-backup'
        createBackup(articleId, operation)
            .then(() => console.log('✅ Backup complete'))
            .catch(err => console.error('❌ Backup failed:', err.message))
    } else {
        console.log('Usage:')
        console.log('  node backup-utility.js list [articleId]')
        console.log('  node backup-utility.js create <articleId> [operation]')
        console.log('  node backup-utility.js cleanup')
    }
}
