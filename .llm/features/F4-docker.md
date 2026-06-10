# F4 — Dockerfile + docker-compose

**Epic:** F — Tooling · **Branch:** `feat/f-tooling` · **Depends on:** F3

> Read `.llm/plan.md` for architectural context if needed. The container is also the target
> the integration tests run against (G1).

## Goal
A reproducible container build + a compose service with a persisted SQLite volume.

## Files
- **`Dockerfile`** — multi-stage:
  - `builder`: `node:20-slim` (or `-alpine` with build deps for `better-sqlite3` — note that
    alpine needs `python3 make g++`; slim is simpler). `npm ci`, copy src, `npm run build`.
  - `runner`: `node:20-slim`, copy `node_modules` + `dist` + `seed` + `package.json`, set
    `DATABASE_PATH=/data/clinic.db`, `EXPOSE 3000`, `CMD ["node","dist/main.js"]`.
  - `.dockerignore` (node_modules, dist, .git, coverage, *.db).
- **`docker-compose.yml`** — one `api` service: build `.`, ports `3000:3000`, volume
  `clinic-data:/data`, env `DATABASE_PATH=/data/clinic.db`. Named volume `clinic-data`.

## Acceptance criteria
- [ ] `docker compose build` succeeds (native `better-sqlite3` compiles/loads in the image).
- [ ] `docker compose up` serves `GET /health` → 200 and `/docs` renders.

## Verification
```bash
docker compose up --build -d
sleep 5 && curl -s localhost:3000/health
docker compose down
```

## On completion
Commit: `F4: Dockerfile + docker-compose (SQLite volume)`.
