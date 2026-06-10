# E6 — Swagger + DI wiring (ports → adapters)

**Epic:** E — HTTP · **Branch:** `feat/e-http` · **Depends on:** E5

> Read `docs/APPROACH.md` + `docs/tickets/README.md` first. This ticket makes the app fully
> functional end-to-end.

## Goal
Bind the application ports to their SQLite adapters in the Nest DI container, register the
use-cases and controllers, and expose Swagger/OpenAPI at `/docs`.

## Files
- **`src/app.module.ts`** — wire everything:
  - `providers`:
    - `{ provide: SQLITE_DB, useFactory: () => createDb() }`
    - `{ provide: APPOINTMENT_REPOSITORY, useFactory: (db) => new SqliteAppointmentRepository(db), inject: [SQLITE_DB] }`
    - `{ provide: PEOPLE_REPOSITORY, useFactory: (db) => new SqlitePeopleRepository(db), inject: [SQLITE_DB] }`
    - `{ provide: CLOCK, useClass: SystemClock }`
    - the three use-cases (`useFactory` injecting the tokens they need), or `useClass` with
      `@Inject(token)` constructor params.
    - `{ provide: APP_GUARD, useClass: RolesGuard }` (global guard; or apply per-controller).
  - `controllers`: `HealthController`, `AppointmentsController`, `CliniciansController`.
- **`src/main.ts`** — Swagger:
  ```ts
  const config = new DocumentBuilder().setTitle('Clinic Appointment API')
    .setDescription('Book appointments; clinician & admin listings').setVersion('1.0')
    .addApiKey({ type: 'apiKey', name: 'X-Role', in: 'header' }, 'X-Role').build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
  ```

## Acceptance criteria
- [ ] `npm run start` boots with no DI errors; `/docs` renders all three endpoints.
- [ ] A real `POST /appointments` (X-Role: patient) returns `201`; a duplicate overlap → `409`.
- [ ] typecheck + lint clean.

## Verification
```bash
npm run start &
sleep 2
curl -s -X POST localhost:3000/appointments -H 'X-Role: patient' -H 'Content-Type: application/json' \
  -d '{"clinicianId":"c1","patientId":"p1","start":"2999-01-01T10:00:00Z","end":"2999-01-01T10:30:00Z"}'
# repeat the same -> 409
kill %1
```

## On completion
Append E6 entry to `docs/APPROACH.md` §6. Commit: `E6: Swagger + DI wiring (ports→adapters)`.
**Epic E done** → `make review`, merge `feat/e-http` into `main`.
