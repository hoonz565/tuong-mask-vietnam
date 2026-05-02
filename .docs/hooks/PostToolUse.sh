#!/bin/bash
# PostToolUse.sh
# Runs after each tool use (e.g. Edit, Write).
# Purpose: Auto-commit small changes to git with prefix NM-XXX.

TIMESTAMP=$(date +"%Y-%m-%d %H:%M")
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

# Only commit if there are actual changes
if ! git diff --quiet || ! git diff --cached --quiet; then
  git add -A
  git commit -m "NM-auto: snapshot @ $TIMESTAMP [$BRANCH]" --no-verify
  echo "[PostToolUse] Committed snapshot at $TIMESTAMP"
fi
