# D2 — `SqlitePeopleRepository` (+ tests)

**Epic:** D — Persistence · **Branch:** `feat/d2-sqlite-people-repo` · **Depends on:** D1

> Read `.llm/plan.md` for architectural context if needed.

## Goal
Implement the `PeopleRepository` port against SQLite, auto-creating clinician/patient stub rows
on first reference (per the auto-create decision in `.llm/plan.md`).

## Files
- **`src/infra/persistence/sqlite/sqlite-people.repository.ts`**
  - `implements PeopleRepository`; constructor takes the `better-sqlite3` `Database`.
  - `ensureClinician(id)` → `INSERT OR IGNORE INTO clinician (id) VALUES (?)`.
  - `ensurePatient(id)` → `INSERT OR IGNORE INTO patient (id) VALUES (?)`.
  - (Prepared statements cached on construction.)
- **`...repository.spec.ts`** — against `:memory:` db from D1.

## TDD / tests
- [ ] ensuring a new clinician id inserts exactly one row.
- [ ] ensuring the same id twice is idempotent (still one row, no error).
- [ ] same for patient.

## Acceptance criteria
- [ ] `npm test` green; lint clean. Adapter implements the port interface exactly.

## On completion
Commit: `D2: SqlitePeopleRepository (auto-create)`.
Run `make review`, then merge `feat/d2-sqlite-people-repo` into `main` (`--no-ff`).
