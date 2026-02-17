#!/bin/bash

# Navigate to repo directory
cd "$(dirname "$0")/.." || exit

LOG_FILE="logs/auto-pull.log"
date >> "$LOG_FILE"

# 1. Get current commit hash
OLD_HEAD=$(git rev-parse HEAD)

# 2. Pull changes
git pull --rebase --autostash >> "$LOG_FILE" 2>&1

# 3. Get new commit hash
NEW_HEAD=$(git rev-parse HEAD)

# 4. Notify if changed
if [ "$OLD_HEAD" != "$NEW_HEAD" ]; then
    echo "Changes detected. Sending notification." >> "$LOG_FILE"
    
    # Send macOS notification
    # Note: Requires user to allow Terminal/Cron to send notifications if prompted
    osascript -e 'display notification "新しいNote下書きが届きました" with title "ProReNata" sound name "default"' >> "$LOG_FILE" 2>&1
else
    echo "No changes." >> "$LOG_FILE"
fi
