# C1 — Ports, in-memory fakes & Clock

**Epic:** C — Application · **Branch:** `feat/c1-ports-fakes-clock` · **Depends on:** B

> Read `.llm/plan.md` for architectural context if needed.

## Goal
Define the application **ports** (interfaces the use-cases depend on), a deterministic `Clock`
port, and in-memory fakes used by the use-case specs in C2–C4. No SQLite here — that's Epic D.

## Files
- **`src/application/ports/clock.port.ts`**
  - `interface Clock { now(): Date }` + token `export const CLOCK = 'CLOCK';`
  - `SystemClock implements Clock` (returns `new Date()`).
- **`src/application/ports/appointment-repository.port.ts`**
  - `interface DateRange { from?: Date; to?: Date }` and `interface Page { limit?: number; offset?: number }`.
  - `interface AppointmentRepository {`
    - `createOverlapSafe(appt: Appointment): Promise<Appointment>` — **must** atomically reject
      overlaps for the same clinician by throwing `OverlapError` (impl in D3);
    - `findUpcomingByClinician(clinicianId: string, range: DateRange): Promise<Appointment[]>`;
    - `findAllUpcoming(range: DateRange, page: Page): Promise<Appointment[]>` `}`
  - token `export const APPOINTMENT_REPOSITORY = 'APPOINTMENT_REPOSITORY';`
- **`src/application/ports/people-repository.port.ts`**
  - `interface PeopleRepository { ensureClinician(id: string): Promise<void>; ensurePatient(id: string): Promise<void> }`
    (auto-create stub if absent — see `.llm/plan.md` decision).
  - token `export const PEOPLE_REPOSITORY = 'PEOPLE_REPOSITORY';`
- **`test/support/in-memory-appointment.repository.ts`** — array-backed fake implementing the
  overlap check in JS (using `TimeRange.overlaps`) and the upcoming/range/paging filters.
- **`test/support/in-memory-people.repository.ts`** — Set-backed fake recording ensured ids.
- **`test/support/fixed-clock.ts`** — `FixedClock implements Clock` returning a constant `Date`.

## Acceptance criteria
- [ ] Interfaces + tokens compile; fakes implement them. `npm run typecheck` + `npm run lint` clean.
- [ ] No domain/infra rule violations (application imports `domain`, not `infra`).

## On completion
Commit: `C1: application ports, Clock, in-memory fakes`.
Run `make review`, then merge `feat/c1-ports-fakes-clock` into `main` (`--no-ff`).
