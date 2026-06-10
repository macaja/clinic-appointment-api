# E3 — Domain → HTTP exception filter

**Epic:** E — HTTP · **Branch:** `feat/e-http` · **Depends on:** E2

> Read `.llm/plan.md` for architectural context if needed.

## Goal
Translate domain errors into the correct HTTP status + a sensible JSON error body, keeping the
domain/use-case layers free of HTTP concerns.

## Files
- **`src/infra/http/domain-exception.filter.ts`** — `@Catch(InvalidTimeRangeError,
  PastAppointmentError, OverlapError) DomainExceptionFilter implements ExceptionFilter`:
  - map per the table in `.llm/features/README.md`:
    - `OverlapError` → **409**
    - `InvalidTimeRangeError`, `PastAppointmentError` → **400**
  - response body: `{ statusCode, error, message }` (use the error's `.message`).
- Register globally in `src/main.ts`: `app.useGlobalFilters(new DomainExceptionFilter())`
  (replace the A5 marker). Order: this filter handles domain errors; Nest's default handles
  `HttpException` (validation `400`, guard `403`).
- **`...domain-exception.filter.spec.ts`** — optional unit test mapping each error to its status.

## Acceptance criteria
- [ ] Booking an overlap returns `409` with a clear message (verified in G1).
- [ ] Invalid range / past returns `400`. typecheck + lint clean.

## On completion
Commit: `E3: domain→HTTP exception filter`.
