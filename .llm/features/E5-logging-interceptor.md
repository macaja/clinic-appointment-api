# E5 — Logging interceptor + logger

**Epic:** E — HTTP · **Branch:** `feat/e-http` · **Depends on:** E4

> Read `.llm/plan.md` for architectural context if needed. Observability is called out as
> important.

## Goal
Structured request logging: method, path, status, duration, and a correlation id per request.

## Files
- **`src/infra/http/logging.interceptor.ts`** — `@Injectable() LoggingInterceptor implements
  NestInterceptor`:
  - generate/propagate a correlation id: read `x-correlation-id` header or
    `crypto.randomUUID()`; set it on the response header too.
  - `return next.handle().pipe(tap({ next/error }))` logging
    `"<method> <url> <status> <ms>ms cid=<id>"` via Nest `Logger`. (This is the rxjs `tap`
    referenced in A1's note.)
- Register globally in `src/main.ts` (`app.useGlobalInterceptors(new LoggingInterceptor())`)
  replacing the A5 marker.
- **`...logging.interceptor.spec.ts`** — optional: assert the logger is called once with status
  + duration for a mocked `CallHandler`.

## Acceptance criteria
- [ ] Requests emit a single structured log line with duration + correlation id.
- [ ] typecheck + lint clean; app still boots.

## On completion
Commit: `E5: logging interceptor + correlation id`.
