# Tickets — Clinic Appointment System

These are **self-contained work units**. Each ticket file has enough context to be executed in
a fresh Claude Code (or human) session without the originating conversation.

## How to run a ticket in a fresh context

1. Open Claude Code in the repo root (`clinic-appointment-api`).
2. Tell it: `implement <TICKET>` (e.g. `implement A4`).
   CLAUDE.md instructs Claude to read `.llm/features/<id>.md` automatically.
3. Review the diff, run the ticket's **Verification**, then commit with the ticket's message.

`.llm/plan.md` is the architectural reference — key decisions, schema, overlap rule, role matrix,
and build sequence. Claude reads it when a ticket needs cross-cutting context.

## Ground rules (apply to every ticket)

- **Stack:** NestJS 11 + TypeScript + SQLite (`better-sqlite3`). Node ≥ 20. Jest 30.
- **Architecture:** pragmatic hexagonal-lite. `domain/` (pure, no framework), `application/`
  (use-cases depend on **ports** = interfaces), `infra/` (adapters: sqlite + http).
  Dependencies point inward; the domain imports nothing from infra/nest.
- **One feature branch per epic**, branched off `main` after the previous epic merged.
  Branches: `feat/a-scaffold`, `feat/b-domain`, `feat/c-usecases`, `feat/d-persistence`,
  `feat/e-http`, `feat/f-tooling`, `feat/g-integration`.
- **TDD tickets:** write the failing test(s) first, then the implementation. The test encodes
  the spec.
- **Test placement:** unit + application specs are **co-located** as `*.spec.ts` next to the
  source (Nest convention); integration specs live in `test/integration/*.e2e-spec.ts`.
- **IDs / time:** entity ids are strings via Node's `crypto.randomUUID()` (no `uuid` dep).
  Timestamps are stored as **INTEGER epoch-millis (UTC)** and serialized as **ISO-8601** in
  responses. "now" comes from an injectable **`Clock`** port so time is deterministic in tests.
- **DI tokens:** ports are injected via string tokens (e.g. `APPOINTMENT_REPOSITORY`)
  exported next to the interface; adapters are bound in `app.module.ts` (ticket E6).

### Canonical overlap rule (the graded behaviour)
Two ranges overlap iff `aStart < bEnd && aEnd > bStart`. Touching endpoints is **allowed**
(`aEnd === bStart` ⇒ no overlap). Zero/negative-length ranges are invalid.

### Error → HTTP status map (wired in E3)
| Domain error | HTTP |
|---|---|
| `InvalidTimeRangeError` | 400 |
| `PastAppointmentError` | 400 |
| `OverlapError` | 409 |
| (validation pipe / bad body) | 400 |
| (wrong `X-Role`) | 403 |

### Role → endpoint matrix (wired in E2/E4)
| Endpoint | Roles |
|---|---|
| `POST /appointments` | patient, admin |
| `GET /clinicians/:id/appointments` | clinician, admin |
| `GET /appointments` | admin |

## Ticket list & dependencies

| Epic | Ticket | Depends on |
|------|--------|-----------|
| A — Scaffold | A1 scaffold ✅ done · A2 ts/nest/jest config · A3 eslint+prettier · A4 husky hooks · A5 bootstrap+health+make review | sequential |
| B — Domain (TDD) | B1 TimeRange + errors · B2 Appointment entity | A merged |
| C — Application (TDD) | C1 ports + fakes + Clock · C2 CreateAppointment · C3 ListClinician · C4 ListAll | B merged |
| D — Persistence | D1 db+schema · D2 SqlitePeopleRepository · D3 SqliteAppointmentRepository (concurrency) | C merged |
| E — HTTP | E1 DTOs+ValidationPipe · E2 RolesGuard · E3 exception filter · E4 controllers · E5 logging · E6 swagger+DI wiring | D merged |
| F — Tooling | F1 seed · F2 curl scripts · F3 Makefile · F4 Docker · F5 CI | E merged |
| G — Integration+docs | G1 integration tests · G2 README | F merged |

Within an epic, do tickets in order (later ones build on earlier).
