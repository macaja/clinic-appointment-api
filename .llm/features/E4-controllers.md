# E4 — Controllers (the three endpoints)

**Epic:** E — HTTP · **Branch:** `feat/e4-controllers` · **Depends on:** E3

> Read `.llm/plan.md` for architectural context if needed. Endpoints + roles + status codes
> are in the README tables. Controllers inject the **use-cases** (one per operation), not a
> service.

## Goal
Expose the three required endpoints, applying `@Roles(...)` + `RolesGuard`, mapping DTOs to
use-case inputs and entities to response JSON via `Appointment.toPrimitives()`.

## Files
- **`src/infra/http/appointments.controller.ts`** — `@Controller('appointments')`, guarded by
  `RolesGuard`:
  - `POST /` `@Roles('patient','admin')` → `CreateAppointment.execute(dto)` → `201` + appointment JSON.
  - `GET /` `@Roles('admin')` → `ListAllAppointments.execute(query)` → `200` + array.
    Parse `from`/`to` query strings to `Date`; pass `limit`/`offset`.
- **`src/infra/http/clinicians.controller.ts`** — `@Controller('clinicians')`:
  - `GET /:id/appointments` `@Roles('clinician','admin')` →
    `ListClinicianAppointments.execute({ clinicianId: id, from, to })` → `200` + array.
- Use `@HttpCode(201)` on POST (Nest defaults POST to 201 already, but be explicit).
- Add Swagger decorators (`@ApiTags`, `@ApiHeader('X-Role')`, `@ApiResponse`) — E6 turns Swagger on.
- Constructor-inject the use-cases by their tokens (providers wired in E6).

## Acceptance criteria
- [ ] Endpoints route correctly; roles enforced (wrong role → 403).
- [ ] Compiles; lint clean. Full behaviour verified in G1.

## On completion
Commit: `E4: appointments + clinicians controllers`.
Run `make review`, then merge `feat/e4-controllers` into `main` (`--no-ff`).
