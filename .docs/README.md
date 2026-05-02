# .docs/ — Internal Documentation & AI Configuration for Tuong Mask

> This directory acts as the "Brain" of the project. It contains all internal documentation, coding rules, automation hooks, and AI assistant configurations.

## Structure
```text
.docs/
├── hooks/             # Lifecycle scripts triggered automatically
│   ├── PostToolUse.sh # Auto-commits state after AI edits a file
│   ├── PreCompact.sh  # Saves a context snapshot before AI flushes memory
│   └── SessionStart.sh# Injects core project status when a new chat starts
│
├── commands/          # Macro executable commands
│   └── ship.md        # The CI/CD pipeline (Lint -> Build -> Push)
│
├── agents/            # Specialized AI personas (Role prompting)
│   ├── code-reviewer.md # Rules for analyzing diffs and PRs
│   ├── log-analyzer.md  # Rules for debugging crashes and terminal logs
│   └── researcher.md    # Rules for sourcing Tuong mask lore and assets
│
├── rules/             # Architectural and styling guardrails
│   ├── frontend.md    # React, Tailwind 4, and Framer Motion constraints
│   └── api.md         # FastAPI endpoints and SQLite schema rules
│
├── output-styles/     # AI response formatting
│   └── terse.md       # "Code only, no prose" mode for rapid fixes
│
└── plans/             # Roadmaps and state tracking
    ├── backend-plans.md
    ├── design-plans.md
    └── frontend-plans.md