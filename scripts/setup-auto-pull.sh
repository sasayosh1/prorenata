#!/bin/bash

# Setup script for Auto-Pull Cron Job
# This will add a crontab entry to pull the prorenata repository hourly.

REPO_DIR="$(pwd)"
LOG_FILE="$REPO_DIR/logs/auto-pull.log"
CRON_CMD="$REPO_DIR/scripts/pull-and-notify.sh"
CRON_SCHEDULE="15 19 * * *" # Daily at 19:15

echo "---------------------------------------------------"
echo "ProReNata Auto-Pull Setup"
echo "---------------------------------------------------"
echo "Target Directory: $REPO_DIR"
echo "Log File: $LOG_FILE"
echo "Schedule: Every hour at minute 10 (e.g. 19:10)"
echo ""

# Check if already exists
EXISTING_JOB=$(crontab -l 2>/dev/null | grep "$REPO_DIR")

if [ -n "$EXISTING_JOB" ]; then
    echo "⚠️  An auto-pull job already exists for this directory:"
    echo "$EXISTING_JOB"
    echo ""
    read -p "Do you want to overwrite/update it? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
    # Remove existing job specific to this dir to avoid duplicates
    crontab -l 2>/dev/null | grep -v "$REPO_DIR" | crontab -
fi

# Add new job
(crontab -l 2>/dev/null; echo "$CRON_SCHEDULE $CRON_CMD") | crontab -

echo ""
echo "✅ Auto-Pull scheduled successfully!"
echo "Check $LOG_FILE for logs."
