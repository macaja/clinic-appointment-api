# B2 — `Appointment` entity + remaining domain errors (TDD)

**Epic:** B — Domain · **Branch:** `feat/b-domain` · **Depends on:** B1

> Read `.llm/plan.md` for architectural context if needed.

## Goal
The `Appointment` domain entity (clinician + patient + time range) and the remaining domain
errors. Pure domain — no framework imports.

## Files
- **`src/domain/errors.ts`** — add:
  - `OverlapError extends Error` (e.g. `requested time overlaps an existing appointment for this clinician`).
  - `PastAppointmentError extends Error` (e.g. `appointment cannot start in the past`).
- **`src/domain/appointment.ts`** — `Appointment`:
  - Fields: `id: string`, `clinicianId: string`, `patientId: string`, `range: TimeRange`,
    `createdAt: Date`.
  - Static factory `Appointment.create({ clinicianId, patientId, range, now, id? })`:
    - `id` defaults to `crypto.randomUUID()`.
    - `createdAt` defaults to `now` (passed in for determinism — see Clock in C1).
    - (Past-time validation belongs in the use-case C2 via the Clock, not here — keep the
      entity about identity/structure. Document this choice.)
  - A `toPrimitives()`/`toJSON()` helper returning `{ id, clinicianId, patientId, start, end,
    createdAt }` with `start`/`end`/`createdAt` as **ISO-8601 strings** (response shape).
- **`src/domain/appointment.spec.ts`** — tests first.

## TDD — write these first
- [ ] `create` assigns a uuid id when none provided; uses provided id when given.
- [ ] `create` stores clinicianId, patientId, range, createdAt.
- [ ] `toPrimitives()` emits ISO-8601 strings for start/end/createdAt and the ids.

## Acceptance criteria
- [ ] Domain stays framework-free; `npm test` green; `npm run lint` clean.

## On completion
Commit: `B2: Appointment entity + domain errors (TDD)`.
**Epic B done** → `make review`, merge `feat/b-domain` into `main`.
