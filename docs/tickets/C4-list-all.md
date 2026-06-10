# C4 — `ListAllAppointments` use-case (TDD)

**Epic:** C — Application · **Branch:** `feat/c-usecases` · **Depends on:** C3

> Read `docs/APPROACH.md` + `docs/tickets/README.md` first. Write tests FIRST.
> One class per operation (use-case), per the C-epic decision in `docs/APPROACH.md` §6.

## Goal
Admin listing of **all** upcoming appointments, with optional `from`/`to` range and optional
`limit`/`offset` pagination.

## Files
- **`src/application/use-cases/list-all-appointments.use-case.ts`**
  - Deps: `AppointmentRepository`, `Clock`.
  - `execute(input: { from?: Date; to?: Date; limit?: number; offset?: number }): Promise<Appointment[]>`:
    - Default `from` to `clock.now()` when absent.
    - Delegate to `appointmentRepo.findAllUpcoming({ from, to }, { limit, offset })`.
    - Sorted ascending by start.
- **`...spec.ts`** with in-memory fake + `FixedClock`.

## TDD — write these first
- [ ] default window excludes past appointments.
- [ ] `from`/`to` filtering across multiple clinicians.
- [ ] `limit` caps result count; `offset` skips.
- [ ] sorted ascending by start.

## Acceptance criteria
- [ ] `npm test` green; `npm run lint` clean.

## On completion
Append C4 entry to `docs/APPROACH.md` §6. Commit: `C4: ListAllAppointments use-case (TDD)`.
**Epic C done** → `make review`, merge `feat/c-usecases` into `main`.
