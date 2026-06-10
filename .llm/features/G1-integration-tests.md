# G1 — Integration tests (the 4 required scenarios)

**Epic:** G — Integration & docs · **Branch:** `feat/g1-integration-tests` · **Depends on:** F

> Read `.llm/plan.md` for architectural context if needed. These cover the challenge's
> explicitly-required test cases.

## Goal
End-to-end HTTP tests exercising the real Nest app + SQLite, covering: create, reject-overlap,
list-clinician, date-range filtering.

## Approach
Two viable harnesses — pick one and document it:
- **(simpler, recommended)** boot the app in-process with `Test.createTestingModule` +
  `app.init()`, using a `:memory:` or temp-file SQLite DB, and drive it with **supertest**.
- **(containerized)** `docker compose up` then run supertest against `http://localhost:3000`.
  Matches the "spin up a container" goal but is slower/flakier in CI.
The repo's `npm run test:integration` should run whichever is chosen.

## Files
- **`test/integration/jest-integration.config.js`** — ts-jest, `roots: ['<rootDir>/test/integration']`,
  `testRegex: '.*\\.e2e-spec\\.ts$'`, `runInBand` semantics (set in the npm script).
- **`test/integration/appointments.e2e-spec.ts`** — scenarios:
  - [ ] **create**: `POST /appointments` (X-Role patient) with a valid future slot → `201`,
        body has an id + ISO times.
  - [ ] **reject overlap**: a second `POST` overlapping the same clinician → `409`.
        Also assert **touching** endpoints → `201` (allowed).
  - [ ] **list clinician**: `GET /clinicians/:id/appointments` (X-Role clinician) → `200`,
        contains the created appointment; excludes past.
  - [ ] **date-range filtering**: `GET /appointments?from=...&to=...` (X-Role admin) → only
        in-range rows; out-of-range excluded.
  - [ ] (bonus) wrong role → `403`; malformed `start` → `400`.
- Use a fresh DB per run (set `DATABASE_PATH` to a temp file or `:memory:`).

## Acceptance criteria
- [ ] `npm run test:integration` passes all four required scenarios + the bonus assertions.
- [ ] CI (F5) can run it (in-process harness needs no Docker).

## On completion
Commit: `G1: integration tests (create/overlap/list/range)`.
Run `make review`, then merge `feat/g1-integration-tests` into `main` (`--no-ff`).
