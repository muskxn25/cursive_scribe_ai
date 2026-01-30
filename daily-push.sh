#!/bin/bash

# Simple script to push changes to GitHub
# Usage: ./daily-push.sh

echo "Starting daily push at $(date)"

# Navigate to the project directory (optional if run from root)
# cd /Users/muskxn25/cursivepower_vision

# Add all changes
git add .

# Commit changes with a timestamp
# If there are no changes, git commit will exit with 1, so we check for that
if git commit -m "Daily update: $(date +'%Y-%m-%d %H:%M:%S')"; then
    echo "Changes committed."
else
    echo "No changes to commit."
fi

# Push to the main branch
if git push origin main; then
    echo "Successfully pushed to GitHub."
else
    echo "Error: Failed to push to GitHub."
    exit 1
fi
