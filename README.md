# Clinic Appointment API

A RESTful API for booking clinic appointments with clinician scheduling and admin listings.
Built with **NestJS + TypeScript + SQLite** using pragmatic hexagonal-lite architecture.

---

## Endpoints

| Endpoint | Allowed roles | Description |
|---|---|---|
| `POST /appointments` | patient, admin | Book a new appointment |
| `GET /clinicians/:id/appointments` | clinician, admin | List clinician's upcoming appointments |
| `GET /appointments` | admin only | List all upcoming appointments |
| `GET /health` | any | Health check |

### Role authentication

Pass the caller role in the `X-Role` header (or `?role=` query param for testing):

```
X-Role: patient | clinician | admin
```

### Status codes

| Code | Meaning |
|---|---|
| `201` | Appointment created |
| `200` | Listing returned |
| `400` | Invalid input (bad date, past appointment, start >= end) |
| `403` | Missing or wrong role |
| `409` | Overlapping appointment for the same clinician |

---

## Run locally

### Prerequisites

- Node.js 20+
- npm

### Steps

```bash
# 1. Install dependencies
make local-setup

# 2. Start the server (watches for file changes)
make local-run

# 3. (Optional) Load seed data
make local-seed
```

The server starts at `http://localhost:3000`.
Swagger/OpenAPI docs at `http://localhost:3000/docs`.

Set `DATABASE_PATH` to override the SQLite file location (default `./data/clinic.db`):

```bash
DATABASE_PATH=/tmp/my-clinic.db make local-run
```

---

## Run with Docker

```bash
docker compose up --build
```

- API: `http://localhost:3000`
- Docs: `http://localhost:3000/docs`
- SQLite persisted to a named Docker volume `clinic-data`

---

## Example requests (curl)

### Book an appointment (patient role)

```bash
curl -sS -X POST http://localhost:3000/appointments \
  -H 'X-Role: patient' \
  -H 'Content-Type: application/json' \
  -d '{
    "clinicianId": "c1",
    "patientId":   "p1",
    "start": "2999-01-01T10:00:00Z",
    "end":   "2999-01-01T10:30:00Z"
  }'
```

Repeat the same request → **409 Conflict** (overlap detected).

### List a clinician's appointments (clinician role)

```bash
curl -sS http://localhost:3000/clinicians/c1/appointments \
  -H 'X-Role: clinician'

# With date range filter
curl -sS "http://localhost:3000/clinicians/c1/appointments?from=2999-01-01T00:00:00Z&to=2999-12-31T23:59:59Z" \
  -H 'X-Role: clinician'
```

### List all appointments (admin role)

```bash
curl -sS http://localhost:3000/appointments -H 'X-Role: admin'

# With pagination
curl -sS "http://localhost:3000/appointments?limit=10&offset=0" -H 'X-Role: admin'
```

### Makefile role helpers

```bash
make local-create-appointment         # POST as patient
make local-clinician-get-appointments # GET clinician schedule
make local-admin-get-appointments     # GET all (admin)
```

Scripts are in `scripts/`. See `make help` for all targets.

---

## Tests

### Unit + application tests

```bash
make test
# or: npm test
```

Tests the domain (`TimeRange` overlap logic, `Appointment` entity, errors) and all three
use-cases via in-memory fakes. No I/O.

### Integration tests (the 4 required scenarios)

```bash
make test-integration
# or: npm run test:integration
```

The integration harness boots the real Nest app in-process with an in-memory SQLite database
via `@nestjs/testing` + supertest. No Docker required. The four required scenarios are:

1. **Create**: `POST /appointments` → 201, body has an id and ISO timestamps.
2. **Reject overlap**: duplicate booking → 409; touching endpoints → 201 (allowed).
3. **List clinician**: `GET /clinicians/:id/appointments` → 200, only that clinician's rows.
4. **Date-range filter**: `GET /appointments?from=…&to=…` → only in-range rows returned.

Plus bonus assertions: wrong role → 403, malformed ISO → 400.

---

## Concurrency / race-condition strategy

The core requirement is preventing overlapping bookings for the same clinician under
concurrent requests.

**Mechanism: `BEGIN IMMEDIATE` + check-then-insert in a single transaction.**

In `SqliteAppointmentRepository.createOverlapSafe`:

```typescript
const txn = db.transaction((appt) => {
  // Overlap predicate: start < other.end AND end > other.start
  const clash = clashStmt.get(appt.clinicianId, appt.endMs, appt.startMs);
  if (clash) throw new OverlapError();
  insertStmt.run({ ...appt });
  return appt;
});
txn.immediate(appt); // BEGIN IMMEDIATE acquires the write lock up-front
```

`better-sqlite3`'s `.immediate()` opens a `BEGIN IMMEDIATE` transaction, which acquires the
SQLite write lock **before** the overlap check runs. A concurrent second writer must wait
until the first transaction commits or rolls back. After waiting, it re-reads and sees the
newly inserted row → throws `OverlapError`.

**Why not a UNIQUE constraint?**
Overlap is a range predicate (`start < other.end AND end > other.start`), not an equality
condition. UNIQUE constraints only express exact value equality, so they cannot express
interval overlap.

**Production path (PostgreSQL):**
`EXCLUDE USING gist (clinicianId WITH =, tstzrange(startUtc, endUtc) WITH &&)` expresses
the overlap constraint declaratively, or pessimistic row locking with
`SELECT ... FOR UPDATE`. SQLite's single-writer model means `BEGIN IMMEDIATE` is the
correct mechanism and `FOR UPDATE` is explicitly not supported.

---

## Design decisions / tradeoffs

### Architecture: pragmatic hexagonal-lite

Domain (`TimeRange`, `Appointment`, errors) and application (use-cases) layers are
framework-free. Infrastructure adapters (SQLite repos, HTTP controllers) implement the ports.
No CQRS, no event bus — three use-cases, three endpoints, three tables.

### Data model

Three tables with FKs: `clinician`, `patient`, `appointment`.
`startUtc`/`endUtc` stored as **INTEGER epoch-milliseconds** for unambiguous comparisons,
clean range indexing, and no timezone confusion. ISO-8601 parsing/serialization at the DTO
and serialization boundary.

### Auto-create clinician/patient

Unknown `clinicianId`/`patientId` values are created as stub rows on first reference
(`INSERT OR IGNORE`). This prevents 400 errors for unknown IDs and mirrors real-world flows
where appointment systems are the source of truth.

### Role simulation

`X-Role` header (fallback `?role=` for curl convenience) simulates authentication. A real
system would verify a JWT and extract the role claim — the `RolesGuard` interface is the
same seam.

### SQLite driver: `better-sqlite3`

Synchronous API enables explicit transaction control. TypeORM/Prisma's pessimistic lock maps
to `SELECT ... FOR UPDATE`, which SQLite silently does not support — using it would be
misleading. `better-sqlite3` with `BEGIN IMMEDIATE` is the honest mechanism.

### What was cut for the timebox

- Real JWT authentication
- Appointment cancellation / rescheduling
- Clinician/patient CRUD endpoints
- Pagination on clinician listing
- Email/SMS notifications
