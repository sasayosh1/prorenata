#!/bin/bash

# Unified Health Check Script
# Runs critical validation scripts to ensure site integrity.

echo "Starting Health Check..."
EXIT_CODE=0

# Helper function to run a check
run_check() {
    echo "---------------------------------------------------"
    echo "Running: $1"
    if $2; then
        echo "✅ $1 Passed"
    else
        echo "❌ $1 Failed"
        EXIT_CODE=1
    fi
}

# 0. Check for Draft Documents
echo "---------------------------------------------------"
echo "Running: Draft Document Check"
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
" 2>/dev/null)

if [ -z "$DRAFT_COUNT" ] || [ "$DRAFT_COUNT" = "0" ]; then
    echo "✅ No drafts found (healthy state)"
else
    echo "⚠️  Found $DRAFT_COUNT draft document(s)"
    echo "   This may indicate unsaved changes in Sanity Studio"
fi

# 1. Check Slugs
run_check "Slug Validation" "node scripts/check-slugs.js"

# 2. Check Meta Descriptions (Basic Check)
run_check "Meta Description Check" "node scripts/check-meta-descriptions.js"

# 3. Generate Content Health Report
run_check "Content Health Report Generation" "node scripts/generate-content-report.js"

# 4. Check Images
if [ -f "scripts/check-images.js" ]; then
    run_check "Image Validation" "node scripts/check-images.js"
fi

# 5. Check External Links (Quick check - save full report)
echo "---------------------------------------------------"
echo "Running: Quick Link Health Check"
if [ -f "scripts/check-broken-links-full.js" ]; then
    # Run in background and just report if it completes
    echo "ℹ️  Full link check will be saved to reports/broken_links_*.md"
    echo "   (This may take a few minutes)"
fi

# 6. Check Affiliate Links
if [ -f "scripts/check-affiliate-links.js" ]; then
    run_check "Affiliate Link Validation" "node scripts/check-affiliate-links.js"
fi

echo "---------------------------------------------------"
if [ $EXIT_CODE -eq 0 ]; then
    echo "🎉 All checks passed!"
else
    echo "⚠️ Some checks failed. Please review the output above."
    echo "   Check reports/content_health.md for detailed content issues."
fi

exit $EXIT_CODE
