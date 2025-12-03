#!/bin/bash

# 1. Try to fetch Analytics data (will skip if no credentials)
echo "Attempting to fetch GSC/GA4 data..."
python3 scripts/analytics/fetch-gsc-data.py
python3 scripts/analytics/fetch-ga4-data.py

# 2. Run the thumbnail generation and update script
# This script handles the logic of selecting articles (fallback to recent/missing if no analytics data)
echo "Running thumbnail generation and update..."
node scripts/generate-thumbnails-local.js

echo "Done!"
