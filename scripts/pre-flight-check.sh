#!/bin/bash

# Pre-flight safety checks for maintenance scripts
# Run this before executing any bulk update operations

echo "🔍 Running pre-flight safety checks..."
echo ""

EXIT_CODE=0

# Check 1: Count drafts
echo "📝 Checking for draft documents..."
DRAFT_COUNT=$(node -e "
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { createClient } = require('@sanity/client');
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
});
client.fetch(\`count(*[_id in path('drafts.**')])\`).then(count => console.log(count));
")

if [ "$DRAFT_COUNT" -gt 0 ]; then
    echo "⚠️  WARNING: Found $DRAFT_COUNT draft document(s)"
    echo "   Maintenance scripts will skip these drafts."
else
    echo "✅ No drafts found"
fi
echo ""

# Check 2: Verify Sanity token
echo "🔑 Verifying Sanity API token..."
if [ -z "$SANITY_API_TOKEN" ]; then
    echo "❌ ERROR: SANITY_API_TOKEN not set"
    EXIT_CODE=1
else
    echo "✅ Token is set"
fi
echo ""

# Check 3: Check for recent backups (if applicable)
echo "💾 Checking last backup..."
# This is a placeholder - implement actual backup check if you have a backup system
echo "ℹ️  Note: Sanity maintains automatic version history"
echo ""

# Check 4: Verify scripts exist
echo "📄 Verifying maintenance scripts..."
SCRIPTS=(
    "scripts/fix-all-link-issues.js"
    "scripts/fix-affiliate-link-text.js"
    "scripts/remove-broken-internal-links.js"
    "scripts/convert-placeholder-links.js"
)

for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        echo "  ✅ $script"
    else
        echo "  ❌ $script NOT FOUND"
        EXIT_CODE=1
    fi
done
echo ""

# Summary
echo "=========================================="
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ All pre-flight checks passed"
    echo "   Safe to proceed with maintenance"
else
    echo "❌ Pre-flight checks FAILED"
    echo "   DO NOT proceed with maintenance"
fi
echo "=========================================="

exit $EXIT_CODE
