# AGENTS.md — invariants and architectural guidelines

This file is read by any AI agent or model working on this codebase.
All rules here are **non-negotiable** unless the user explicitly overrides them in writing.

---

## Architecture invariants

### Hexagonal-lite layering

```
domain  ←  application  ←  infra
```

- `src/domain/` has **zero** imports from `application/` or `infra/`.
- `src/application/` imports domain types and port interfaces only — no `better-sqlite3`, no NestJS decorators, no HTTP types.
- `src/infra/` is the only layer allowed to import framework internals, the DB driver, or HTTP machinery.

Violating this boundary is never a quick fix — it is a design error.

### Database driver

Use **`better-sqlite3`** exclusively. Do not introduce TypeORM, Prisma, Knex, or any other ORM/query-builder.

Reason: synchronous API gives explicit transaction control. `db.transaction().immediate()` is how `BEGIN IMMEDIATE` is expressed — this is load-bearing for the race-condition guarantee.

### Concurrency-safe appointment creation

Overlap prevention lives in `src/infra/persistence/sqlite/sqlite-appointment.repository.ts` as a **single `BEGIN IMMEDIATE` transaction** that does a SELECT then INSERT atomically.

```
create.immediate(appt)   // acquires write lock before the check
```

**Do not** add `SELECT ... FOR UPDATE` — SQLite parses it silently but does not honour it, so it provides false safety. Document the real mechanism; do not hide it.

### Timestamp storage

- Stored in SQLite as `INTEGER` epoch-milliseconds (UTC).
- Parsed from ISO-8601 at the DTO boundary (`@IsISO8601` + `new Date(...).getTime()`).
- Serialised back to ISO-8601 in HTTP responses.
- **Never** store or compare raw ISO strings in the database.

### Overlap predicate

```typescript
overlaps(other: TimeRange): boolean {
  return this.start < other.end && this.end > other.start;
}
```

Touching at endpoints (`end === other.start`) is **allowed** — do not tighten this to `<=`.
This exact predicate drives the SQL range check:

```sql
WHERE clinicianId = ? AND startUtc < ? AND endUtc > ?
--                              ↑ appt.endUtc   ↑ appt.startUtc
```

Any change to the overlap definition must propagate to both the domain method and the SQL query, and must break the existing truth-table unit tests first (RED).

### Auto-create clinician/patient

Unknown `clinicianId` or `patientId` in a booking request triggers a stub insert, not a 400.
This is a deliberate tradeoff documented in `.llm/plan.md` — do not replace it with a lookup-or-400 without the user's explicit approval.

---

## HTTP contract invariants

| Endpoint | Allowed roles | Success code |
|---|---|---|
| `POST /appointments` | `patient`, `admin` | 201 |
| `GET /clinicians/:id/appointments` | `clinician`, `admin` | 200 |
| `GET /appointments` | `admin` only | 200 |

- Role is read from the `X-Role` header (fallback: `?role=` query param) by `RolesGuard`.
- Wrong role → **403**. Invalid body → **400**. Overlapping appointment → **409**.
- Do not change status codes without updating the integration tests.

---

## Domain validation rules

- `start` and `end` must be valid ISO-8601 datetimes.
- `start` must be strictly before `end` — zero and negative durations are rejected (`InvalidTimeRangeError`).
- `start` must be in the future — past appointments are rejected (`PastAppointmentError`).

---

## Development process

Follow `.llm/tdd.md` for every change that touches application logic or domain rules:

1. **RED** — write failing tests first. Do not write implementation in this phase.
2. **GREEN** — write the minimum code to make them pass.
3. **REFACTOR** — clean up; tests must stay green.

Never skip a phase. Never self-certify ("tests should pass") without actually running them.

### Test conventions

- Test names: `should [expected behaviour] when [condition]`
- Structure: Arrange → Act → Assert on separate lines.
- No `let` in tests — use `const` factory functions for fresh instances.
- No shared mutable state between tests (`beforeEach` with mutation is banned).
- Assert observable outputs only; never reach into private state.

---

## Forbidden patterns

| Pattern | Why forbidden |
|---|---|
| `SELECT ... FOR UPDATE` | SQLite silently ignores it — false safety |
| TypeORM / Prisma / any ORM | Breaks explicit transaction control; see driver decision |
| Mocking `better-sqlite3` in integration tests | Prior incident: mock/prod divergence masked broken behaviour |
| `git commit --no-verify` | Bypasses lint-staged; hook failures must be fixed, not skipped |
| `let` in tests | Shared mutable state between tests |
| Imperative loops where `map`/`filter`/`reduce` suffice | Code style; functional preferred |
| Importing infra modules from domain or application layers | Violates hexagonal-lite boundary |

---

## Project layout (quick reference)

```
src/
  domain/           value objects, entities, errors — no external deps
  application/
    ports/          repository interfaces
    use-cases/      orchestration; no HTTP/DB types
  infra/
    persistence/sqlite/   better-sqlite3 adapters
    http/           controllers, DTOs, guards, filters, interceptors
test/
  unit/             TimeRange, DTO validation
  application/      use cases with in-memory repos
  integration/      HTTP against containerised app (supertest)
.llm/
  plan.md           full architecture rationale
  tdd.md            TDD process rules
  features/         per-ticket specs (A1 … G2)
```

---

## Before marking a task done

1. Run the verification commands listed in the ticket (`.llm/features/<id>.md`).
2. Run `npm test` — all suites must be green.
3. Run `npm run lint` — zero errors.
4. Commit with the message format specified in the ticket.
