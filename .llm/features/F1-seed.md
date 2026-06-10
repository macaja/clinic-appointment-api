# F1 — Seed data + runner (overlap scenarios)

**Epic:** F — Tooling · **Branch:** `feat/f-tooling` (off `main` after E merged) · **Depends on:** E

> Read `docs/APPROACH.md` + `docs/tickets/README.md` first.

## Goal
Prepopulate a local DB with clinicians, patients and appointments — including deliberately
**overlapping/touching** windows — so reviewers can exercise the 409 path immediately.

## Files
- **`seed/test-data.sql`** — INSERTs:
  - 2–3 clinicians (`c1`,`c2`), 2–3 patients (`p1`,`p2`).
  - several appointments for `c1` with: a clean future slot, an adjacent **touching** slot
    (allowed), and pairs designed so a new overlapping booking will 409. Use far-future
    `startUtc`/`endUtc` epoch-ms so they're always "upcoming". Add a comment above each row
    explaining the scenario it sets up.
- **`scripts/seed.sh`** (or `seed.ts`) — load the seed into `DATABASE_PATH` (default
  `./data/clinic.db`). Simplest: `sqlite3 "$DB" < seed/test-data.sql` if sqlite3 CLI present;
  otherwise a tiny node script using `better-sqlite3` (`db.exec(readFileSync(...))`). Prefer the
  node script so there's no external CLI dependency.

## Acceptance criteria
- [ ] Running the seed against a fresh DB inserts the rows; re-running is safe (use
      `INSERT OR IGNORE` or document that seed assumes a fresh db).
- [ ] After seeding + `npm run start`, `GET /appointments` (X-Role admin) lists the seeded rows;
      a POST overlapping a seeded `c1` slot returns 409.

## On completion
Append F1 entry to `docs/APPROACH.md` §6. Commit: `F1: seed data + runner (overlap scenarios)`.
