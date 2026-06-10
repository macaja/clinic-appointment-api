# A4 — Husky pre-commit + pre-push hooks

**Epic:** A — Scaffold · **Branch:** `feat/a-scaffold` · **Depends on:** A3

> Read `.llm/plan.md` for architectural context if needed.

## Goal
Local quality gates: a fast `pre-commit` (format/lint staged files) and a thorough `pre-push`
(full lint + typecheck + tests + build). These mirror CI (F5) so nothing broken leaves the
machine. See `.llm/plan.md` §5 for the dev cycle.

## Files to create
Husky 9 was initialised by the `prepare` script (creates `.husky/_`). Add hook scripts
(no shebang/sourcing needed in husky 9 — just the command):

- **`.husky/pre-commit`**:
  ```sh
  npx lint-staged
  ```
- **`.husky/pre-push`**:
  ```sh
  npm run lint && npm run typecheck && npm test && npm run build
  ```
Make both executable: `chmod +x .husky/pre-commit .husky/pre-push`.

`lint-staged` config already lives in `package.json` (`*.ts` → `eslint --fix` + `prettier --write`).

## Acceptance criteria
- [ ] `.husky/pre-commit` and `.husky/pre-push` exist and are executable.
- [ ] Staging a badly-formatted `.ts` file and committing triggers lint-staged auto-fix.
- [ ] `pre-push` runs the full chain (can be slow — that's expected).

## Verification
```bash
ls -l .husky/pre-commit .husky/pre-push   # executable bits set
# optional: echo "const x=1" > src/tmp.ts && git add src/tmp.ts && git commit -m test  (then undo)
```

## On completion
Commit: `A4: husky pre-commit + pre-push hooks`.
