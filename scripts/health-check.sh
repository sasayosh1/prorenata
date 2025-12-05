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

# 5. Check External Links
if [ -f "scripts/check-external-links.js" ]; then
    run_check "External Link Validation" "node scripts/check-external-links.js"
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
