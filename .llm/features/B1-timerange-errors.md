# B1 — `TimeRange` value object + domain errors (TDD)

**Epic:** B — Domain · **Branch:** `feat/b1-timerange-errors` · **Depends on:** A

> Read `.llm/plan.md` for architectural context if needed. This is the **core graded logic** —
> the overlap rule. Write tests FIRST.

## Goal
A pure, framework-free `TimeRange` value object that validates its bounds and implements the
canonical overlap rule, plus the domain error used to signal invalid ranges.

## Files
- **`src/domain/errors.ts`** — start the domain error set:
  - `InvalidTimeRangeError extends Error` (message e.g. `start must be strictly before end`).
  - (B2 will add `OverlapError` and `PastAppointmentError`.)
- **`src/domain/time-range.ts`** — `TimeRange`:
  - Construct from two `Date`s (or epoch-ms numbers) — pick one and be consistent; epoch-ms
    internally is convenient. Expose `start: Date`, `end: Date` (or `startMs`/`endMs`).
  - Constructor throws `InvalidTimeRangeError` if `start >= end` (covers zero & negative length).
  - `overlaps(other: TimeRange): boolean` ⇒ `this.start < other.end && this.end > other.start`.
- **`src/domain/time-range.spec.ts`** — tests first.

## TDD — write these cases first (the overlap truth table)
Given a base range `[10:00, 11:00)`:
- [ ] disjoint-before `[08:00,09:00)` → `false`
- [ ] disjoint-after `[12:00,13:00)` → `false`
- [ ] **touching at end** `[11:00,12:00)` (base.end === other.start) → `false` (allowed)
- [ ] **touching at start** `[09:00,10:00)` → `false` (allowed)
- [ ] partial overlap front `[09:30,10:30)` → `true`
- [ ] partial overlap back `[10:30,11:30)` → `true`
- [ ] containment (other inside base) `[10:15,10:45)` → `true`
- [ ] base inside other `[09:00,12:00)` → `true`
- [ ] identical `[10:00,11:00)` → `true`
- [ ] constructor throws on zero-length (`start === end`) → `InvalidTimeRangeError`
- [ ] constructor throws on negative (`start > end`) → `InvalidTimeRangeError`
- [ ] `overlaps` is symmetric (a.overlaps(b) === b.overlaps(a))

## Acceptance criteria
- [ ] All cases pass; `TimeRange` imports nothing from nest/infra.
- [ ] `npm test` green; `npm run lint` clean.

## On completion
Commit: `B1: TimeRange value object + overlap rule (TDD)`.
Run `make review`, then merge `feat/b1-timerange-errors` into `main` (`--no-ff`).
