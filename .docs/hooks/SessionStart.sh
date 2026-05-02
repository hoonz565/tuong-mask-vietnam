#!/bin/bash
# SessionStart.sh
# Runs at the start of each new AI assistant session.
# Purpose: Print a project status summary for tuong-mask.

echo "=== TUONG MASK — SESSION START ==="
echo "Branch: $(git rev-parse --abbrev-ref HEAD)"
echo "Last commit: $(git log -1 --oneline)"
echo ""
echo "--- Frontend ---"
echo "Stack: React (Vite) + Tailwind CSS 4 + Framer Motion"
echo "Entry: frontend/src/App.jsx"
echo ""
echo "--- Backend ---"
echo "Stack: FastAPI + SQLite (masks.db)"
echo "Entry: backend/main.py"
echo ""
echo "--- Pending TODOs ---"
grep "\- \[ \]" .docs/plans/frontend-plans.md | head -5
grep "\- \[ \]" .docs/plans/backend-plans.md  | head -5
echo "=================================="
