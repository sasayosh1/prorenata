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
# Assuming check-slugs.js exists and returns non-zero on error
run_check "Slug Validation" "node scripts/check-slugs.js"

# 2. Check Meta Descriptions
run_check "Meta Description Check" "node scripts/check-meta-descriptions.js"

# 3. Check Images (if script exists)
if [ -f "scripts/check-images.js" ]; then
    run_check "Image Validation" "node scripts/check-images.js"
fi

# 4. Check Internal Links (if script exists)
# validate-links.js seems relevant
if [ -f "scripts/validate-links.js" ]; then
    run_check "Link Validation" "node scripts/validate-links.js"
fi

echo "---------------------------------------------------"
if [ $EXIT_CODE -eq 0 ]; then
    echo "🎉 All checks passed!"
else
    echo "⚠️ Some checks failed. Please review the output above."
fi

exit $EXIT_CODE
