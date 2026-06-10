# F2 — Per-role curl scripts

**Epic:** F — Tooling · **Branch:** `feat/f2-curl-scripts` · **Depends on:** F1

> Read `.llm/plan.md` for architectural context if needed.

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
Commit: `F2: per-role curl scripts`.
Run `make review`, then merge `feat/f2-curl-scripts` into `main` (`--no-ff`).
