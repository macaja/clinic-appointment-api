# E2 — RolesGuard + @Roles decorator (auth simulation)

**Epic:** E — HTTP · **Branch:** `feat/e-http` · **Depends on:** E1

> Read `docs/APPROACH.md` + `docs/tickets/README.md` first. Follows the Nest authorization/RBAC
> pattern (https://docs.nestjs.com/security/authorization).

## Goal
Simulate auth via an `X-Role` header (fallback `?role=`) and enforce the role→endpoint matrix.

## Files
- **`src/infra/http/auth/role.ts`** — `export type Role = 'patient' | 'clinician' | 'admin';`
- **`src/infra/http/auth/roles.decorator.ts`** — `export const ROLES_KEY = 'roles';`
  `export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);`
- **`src/infra/http/auth/roles.guard.ts`** — `@Injectable() RolesGuard implements CanActivate`:
  - read required roles via `Reflector.getAllAndOverride(ROLES_KEY, [handler, class])`.
  - if none required → allow.
  - resolve the caller role from `req.headers['x-role']` (or `req.query.role`).
  - missing role → `ForbiddenException` (403); role not in required set → `403`.
  - (Optionally validate the value is a known `Role`.)
- **`...roles.guard.spec.ts`** — unit test the guard with a mocked `ExecutionContext`:
  allowed role passes; wrong role throws; missing role throws; no-metadata allows.

## Acceptance criteria
- [ ] Guard unit tests green; lint/typecheck clean. (Applied to controllers in E4; registered
      per-controller or globally with `Reflector` — decide in E4/E6.)

## On completion
Append E2 entry to `docs/APPROACH.md` §6. Commit: `E2: RolesGuard + @Roles decorator (X-Role)`.
