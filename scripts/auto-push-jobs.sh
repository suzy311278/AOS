#!/bin/bash
# Auto-commit and push jobs.xlsx when it changes
# Triggered by macOS launchd WatchPaths

# launchd has a minimal PATH - explicitly include node/npm locations
export PATH="/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:$PATH"

REPO="/Users/knowprajjwal/LearningPlatform"
FILE="src/jobs/jobs.xlsx"
COOLDOWN_FILE="/tmp/job-notify-cooldown"

cd "$REPO" || exit 1

# Only proceed if the file actually has changes
if git diff --quiet "$FILE" 2>/dev/null; then
  exit 0
fi

git add "$FILE"
git commit -m "Update jobs directory data (auto-push)"
git push academy main

# Check cooldown: skip notification if last one was less than 30 min ago
if [ -f "$COOLDOWN_FILE" ]; then
  last_date=$(cat "$COOLDOWN_FILE")
  today=$(date +%Y-%m-%d)
  if [ "$last_date" = "$today" ]; then
    echo "$(date): Skipping notification, already sent today" >> /tmp/job-notify.log
    exit 0
  fi
fi

# Notify users about new jobs (runs locally, no public API)
date +%Y-%m-%d > "$COOLDOWN_FILE"
export $(grep -v '^#' .env.local | xargs)
npx tsx scripts/notify-new-jobs.ts >> /tmp/job-notify.log 2>&1 &
