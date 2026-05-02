# ship.md — The CI/CD Release Command

## Execution Trigger
Use when the user says "ship it", "run ship command", or "deploy".

## Execution Steps
Run these steps sequentially in the terminal. If any step fails, STOP and report the error to the user. Do not proceed to the next step.

### 1. Validate & Build Frontend
```bash
cd frontend
npm run lint
npm run build
cd ..
```

### 2. Freeze Backend Dependencies
```bash
cd backend
.\venv\Scripts\activate
pip freeze > requirements.txt
cd ..
```

### 3. Pre-ship Checklist (Verification)
AI MUST confirm these conditions before pushing:
- [ ] Read .docs/plans/frontend-plans.md and backend-plans.md. Are all pending TODOs strictly related to this release checked off?
- [ ] Is the codebase free of unresolved debugging console.log statements?

### 4. Commit & Push
Analyze the Git diff, generate a concise semantic commit message, and execute the push.

```bash
git add .
git commit -m "ship: [AI-generated summary of major changes]"
git push origin [current-branch-name]
```
(Note for AI: Replace [current-branch-name] with the actual current branch name before executing the push command)