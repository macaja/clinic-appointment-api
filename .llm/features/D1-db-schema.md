# D1 — SQLite connection + schema bootstrap

**Epic:** D — Persistence · **Branch:** `feat/d1-db-schema` · **Depends on:** C

> Read `.llm/plan.md` for architectural context if needed.

## Goal
A `better-sqlite3` connection factory that applies pragmas and bootstraps the schema, so the
repositories (D2/D3) have a ready database. Supports a file DB for local/prod and `:memory:`
for tests.

## Files
- **`src/infra/persistence/sqlite/schema.sql`** — exactly the three-table schema from
  `.llm/plan.md` §4 (clinician, patient, appointment with FKs; `startUtc`/`endUtc` INTEGER
  epoch-ms; `createdAt` INTEGER) plus
  `CREATE INDEX IF NOT EXISTS idx_appt_clinician_time ON appointment(clinicianId, startUtc, endUtc);`.
- **`src/infra/persistence/sqlite/db.ts`**
  - `createDb(path = process.env.DATABASE_PATH ?? './data/clinic.db'): Database`:
    - `new Database(path)`, then `db.pragma('journal_mode = WAL')` and
      `db.pragma('foreign_keys = ON')`.
    - Read `schema.sql` (via `fs.readFileSync(join(__dirname,'schema.sql'))`) and `db.exec(...)`.
    - Ensure parent dir exists for file paths (`mkdirSync(dirname(path), { recursive: true })`),
      skip for `:memory:`.
    - Return the `Database` instance.
  - Provide a Nest provider token `export const SQLITE_DB = 'SQLITE_DB';` (wired in E6).
- **`src/infra/persistence/sqlite/db.spec.ts`** — open `:memory:`, assert the three tables and
  the index exist (`SELECT name FROM sqlite_master`), and `foreign_keys` pragma is on.

> Note for the build: ensure `schema.sql` is available next to the compiled `db.js`. Either
> `nest-cli.json` `compilerOptions.assets` copies `**/*.sql`, or read it relative to a known
> path. Add the asset copy in this ticket and note it.

## Acceptance criteria
- [ ] `:memory:` db bootstraps all tables + index; FKs on. `npm test` green; lint clean.

## On completion
Commit: `D1: SQLite connection + schema bootstrap`.
Run `make review`, then merge `feat/d1-db-schema` into `main` (`--no-ff`).
