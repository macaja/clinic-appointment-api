# F5 — GitHub Actions CI

**Epic:** F — Tooling · **Branch:** `feat/f5-ci` · **Depends on:** F4

> Read `.llm/plan.md` for architectural context if needed. CI mirrors the local `pre-push`
> gate (A4).

## Goal
Run lint, typecheck, unit/application tests, and build on every push/PR. Optionally run the
containerized integration tests.

## Files
- **`.github/workflows/ci.yml`**:
  - trigger: `push` + `pull_request`.
  - job `build-test` on `ubuntu-latest`, Node 20 (`actions/setup-node@v4`, `cache: npm`):
    - `npm ci`
    - `npm run lint`
    - `npm run typecheck`
    - `npm test -- --coverage`
    - `npm run build`
  - optional job `integration` (after build-test): `docker compose build` then
    `npm run test:integration` (or compose-based) — guard so it doesn't block if Docker layer
    is slow; document if left as a separate optional job.

## Acceptance criteria
- [ ] Workflow is valid YAML and the steps mirror local gates. (Runs on GitHub when pushed.)

## On completion
Commit: `F5: GitHub Actions CI`.
Run `make review`, then merge `feat/f5-ci` into `main` (`--no-ff`).
