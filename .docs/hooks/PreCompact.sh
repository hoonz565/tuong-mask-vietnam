#!/bin/bash
# PreCompact.sh
# Runs before the AI compacts/summarizes the context window.
# Purpose: Write a snapshot of the current state to a temp file.

SNAPSHOT_FILE=".docs/.session-snapshot.md"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M")

cat > "$SNAPSHOT_FILE" << EOF
# Session Snapshot — $TIMESTAMP

## Git Log (last 3)
$(git log -3 --oneline)

## Modified Files
$(git status --short)

## Pending TODOs
### Frontend
$(grep "\- \[ \]" .docs/plans/frontend-plans.md)

### Backend
$(grep "\- \[ \]" .docs/plans/backend-plans.md)
EOF

echo "[PreCompact] Snapshot saved to $SNAPSHOT_FILE"
