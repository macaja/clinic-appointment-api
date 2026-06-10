# F3 — Makefile (setup + run + role helpers)

**Epic:** F — Tooling · **Branch:** `feat/f-tooling` · **Depends on:** F2

> Read `.llm/plan.md` for architectural context if needed. The `review` target already exists
> from A5 — extend, don't duplicate.

## Goal
One-keystroke targets for setup, running, testing, and exercising each role locally (the names
the user asked for).

## Targets (extend the existing `Makefile`)
- `local-setup` — `npm ci` (or `npm install`).
- `local-seed` — run the F1 seed runner.
- `local-run` — `npm run start` (or `start:dev`).
- `local-create-appointment` — `bash scripts/create-appointment.sh` (patient).
- `local-clinician-get-appointments` — `bash scripts/get-clinician-appointments.sh`.
- `local-admin-get-appointments` — `bash scripts/get-all-appointments.sh`.
- `lint` / `format` / `typecheck` / `test` — thin wrappers over npm scripts.
- `test-integration` — `npm run test:integration` (G1).
- `review` — already defined (A5).
- Add a `help` target that greps `##` comments (nice-to-have).
- Mark all `.PHONY`.

## Acceptance criteria
- [ ] `make help` lists targets; `make local-admin-get-appointments` works against a running,
      seeded server.

## On completion
Commit: `F3: Makefile (setup, run, role helpers)`.
