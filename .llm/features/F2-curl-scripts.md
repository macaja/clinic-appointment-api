# F2 — Per-role curl scripts

**Epic:** F — Tooling · **Branch:** `feat/f-tooling` · **Depends on:** F1

> Read `docs/APPROACH.md` + `docs/tickets/README.md` first.

## Goal
Ready-to-run curl scripts demonstrating each endpoint as each role, for reviewers and the
Makefile role-helper targets (F3).

## Files (under `scripts/`)
- **`create-appointment.sh`** — `POST /appointments` with `X-Role: patient`; body with
  far-future ISO `start`/`end`; `BASE_URL` env (default `http://localhost:3000`). Echo the
  HTTP status.
- **`get-clinician-appointments.sh`** — `GET /clinicians/c1/appointments` with `X-Role: clinician`.
- **`get-all-appointments.sh`** — `GET /appointments` with `X-Role: admin`.
- **`forbidden-demo.sh`** (optional) — `GET /appointments` with `X-Role: patient` → expect 403.
- Make scripts executable; use `curl -sS -w '\n%{http_code}\n'` so the status is visible.

## Acceptance criteria
- [ ] With the server running + seeded, each script prints a sensible response + status
      (`201`/`200`/`409`/`403` as appropriate).

## On completion
Append F2 entry to `docs/APPROACH.md` §6. Commit: `F2: per-role curl scripts`.
