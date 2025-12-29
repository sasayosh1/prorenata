#!/bin/bash

# Script to regenerate all SVG diagrams.
# IMPORTANT:
# - Generated assets are written to the local inbox: `~/_inbox/antigravity/prorenata/diagrams`
# - This script does NOT write into `public/` automatically (manual management).

set -euo pipefail

echo "Starting diagram regeneration..."

# 1. Regenerate Diagrams
echo "Running generate-svg-diagrams.py..."
python3 scripts/generate-svg-diagrams.py
echo "Running generate-svg-diagrams-batch2.py..."
python3 scripts/generate-svg-diagrams-batch2.py
echo "Running generate-svg-diagrams-batch3.py..."
python3 scripts/generate-svg-diagrams-batch3.py
echo "Running generate-svg-diagrams-batch4.py..."
python3 scripts/generate-svg-diagrams-batch4.py
echo "Running generate-svg-diagrams-batch5.py..."
python3 scripts/generate-svg-diagrams-batch5.py
echo "Running generate-svg-diagrams-second.py..."
python3 scripts/generate-svg-diagrams-second.py
echo "Running generate-svg-diagrams-second-batch2.py..."
python3 scripts/generate-svg-diagrams-second-batch2.py

echo ""
echo "✅ Generated diagrams are in: $HOME/_inbox/antigravity/prorenata/diagrams"
echo "To use them on the site, copy selected files into:"
echo "  public/images/chibichara/diagrams"

echo "Done."
