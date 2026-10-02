# Agent Instructions

## Before Starting Work

1. Check the repo is up to date with the remote:
   ```bash
   git fetch origin
   git status
   ```
2. If the local `main` branch is behind `origin/main`, pull the latest changes before doing anything else:
   ```bash
   git pull --ff-only origin main
   ```
3. If the pull fails (e.g. diverged history or uncommitted local changes), stop and ask the user how to proceed instead of forcing a merge or rebase.

## After Completing Work

1. Run verification before committing:
   ```bash
   npm run build
   npm run lint
   ```
2. Stage the intended files, then commit with a concise conventional-commit message:
   ```bash
   git add <files>
   git commit -m "feat: <summary of change>"
   ```
3. Push to the remote:
   ```bash
   git push origin main
   ```
4. If the push is rejected because the remote moved ahead, run `git pull --rebase origin main`, re-verify the build, then push again.

## Notes

- Dev server: `npm run dev -- --host --port 5180` (port 5180 is reserved for this project).
- Never commit secrets or credentials.
