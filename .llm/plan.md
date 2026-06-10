# Clinic Appointment System — Implementation Plan

## Context

This is a take-home coding challenge from Lyrebird Health: a small RESTful API powering a
simplified clinic appointment system. Patients book appointments, clinicians view their
schedules, admins list all upcoming appointments. The challenge is **timeboxed to 3–4 hours**
and explicitly grades **correctness, code clarity, and reasonable validation over bells &
whistles**. The single hardest requirement is **preventing overlapping appointments for the
same clinician** (race-condition-safe), with a precise overlap definition.

We build greenfield in a new folder under `~/Downloads`. Stack: **NestJS + TypeScript +
SQLite**, organized as **pragmatic hexagonal-lite** so future SMS/email/payment/analytics
adapters have a clear seam without over-engineering a one-aggregate domain.

The plan honors decisions confirmed with the user:
- **Architecture:** pragmatic hexagonal-lite (no CQRS/event-bus).
- **Schema:** three tables + FKs (`clinician`, `patient`, `appointment`).
- **Tooling:** core kit (ESLint/Prettier, Swagger, Makefile, curl scripts, seed SQL, X-Role
  guard) + git hooks + containerized integration tests + GitHub Actions CI.

## Key technical decisions

- **SQLite driver: `better-sqlite3`** (not TypeORM/Prisma). Synchronous, simple, and gives
  *explicit* transaction control. Critically, it lets us open a transaction as
  `BEGIN IMMEDIATE` to serialize the check-then-insert. TypeORM's pessimistic lock maps to
  `SELECT ... FOR UPDATE`, **which SQLite silently does not support** — using it would be
  misleading. We avoid that trap and document the real mechanism instead.
- **Timestamps stored as INTEGER epoch-millis (UTC)**; serialized back to ISO-8601 in
  responses. Gives unambiguous comparisons and clean range indexing. ISO parsing/validation
  happens at the DTO boundary.
- **Overlap is NOT enforceable by a UNIQUE constraint** (it's a range predicate, not
  equality). The mechanism is a transactional check inside `BEGIN IMMEDIATE`. A composite
  index `(clinicianId, startUtc, endUtc)` keeps the overlap query fast.
- **Auto-create clinician/patient** on first reference (the challenge offers this) so the
  booking flow never 400s on an unknown id. Documented as a tradeoff.

## Architecture / folder layout

```
clinic-appointment-system/
  src/
    domain/
      time-range.ts            # value object: start<end, overlaps(other), positive length
      appointment.ts           # entity
      errors.ts                # OverlapError, InvalidTimeRangeError, PastAppointmentError
    application/
      ports/
        appointment-repository.port.ts   # interface (port)
        people-repository.port.ts        # clinician/patient lookup + auto-create
      use-cases/
        create-appointment.use-case.ts
        list-clinician-appointments.use-case.ts
        list-all-appointments.use-case.ts
    infra/
      persistence/
        sqlite/
          db.ts                 # better-sqlite3 connection + schema bootstrap
          schema.sql
          sqlite-appointment.repository.ts   # adapter; BEGIN IMMEDIATE txn lives here
          sqlite-people.repository.ts
      http/
        appointments.controller.ts         # POST /appointments, GET /appointments
        clinicians.controller.ts           # GET /clinicians/:id/appointments
        dto/                               # CreateAppointmentDto, query DTOs (class-validator)
        guards/roles.guard.ts              # reads X-Role (and ?role=)
        decorators/roles.decorator.ts
        interceptors/logging.interceptor.ts
      observability/logger.ts
    app.module.ts
    main.ts                                # ValidationPipe, Swagger at /docs, logger
  test/
    unit/                                  # TimeRange overlap table, validation
    application/                           # use cases with in-memory repos
    integration/                           # HTTP against containerized app (supertest)
  scripts/                                 # curl scripts per role
  seed/
    test-data.sql                          # clinicians/patients + overlapping scenarios
  Dockerfile
  docker-compose.yml
  Makefile
  .github/workflows/ci.yml
  .husky/pre-commit
  .eslintrc / .prettierrc / tsconfig / nest-cli.json
  README.md
```

## Data model (schema.sql)

```sql
CREATE TABLE IF NOT EXISTS clinician (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL DEFAULT '',
  email TEXT UNIQUE
);
CREATE TABLE IF NOT EXISTS patient (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL DEFAULT '',
  email TEXT UNIQUE
);
CREATE TABLE IF NOT EXISTS appointment (
  id          TEXT PRIMARY KEY,
  clinicianId TEXT NOT NULL REFERENCES clinician(id),
  patientId   TEXT NOT NULL REFERENCES patient(id),
  startUtc    INTEGER NOT NULL,   -- epoch ms
  endUtc      INTEGER NOT NULL,
  createdAt   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_appt_clinician_time
  ON appointment(clinicianId, startUtc, endUtc);
```
`PRAGMA foreign_keys = ON;` set on connection.

## Domain logic — overlap (the core requirement)

`TimeRange.overlaps(other)` ⇒ `this.start < other.end && this.end > other.start`.
Touching at endpoints is **allowed** (`end == other.start` ⇒ not overlapping). This exact
predicate is the spec, so it's the first thing built test-first.

## Concurrency-safe creation

In `sqlite-appointment.repository.ts`, creation runs inside a single immediate transaction:

```
const create = db.transaction((appt) => {
  const clash = db.prepare(
    `SELECT 1 FROM appointment
     WHERE clinicianId = ? AND startUtc < ? AND endUtc > ? LIMIT 1`
  ).get(appt.clinicianId, appt.endUtc, appt.startUtc);
  if (clash) throw new OverlapError();
  db.prepare(`INSERT INTO appointment (...) VALUES (...)`).run(appt);
});
create.immediate(appt);   // BEGIN IMMEDIATE — acquires write lock up front
```
`create.immediate(...)` serializes concurrent bookers: the second waits for the first to
commit, then re-reads and sees the clash → 409. README documents this as the race-condition
strategy (SQLite single-writer + IMMEDIATE write lock; `FOR UPDATE` explicitly not applicable).

## API, roles, status codes

| Endpoint | Roles allowed | Notes |
|---|---|---|
| `POST /appointments` | patient, admin | body `{ clinicianId, patientId, start, end }` |
| `GET /clinicians/:id/appointments` | clinician, admin | optional `from`/`to`; default `start >= now` |
| `GET /appointments` | **admin only** | optional `from`/`to`, `limit`/`offset` |

`RolesGuard` reads `X-Role` header (fallback `?role=`); `@Roles(...)` decorator per route.
Status codes: `201` create ok · `409` overlap · `400` invalid input · `403` wrong role ·
`200` lists.

## Validation rules (DTO + domain)

- `start`/`end` valid ISO datetimes (class-validator `@IsISO8601`).
- `start` strictly before `end`; zero/negative length rejected (domain `TimeRange`).
- Past appointments rejected (challenge: optional-but-recommended → include, 400).
- Unknown clinician/patient → auto-created stub (no 400).
- Global `ValidationPipe({ whitelist:true, transform:true })`; domain errors mapped to
  HTTP via an exception filter (OverlapError→409, others→400).

## Observability & tooling

- **Logging:** Nest `Logger` + `LoggingInterceptor` (method, path, status, duration,
  correlation id).
- **Swagger** at `/docs` via `@nestjs/swagger`.
- **ESLint + Prettier**; **Husky `pre-commit`** → `lint-staged` (eslint --fix + prettier).
- **Makefile targets:** `local-setup`, `local-run`, `local-seed`, `lint`, `format`, `test`,
  `test-integration`, plus role helpers `local-patient-create-appointment`,
  `local-clinician-get-appointments`, `local-admin-get-appointments` (call `scripts/*.sh`).
- **curl scripts** in `scripts/` per role.
- **Docker:** `Dockerfile` (node, builds + runs Nest) and `docker-compose.yml` mounting a
  SQLite volume. Integration tests build+run this and hit it over HTTP.
- **CI:** `.github/workflows/ci.yml` → install, lint, unit/application tests, integration.

## Testing (TDD — built test-first, in this order)

Each step: write failing test → implement → green. Surfaced to the user step by step.

1. **Unit `TimeRange`** — the overlap truth table: disjoint, touching-at-end (allowed),
   partial front/back, containment, identical, zero/negative length.
2. **Unit validation** — DTO ISO parsing, start<end, past rejection.
3. **Application `CreateAppointment`** (in-memory repo) — success, overlap→OverlapError,
   auto-create clinician/patient.
4. **Application list use-cases** — `start >= now` default, `from`/`to` filtering.
5. **Integration (containerized, the 4 challenge-required scenarios)** via supertest against
   the running container: (a) create appointment, (b) reject overlapping (409),
   (c) list clinician appointments, (d) date-range filtering.

## README.md

Run instructions (npm + Docker), per-role curl examples, role/status-code matrix, the
concurrency/race-condition note, and a Design decisions / tradeoffs section (driver choice,
epoch-ms storage, auto-create, why no UNIQUE constraint for overlap, hexagonal-lite rationale,
what was cut for the timebox).

## Build sequence

1. `git init`, scaffold Nest project + tsconfig/eslint/prettier, install deps
   (`better-sqlite3`, `class-validator`, `@nestjs/swagger`, `uuid`; dev: `supertest`, `husky`,
   `lint-staged`).
2. Domain layer test-first (`TimeRange`, `Appointment`, errors).
3. Ports + application use-cases test-first with in-memory repos.
4. SQLite adapters (`db.ts`, `schema.sql`, repos) incl. the IMMEDIATE transaction.
5. HTTP layer: controllers, DTOs, `RolesGuard`, exception filter, logging interceptor.
6. `main.ts`: ValidationPipe, Swagger, logger.
7. Tooling: Makefile, scripts, seed SQL, Husky, Dockerfile/compose, CI workflow.
8. README.

## Verification (end-to-end)

- `make local-setup && make local-seed && make local-run` → server up, Swagger at `/docs`.
- `make local-patient-create-appointment` → 201; re-run overlapping window → **409**.
- `make local-clinician-get-appointments` → clinician's upcoming list; add `from`/`to`.
- `make local-admin-get-appointments` (X-Role: admin) → all upcoming; non-admin role → 403.
- `make test` → unit + application green (overlap truth table is the key one).
- `make test-integration` → container spins up, 4 required scenarios pass.
