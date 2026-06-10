# C3 — `ListClinicianAppointments` use-case (TDD)

**Epic:** C — Application · **Branch:** `feat/c3-list-clinician` · **Depends on:** C2

> Read `.llm/plan.md` for architectural context if needed. Write tests FIRST.
> Application layer uses **one class per operation** (use-cases), not a shared service —
> see `.llm/plan.md` §6 (C-epic decision).

## Goal
Return a clinician's **upcoming** appointments, defaulting to `start >= now`, or within an
explicit `from`/`to` window.

## Files
- **`src/application/use-cases/list-clinician-appointments.use-case.ts`**
  - Deps: `AppointmentRepository`, `Clock` (only what it needs — no people-repo).
  - `execute(input: { clinicianId: string; from?: Date; to?: Date }): Promise<Appointment[]>`:
    - If `from` is undefined, default it to `clock.now()` (upcoming-only).
    - Delegate to `appointmentRepo.findUpcomingByClinician(clinicianId, { from, to })`.
    - Results sorted by `start` ascending (sort in the use-case if the repo doesn't guarantee it).
- **`...spec.ts`** with in-memory fake + `FixedClock`.

## TDD — write these first
- [ ] default window: past appointments excluded; only `start >= now` returned.
- [ ] explicit `from`/`to`: only appointments within the window returned.
- [ ] only the requested clinician's appointments returned.
- [ ] results sorted ascending by start.

## Acceptance criteria
- [ ] `npm test` green; `npm run lint` clean.

## On completion
Commit: `C3: ListClinicianAppointments use-case (TDD)`.
Run `make review`, then merge `feat/c3-list-clinician` into `main` (`--no-ff`).
