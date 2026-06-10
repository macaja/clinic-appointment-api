# E1 — DTOs + global ValidationPipe

**Epic:** E — HTTP · **Branch:** `feat/e1-dtos-validation` · **Depends on:** D

> Read `.llm/plan.md` for architectural context if needed.

## Goal
Request DTOs with `class-validator` rules and a global `ValidationPipe`, so malformed input is
rejected with `400` before reaching the use-cases. Add Swagger property decorators for E6.

## Files
- **`src/infra/http/dto/create-appointment.dto.ts`**
  - `clinicianId: string` (`@IsString() @IsNotEmpty()`), `patientId` same.
  - `start: string`, `end: string` — `@IsISO8601()` (with `strict`), `@IsNotEmpty()`.
  - `@ApiProperty(...)` on each (E6 enables Swagger; importing the decorator now is fine).
- **`src/infra/http/dto/list-query.dto.ts`**
  - `from?: string`, `to?: string` — `@IsOptional() @IsISO8601()`.
  - `limit?: number`, `offset?: number` — `@IsOptional() @Type(() => Number) @IsInt() @Min(...)`.
- **`src/main.ts`** — register the global pipe:
  `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }))`.
  (Replace the A5 "// pipes go here" marker.)

## Tests
- Covered end-to-end in G1 (a malformed body → 400). Optionally a small unit test validating the
  DTO with `class-validator`'s `validate()`.

## Acceptance criteria
- [ ] App still boots; a request with a non-ISO `start` is rejected `400` (verify after E4, or in G1).
- [ ] `npm run typecheck` + `npm run lint` clean.

## On completion
Commit: `E1: request DTOs + global ValidationPipe`.
Run `make review`, then merge `feat/e1-dtos-validation` into `main` (`--no-ff`).
