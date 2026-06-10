# Clinic Appointment System API

A small RESTful API for a simplified clinic appointment system: patients book appointments,
clinicians view their schedules, and admins list upcoming appointments. Built with
**NestJS + TypeScript + SQLite**, organized as pragmatic hexagonal-lite.

> 📓 See [`docs/APPROACH.md`](docs/APPROACH.md) for the full approach, decisions, and a
> per-ticket development log.

## Status

🚧 Under construction — built ticket by ticket on epic branches. See the approach doc.

## Tech stack

- **NestJS** (HTTP, DI, guards, pipes, Swagger)
- **TypeScript**
- **SQLite** via `better-sqlite3` (explicit transactions for concurrency-safe booking)
- **Jest** + **supertest** (unit, application, integration)

## Endpoints (planned)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `POST` | `/appointments` | patient, admin | Book an appointment (rejects clinician overlaps) |
| `GET` | `/clinicians/:id/appointments` | clinician, admin | A clinician's upcoming appointments |
| `GET` | `/appointments` | admin | All upcoming appointments |

## Getting started

> Filled in as the scaffold lands (Epic A).

```bash
npm install
npm run start:dev
```

## Tests

```bash
npm test               # unit + application
npm run test:integration   # containerized HTTP tests
```

## Design decisions

See [`docs/APPROACH.md`](docs/APPROACH.md). Highlights: hexagonal-lite layering,
`better-sqlite3` with `BEGIN IMMEDIATE` for concurrency-safe overlap prevention, three-table
schema with FKs, role simulation via `X-Role`.
