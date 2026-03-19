# Maintenance Script Safety Features

## Overview

This document describes the safety features implemented to prevent accidental deletion of important articles and links.

## Features

### 1. Automatic Backup System

**What it does:**
- Automatically creates backups before making changes to articles
- Stores backups in `backups/` directory with timestamps
- Retains backups for 30 days
- Each backup includes metadata (operation, article title, timestamp)

**Usage:**

```bash
# Create a manual backup
node scripts/backup-utility.js create <articleId> [operation]

# List all backups
node scripts/backup-utility.js list

# List backups for specific article
node scripts/backup-utility.js list <articleId>

# Clean up old backups (>30 days)
node scripts/backup-utility.js cleanup
```

**Example:**
```bash
node scripts/backup-utility.js create fc67aa26-02eb-4655-8af7-b904d6c1c01e fix-links
```

---

### 2. Rollback System

**What it does:**
- Restores articles from backups
- Supports dry-run mode to preview changes
- Interactive mode to browse and select backups

**Usage:**

```bash
# Interactive mode - browse backups
node scripts/rollback.js

# Restore from specific backup (dry-run)
node scripts/rollback.js --file backups/backup_XXX.json --dry-run

# Restore from specific backup (actual)
node scripts/rollback.js --file backups/backup_XXX.json

# List backups for specific article
node scripts/rollback.js --article <articleId>
```

**Example:**
```bash
# Preview what would be restored
node scripts/rollback.js --file backups/backup_fc67aa26_fix-links_2025-12-06.json --dry-run

# Actually restore
node scripts/rollback.js --file backups/backup_fc67aa26_fix-links_2025-12-06.json
```

---

### 3. Protected Content System

**What it does:**
- Protects high-traffic articles from accidental modification
- Protects affiliate links from deletion
- Protects official links (e.g., MHLW)
- Detects anomalies (e.g., deleting too many links at once)

**Protected by default:**
- Articles with >1000 page views
- Articles created in the last 30 days
- Articles in the protected slug list
- Affiliate links (moshimo, valuecommerce, a8.net, etc.)
- Official government links (mhlw.go.jp)

**Configuration:**
Edit `config/protected-content.json` to customize:
- `protectedSlugs`: List of article slugs to protect
- `protectedLinkPatterns`: URL patterns to protect
- `minPvThreshold`: Minimum page views to protect
- `recentArticleDays`: Days to consider article as "recent"
- `anomalyThresholds`: Limits for detecting unusual changes

**Usage:**

```bash
# Check if an article is protected
node scripts/protection-utility.js check-article <slug> [pvCount]

# Check if a link is protected
node scripts/protection-utility.js check-link <url>
```

**Example:**
```bash
node scripts/protection-utility.js check-article nursing-assistant-compare-services-perspective 1500
# Output: Protected: true
#         Reasons:
#           - Article slug is in protected list
#           - Article has 1500 page views (threshold: 1000)

node scripts/protection-utility.js check-link "https://af.moshimo.com/af/c/click?a_id=123"
# Output: Protected: true
#         Type: affiliate
#         Reason: URL contains protected pattern: af.moshimo.com
```

---

### 4. Enhanced Maintenance Scripts

All maintenance scripts now support:

**New Flags:**
- `--dry-run` or `-d`: Preview changes without applying them
- `--force` or `-f`: Bypass protection checks (use with caution)
- `--skip-backup`: Skip creating backups (not recommended)

**Example:**

```bash
# Safe workflow: dry-run first
node scripts/fix-all-link-issues.js --dry-run

# If results look good, run for real
node scripts/fix-all-link-issues.js

# Force mode (bypasses protection)
node scripts/fix-all-link-issues.js --force
```

---

## Safety Workflow

### Recommended Process

1. **Always start with dry-run:**
   ```bash
   node scripts/fix-all-link-issues.js --dry-run
   ```

2. **Review the output carefully**
   - Check which articles will be modified
   - Verify the changes make sense
   - Look for any warnings about protected content

3. **Run the actual operation:**
   ```bash
   node scripts/fix-all-link-issues.js
   ```
   - Backups are created automatically
   - Protected content warnings will be shown
   - Operation will stop if critical errors are detected

4. **Verify the results:**
   - Check a few articles in Sanity Studio
   - Run health checks
   - Review the backup files created

5. **If something went wrong:**
   ```bash
   # List recent backups
   node scripts/backup-utility.js list | head -10
   
   # Restore from backup
   node scripts/rollback.js --file backups/backup_XXX.json
   ```

---

## Emergency Recovery

If you accidentally deleted or modified important content:

1. **Stop immediately** (Ctrl+C if script is still running)

2. **List recent backups:**
   ```bash
   node scripts/backup-utility.js list | head -20
   ```

3. **Find the backup for the affected article:**
   ```bash
   node scripts/backup-utility.js list <articleId>
   ```

4. **Preview the rollback:**
   ```bash
   node scripts/rollback.js --file backups/backup_XXX.json --dry-run
   ```

5. **Restore the article:**
   ```bash
   node scripts/rollback.js --file backups/backup_XXX.json
   ```

6. **Verify in Sanity Studio**

---

## Anomaly Detection

The system automatically detects unusual changes:

- **Too many links deleted**: >10 links in one article
- **Content reduction**: >50% reduction in article size
- **Too many blocks deleted**: >20 blocks in one article

When anomalies are detected:
- ❌ Error message is shown
- 🛑 Operation is blocked (unless `--force` is used)
- 📋 Details of the anomaly are logged

---

## Best Practices

1. **Always use dry-run first** - Never skip this step
2. **Review protection warnings** - They exist for a reason
3. **Keep backups** - Don't use `--skip-backup` unless absolutely necessary
4. **Use `--force` sparingly** - Only when you're absolutely sure
5. **Test on a few articles first** - Before running on all articles
6. **Monitor the logs** - Check for warnings and errors
7. **Verify results** - Always check a sample of modified articles

---

## Maintenance

### Backup Cleanup

Backups are automatically cleaned up after 30 days. To manually clean up:

```bash
node scripts/backup-utility.js cleanup
```

### Updating Protected Content

Edit `config/protected-content.json` to:
- Add/remove protected article slugs
- Adjust PV threshold
- Modify anomaly detection limits
- Add new protected link patterns

---

## Troubleshooting

### "Backup failed" error
- Check disk space
- Verify Sanity API token is valid
- Ensure article ID exists

### "Protection check failed" error
- Review the protection warnings
- Use `--force` if you're sure the change is safe
- Update `config/protected-content.json` if needed

### "Rollback failed" error
- Verify backup file exists and is valid JSON
- Check Sanity API token permissions
- Ensure article ID matches

---

## Files Created

- `scripts/backup-utility.js` - Backup creation and management
- `scripts/rollback.js` - Restore from backups
- `scripts/protection-utility.js` - Protection checks and validation
- `config/protected-content.json` - Protection configuration
- `backups/` - Backup storage directory (auto-created)

---

## Support

If you encounter issues:
1. Check the error message carefully
2. Review this README
3. Check recent backups
4. Verify configuration files
5. Test with dry-run mode
