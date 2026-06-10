# G2 — Finalize README

**Epic:** G — Integration & docs · **Branch:** `feat/g-integration` · **Depends on:** G1

> Read `docs/APPROACH.md` + `docs/tickets/README.md` first. The challenge explicitly requires a
> README with run + test instructions, example curls, and a design-decisions/tradeoffs note.

## Goal
Replace the README skeleton with the complete, accurate doc reflecting the finished system.

## Sections to write/verify
- **Overview** + endpoint/role/status table (match the implemented behaviour).
- **Run locally:** `make local-setup` → `make local-seed` → `make local-run`; or `npm install`
  + `npm run start:dev`. Note `DATABASE_PATH`.
- **Run with Docker:** `docker compose up --build`; `/docs` URL.
- **Example requests (curl):** one per role (point at `scripts/` and inline the key ones),
  including the overlap → 409 example.
- **Tests:** `npm test` (unit/application) and `npm run test:integration` (the 4 scenarios);
  how the integration harness works.
- **Concurrency / race conditions:** the required note — `better-sqlite3` + `BEGIN IMMEDIATE`
  serialized check-then-insert; why a UNIQUE constraint can't express interval overlap; the
  Postgres `EXCLUDE`/`FOR UPDATE` alternative as the prod path.
- **Design decisions / tradeoffs:** distill `docs/APPROACH.md` (hexagonal-lite + use-cases,
  three tables + FKs, auto-create people, epoch-ms storage, X-Role simulation, what was cut for
  the timebox). Link to `docs/APPROACH.md` for the full log.

## Acceptance criteria
- [ ] Every command in the README actually works against the finished build (run them).
- [ ] Overlap rule + concurrency note are present and correct.

## On completion
Append G2 entry to `docs/APPROACH.md` §6. Commit: `G2: finalize README`.
**Epic G done** → `make review`, merge `feat/g-integration` into `main`. Project complete.
