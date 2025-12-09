#!/bin/bash

# Script to regenerate all SVG diagrams and sync assets
# This ensures that 'prorenata/画像' remains the source of truth,
# and 'public/' is updated for the web server.

echo "Starting diagram regeneration and asset sync..."

# 1. Regenerate Diagrams
# This script now outputs to "画像/diagram"
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

# 2. Sync Diagrams to Public
echo "Syncing diagrams to public/diagrams/..."
mkdir -p public/diagrams
cp "画像/diagram/"*.svg public/diagrams/

# 3. Sync Chibi Assets to Public
echo "Syncing chibi assets to public/images/avatars/..."
mkdir -p public/images/avatars
cp "画像/chibi chara/"*.png public/images/avatars/

# 4. Sync Thumbnails to Public
echo "Syncing thumbnails to public/images/thumbnails/..."
mkdir -p public/images/thumbnails
cp "画像/thumbnail&top/"*.png public/images/thumbnails/

echo "Asset sync complete!"
