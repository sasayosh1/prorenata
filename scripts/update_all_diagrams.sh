#!/bin/bash

# Script to regenerate all SVG diagrams and sync assets
# This ensures that 'prorenata/画像' remains the source of truth,
# and 'public/' is updated for the web server.

echo "Starting diagram regeneration and asset sync..."

# 1. Regenerate Diagrams
# New unified structure: scripts generate diagrams directly to public/images/chibichara/diagrams
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

# 2. Assets are now unified in public/images/chibichara/diagrams
echo "Assets are now unified in public/images/chibichara/"

echo "Asset sync complete!"
