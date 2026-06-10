# D3 — `SqliteAppointmentRepository` + concurrency (the core)

**Epic:** D — Persistence · **Branch:** `feat/d-persistence` · **Depends on:** D2

> Read `.llm/plan.md` for architectural context if needed. This is where the **race-condition
> -safe overlap prevention** lives — the headline requirement.

## Goal
Implement `AppointmentRepository` against SQLite, with overlap detection done inside a
`BEGIN IMMEDIATE` transaction so concurrent bookings can't both insert.

## Files
- **`src/infra/persistence/sqlite/sqlite-appointment.repository.ts`**
  - `implements AppointmentRepository`; constructor takes the `Database`.
  - **`createOverlapSafe(appt)`** — use `better-sqlite3`'s transaction, run as **immediate**:
    ```ts
    const txn = this.db.transaction((a) => {
      const clash = this.clashStmt.get(a.clinicianId, a.endMs, a.startMs); // startUtc < end AND endUtc > start
      if (clash) throw new OverlapError();
      this.insertStmt.run({ id, clinicianId, patientId, startUtc, endUtc, createdAt });
      return a;
    });
    txn.immediate(appt);          // BEGIN IMMEDIATE acquires the write lock up-front
    ```
    Clash query: `SELECT 1 FROM appointment WHERE clinicianId = ? AND startUtc < ? AND endUtc > ? LIMIT 1`
    (`?2 = endMs`, `?3 = startMs`) — this is the canonical overlap predicate; touching is allowed.
  - **`findUpcomingByClinician(clinicianId, {from,to})`** — `WHERE clinicianId = ? AND startUtc >= ?`
    (+ optional `AND startUtc <= ?` for `to`), `ORDER BY startUtc ASC`. Default `from` already
    applied by the use-case, but guard here too.
  - **`findAllUpcoming({from,to},{limit,offset})`** — `WHERE startUtc >= ?` (+ optional `to`),
    `ORDER BY startUtc ASC LIMIT ? OFFSET ?` (sane defaults, e.g. limit 100).
  - A **mapper** row⇄`Appointment` (epoch-ms INTEGER ⇄ `Date`/`TimeRange`).
- **`...repository.spec.ts`** — against `:memory:` db.

## TDD / tests
- [ ] create then read back returns the appointment (ids + ISO times correct).
- [ ] inserting an overlapping window for the same clinician throws `OverlapError`.
- [ ] touching at endpoints (`newStart === existingEnd`) succeeds.
- [ ] a different clinician at the same time succeeds.
- [ ] `findUpcomingByClinician` excludes past + other clinicians, sorted ascending.
- [ ] `findAllUpcoming` respects `from`/`to` + `limit`/`offset`.
- [ ] **concurrency note test:** two sequential `createOverlapSafe` calls with overlapping
      windows → first succeeds, second throws `OverlapError` (documents the serialized guard;
      `better-sqlite3` is synchronous so true parallelism is simulated, and the README explains
      `BEGIN IMMEDIATE` is what protects multi-connection/multi-process callers).

## Acceptance criteria
- [ ] All tests green; lint clean. The overlap predicate matches B1's rule exactly.

## On completion
Append D3 entry to `.llm/plan.md` §6 (include the concurrency explanation).
Commit: `D3: SqliteAppointmentRepository + BEGIN IMMEDIATE overlap guard`.
**Epic D done** → `make review`, merge `feat/d-persistence` into `main`.
