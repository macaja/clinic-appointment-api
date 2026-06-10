# A5 — Nest bootstrap + /health + `make review`

**Epic:** A — Scaffold · **Branch:** `feat/a-scaffold` · **Depends on:** A4

> Read `docs/APPROACH.md` + `docs/tickets/README.md` first.

## Goal
A minimal, bootable Nest app with a health endpoint, plus the `make review` target the dev
cycle relies on. This is the first runnable code and proves the whole toolchain works.

## Files to create
- **`src/app.module.ts`** — root module; for now imports a `HealthController`. (Providers/DI
  wiring for ports come in E6.)
- **`src/infra/http/health.controller.ts`** — `@Controller('health')`, `@Get()` returns
  `{ status: 'ok' }`.
- **`src/main.ts`** — `NestFactory.create(AppModule)`, listen on `process.env.PORT ?? 3000`,
  log the URL. (Global `ValidationPipe`, Swagger, logging interceptor, exception filter are
  added in Epic E — keep this minimal but leave a comment marking where they'll go.)
- **`Makefile`** — at least:
  ```make
  .PHONY: review lint test build typecheck
  review:  ## Lint + typecheck + tests + build + AI diff review vs main
  	npm run lint && npm run typecheck && npm test && npm run build
  	@git fetch -q origin || true
  	@git diff origin/main...HEAD 2>/dev/null | claude -p "Senior review: correctness, edge cases, clarity. Issues by file:line." || echo "(skip AI review: no claude CLI or no origin)"
  ```
  (Full target set — local-setup/seed/run + role helpers — is fleshed out in F3; keep `review`
  here so every later epic can use it.)

## Acceptance criteria
- [ ] `npm run build` compiles to `dist/`.
- [ ] `npm run start` boots; `GET http://localhost:3000/health` → `200 {"status":"ok"}`.
- [ ] `make review` runs the lint/typecheck/test/build chain (AI step may be skipped offline).

## Verification
```bash
npm run build
npm run start &   # or: npm run start:dev
sleep 2 && curl -s localhost:3000/health   # -> {"status":"ok"}
kill %1
```

## On completion
Append A5 entry to `docs/APPROACH.md` §6. Commit: `A5: Nest bootstrap + /health + make review`.
**Epic A done** → run `make review`, then merge `feat/a-scaffold` into `main` (`--no-ff`).
