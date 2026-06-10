# Approach & Decision Log

This document is the narrative of how I tackled the Lyrebird Health "Clinic Appointment
System" coding challenge. It captures the plan, the key technical decisions and *why* I made
them, the ticket breakdown I worked through, and a running per-ticket log. The README's
"Design decisions" section distills the highlights; this file is the full story.

---

## 1. The challenge (summary)

Build a small RESTful API (TypeScript) for a simplified clinic appointment system:

- **POST `/appointments`** — book an appointment; validate input; **reject overlaps for the
  same clinician**; `201` on success, `409` on overlap, `400` on invalid input.
- **GET `/clinicians/{id}/appointments`** — a clinician's upcoming appointments; optional
  `from`/`to`; default `start >= now`.
- **GET `/appointments`** — admin lists all upcoming appointments; optional `from`/`to`,
  optional pagination.

Explicit rules: valid ISO datetimes, `start` strictly before `end`, zero/negative length
invalid, **touching endpoints are allowed** (`end == other.start` is fine; overlap is
`start < other.end && end > other.start`), past appointments rejected (recommended).

Timebox **3–4 hours**, graded on **correctness, clarity, and reasonable validation over
bells & whistles**. Bonus: Swagger, role simulation (`X-Role`/`?role`), Docker, CI, and a
concurrency-safe creation path with a written note.

---

## 2. Architecture

**Pragmatic hexagonal-lite** — enough ports/adapters to show clean seams (so future SMS,
email, payment, analytics integrations slot in without rewrites), without CQRS/event-bus
ceremony that would be over-engineering for a single-aggregate domain.

```
src/
  domain/            TimeRange (value object), Appointment (entity), errors
  application/
    ports/           AppointmentRepository, PeopleRepository (interfaces)
    use-cases/       CreateAppointment, ListClinicianAppointments, ListAllAppointments
  infra/
    persistence/sqlite/   db.ts, schema.sql, sqlite repositories (adapters)
    http/                 controllers, dtos, guards, decorators, interceptors, filters
    observability/        logger
  app.module.ts
  main.ts            ValidationPipe, Swagger /docs, logger
test/
  unit/  application/  integration/
```

The domain knows nothing about HTTP or SQLite. Use-cases depend on **ports** (interfaces);
SQLite and Nest controllers are **adapters** behind those ports.

---

## 3. Key decisions & rationale

- **NestJS + TypeScript + SQLite.** Nest gives DI, guards, pipes, and Swagger out of the box,
  which map cleanly onto the hexagonal seams. SQLite keeps setup zero-friction (challenge
  recommends it).

- **SQLite driver: `better-sqlite3` (not TypeORM/Prisma).** It's synchronous and gives
  *explicit* transaction control, which matters for the core requirement. Critically, it lets
  me open a transaction as **`BEGIN IMMEDIATE`** to serialize the check-then-insert. TypeORM's
  pessimistic lock compiles to `SELECT ... FOR UPDATE`, **which SQLite silently does not
  support** — using it would be misleading about how the race is actually prevented. So I use
  the honest mechanism and document it.

- **Concurrency = transactional check inside `BEGIN IMMEDIATE`.** Overlap is a *range*
  predicate, so a `UNIQUE` constraint cannot enforce it (uniqueness is equality only). The
  repository runs `SELECT overlapping rows → if none, INSERT` inside an immediate transaction.
  The immediate lock means a second concurrent booker blocks until the first commits, then
  re-reads and sees the clash → `409`. A composite index `(clinicianId, startUtc, endUtc)`
  keeps the overlap query fast. (A production Postgres version could instead use an `EXCLUDE`
  constraint with `btree_gist`, or `SELECT ... FOR UPDATE` — noted as the prod path.)

- **Three tables + FKs** (`clinician`, `patient`, `appointment`). Shows normalization and
  referential integrity at low cost. An appointment references **both** a clinician and a
  patient — the original "(start, end, clinicianId)" sketch omitted the patient, but the
  challenge requires patient existence, so the patient belongs in the model.

- **Auto-create clinician/patient on first reference.** The challenge offers "clinician &
  patient exist (or auto-create simple records)". Auto-creating a minimal stub keeps the
  booking flow from 400-ing on an unknown id and avoids a separate registration endpoint.
  Tradeoff: less strict than rejecting unknown ids; acceptable for the exercise and documented.

- **Timestamps stored as INTEGER epoch-millis (UTC)**, serialized back to ISO-8601 in
  responses. Gives unambiguous comparisons and clean range indexing; ISO parsing/validation
  happens at the DTO boundary.

- **Role simulation via `RolesGuard`** reading `X-Role` (fallback `?role=`) + a `@Roles(...)`
  decorator. `GET /appointments` is admin-only (explicit requirement); patients book;
  clinicians read their own schedule.

- **Validation in two layers.** DTOs (`class-validator` + global `ValidationPipe`,
  `whitelist`/`transform`) catch malformed input → `400`. The domain (`TimeRange`) enforces
  invariants (`start < end`, positive length). A domain→HTTP exception filter maps
  `OverlapError → 409` and the rest → `400`.

- **TDD throughout.** Tests written first per unit so each step is visible and the graded
  behaviour (the overlap truth table) is pinned down before implementation.

---

## 4. Ticket breakdown

Worked one ticket at a time (≈ one commit each). TDD tickets: test first, then implementation.

**Epic A — Scaffold & tooling**
- A1 — scaffolding files (`.gitignore`, `package.json`, README skeleton)
- A2 — TypeScript + Nest config (`tsconfig`, `nest-cli.json`, Jest)
- A3 — ESLint + Prettier
- A4 — Husky + lint-staged pre-commit
- A5 — minimal Nest bootstrap + `GET /health`; verify it serves

**Epic B — Domain (TDD)**
- B1 — `TimeRange` value object (overlap truth table) — tests → impl
- B2 — `Appointment` entity + domain errors

**Epic C — Application use-cases (TDD)**
- C1 — ports + in-memory fakes
- C2 — `CreateAppointment` (success, overlap, auto-create, past) — tests → impl
- C3 — `ListClinicianAppointments` (default now, from/to) — tests → impl
- C4 — `ListAllAppointments` (from/to, limit/offset) — tests → impl

**Epic D — SQLite persistence**
- D1 — `db.ts` + `schema.sql` + `PRAGMA foreign_keys`, bootstrap
- D2 — `SqlitePeopleRepository` (lookup + auto-create) + tests
- D3 — `SqliteAppointmentRepository` (`BEGIN IMMEDIATE` + overlap query) + concurrency test

**Epic E — HTTP layer**
- E1 — DTOs + `ValidationPipe`
- E2 — `RolesGuard` + `@Roles` decorator
- E3 — domain→HTTP exception filter
- E4 — `AppointmentsController` (POST, admin GET) + `CliniciansController` (GET)
- E5 — `LoggingInterceptor` + logger
- E6 — Swagger `/docs` + DI wiring (ports → adapters)

**Epic F — Ops tooling**
- F1 — `seed/test-data.sql` (overlap scenarios) + seed runner
- F2 — per-role curl scripts
- F3 — `Makefile` targets
- F4 — `Dockerfile` + `docker-compose.yml`
- F5 — GitHub Actions CI

**Epic G — Integration + docs**
- G1 — `test/integration` supertest suite (4 required scenarios) against containerized app
- G2 — finalize `README.md`

---

## 5. Development cycle

Work is delivered as **one feature branch per epic**, branched sequentially off `main`
(each epic depends on the previous, so it starts from `main` after the prior epic merges).
`main` is always kept green (tests pass, app boots).

Per epic:

1. `git checkout main` → `git checkout -b feat/<epic>` (branch created manually).
2. For each ticket, **TDD red→green**:
   - failing **test first** — reviewed hardest (the test encodes the spec, e.g. the overlap
     truth table); design issues are caught here before code exists;
   - implementation → test green — quick diff review + inline steering;
   - commit per ticket (short message referencing the ticket id; an entry appended to §6).
3. Epic done → **`make review`**: deterministic gate (lint + typecheck + tests + build) plus
   an AI diff pass (`git diff main...HEAD | claude -p`). Fix before merging.
4. Holistic **`/review`** (and `/security-review` where relevant).
5. `git merge --no-ff feat/<epic>` into `main` (merge commit preserves the epic boundary),
   then push.

Local quality gates: Husky **`pre-commit`** (fast — lint-staged on staged files) and
**`pre-push`** (full lint + typecheck + tests + build). These mirror the GitHub Actions CI
so nothing broken leaves the machine. Git is driven manually so the history reads as a
deliberate, reviewable progression; this file holds the reasoning, commit messages stay short.

> Note: the review tooling itself (Husky hooks, `make review`) is built *during* Epic A, so
> Epic A is verified with manual checks until those targets exist.

---

## 6. Per-ticket log

> Appended as each ticket lands: **goal · decision · why · tradeoff · outcome**.

### A2 — TypeScript, Nest & Jest config

- **Goal:** wire the compiler, the Nest CLI build, and the Jest test harness so later tickets
  have a type-safe environment and a runnable test runner from the start.
- **Decision:** `tsconfig.json` targets ES2022 / commonjs with `strict`, `experimentalDecorators`,
  and `emitDecoratorMetadata` (required by Nest's DI). `tsconfig.build.json` inherits and
  excludes `test/` and `*.spec.ts` so `nest build` only compiles production code.
  `nest-cli.json` sets `sourceRoot: src` and `deleteOutDir: true`.
  `jest.config.js` uses `ts-jest`, roots at `src/`, `passWithNoTests: true`.
- **Why `passWithNoTests`:** the test runner must be callable on an empty tree without signalling
  false failure — tests accumulate ticket-by-ticket.
- **Stub `src/app.module.ts`:** TypeScript throws `TS18003` (no input files found) when the
  `include` paths exist but contain no `.ts` files. A minimal `@Module({}) AppModule` satisfies
  the compiler; A5 will flesh it out.
- **Tradeoff:** `baseUrl: "./"` is deprecated in TypeScript 7 (IDE warning visible in TS
  language server); `tsc` 5.7 treats it as informational only and exits 0. The spec requires
  it for the module-resolution pattern used later — no action taken.
- **Outcome:** `tsconfig.json`, `tsconfig.build.json`, `nest-cli.json`, `jest.config.js`,
  `src/app.module.ts` stub, `src/` and `test/` directory scaffolds.
  `npm run typecheck` exits 0; `npx jest` exits 0 (no tests).

### A1 — Scaffolding files (`.gitignore`, `package.json`, README skeleton)

- **Goal:** lay down the project manifest and ignore rules so the repo is installable and
  every later ticket has a home.
- **Decision:** hand-author `package.json` rather than `nest new`. Dependency set —
  **NestJS 11** (core/platform-express/swagger), `better-sqlite3`, `class-validator` +
  `class-transformer`; dev toolchain (jest/ts-jest, supertest, ESLint 9 + Prettier,
  husky/lint-staged, typescript/ts-node). Scripts cover build/start, lint/format,
  `typecheck`, `test`, `test:integration`, and `prepare` (husky). `lint-staged` config inline.
- **Why:** a hand-written manifest keeps the scaffold minimal and intentional (no CLI cruft).
  `rxjs` is declared because Nest lists it as a *peer* dependency (the interceptor pipeline is
  Observable-based) — peers aren't auto-installed.
- **Security note:** initially pinned Nest 10; `npm install` then `npm audit` surfaced **25
  advisories** (7 high), all tracing to Nest 10's transitive tree (`file-type`, `glob`, `ajv`,
  `js-yaml`) and only patched in the **11.x** line. Rather than `audit fix --force` band-aids,
  bumped the whole stack to Nest 11 → **0 vulnerabilities**. Also dropped the `uuid` dependency
  in favour of Node 20's built-in `crypto.randomUUID()` (one fewer dep + its `@types`).
- **Tradeoff:** Nest 11 / ESLint 9 are current majors (ESLint 9 means flat config in A3).
- **Jest 30:** bumped jest 29 → 30 (current major) to modernise the test runner. Residual
  install-time *deprecation* warnings remain (`glob`/`inflight` via jest's coverage tooling
  `babel-plugin-istanbul → test-exclude@6`; `prebuild-install` via better-sqlite3). These are
  deep-transitive dev/build deps — not direct deps, not security advisories (audit still 0) —
  and the glob maintainer's blanket deprecation now even flags v10. Deliberately **not** chased
  with `overrides`: cosmetic gain, real risk to coverage tooling.
- **Outcome:** `.gitignore`, `package.json` (Nest 11, clean audit), README skeleton.
  `npm install` succeeds, `npm audit` reports 0 vulnerabilities. No app code yet — pure scaffold.

