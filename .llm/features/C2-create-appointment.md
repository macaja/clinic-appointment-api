# C2 — `CreateAppointment` use-case (TDD)

**Epic:** C — Application · **Branch:** `feat/c-usecases` · **Depends on:** C1

> Read `.llm/plan.md` for architectural context if needed. Write tests FIRST.

## Goal
The booking use-case: validate the time range, reject past appointments, auto-create the
clinician/patient, and persist via the overlap-safe repository.

## Files
- **`src/application/use-cases/create-appointment.use-case.ts`**
  - Constructor deps (by token): `AppointmentRepository`, `PeopleRepository`, `Clock`.
  - `execute(input: { clinicianId, patientId, start: string|Date, end: string|Date }): Promise<Appointment>`:
    1. Parse `start`/`end` → build `TimeRange` (throws `InvalidTimeRangeError` on bad bounds).
       Parsing of malformed ISO is handled at the DTO layer (E1); here assume valid Date input
       but still guard the range invariant.
    2. If `range.start < clock.now()` → throw `PastAppointmentError`.
    3. `await peopleRepo.ensureClinician(clinicianId)` + `ensurePatient(patientId)`.
    4. Build `Appointment.create({...})` and `return appointmentRepo.createOverlapSafe(appt)`.
- **`src/application/use-cases/create-appointment.use-case.spec.ts`** — use the in-memory fakes
  + `FixedClock` from C1.

## TDD — write these first
- [ ] success: returns a persisted appointment with an id; people were ensured.
- [ ] overlap: when the fake already holds an overlapping appt for the clinician →
      rejects with `OverlapError`.
- [ ] touching is allowed: an appt starting exactly at an existing one's end → succeeds.
- [ ] past: `start` before `clock.now()` → `PastAppointmentError`.
- [ ] invalid range: `start >= end` → `InvalidTimeRangeError`.
- [ ] auto-create: unknown clinician/patient ids are ensured (no error).

## Acceptance criteria
- [ ] `npm test` green; `npm run lint` clean; use-case depends only on ports + domain.

## On completion
Commit: `C2: CreateAppointment use-case (TDD)`.
