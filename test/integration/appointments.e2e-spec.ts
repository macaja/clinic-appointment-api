import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import supertest from 'supertest';
import { AppModule } from '../../src/app.module';
import { DomainExceptionFilter } from '../../src/infra/http/domain-exception.filter';
import { LoggingInterceptor } from '../../src/infra/http/logging.interceptor';
import { SQLITE_DB } from '../../src/infra/persistence/sqlite/db';
import Database from 'better-sqlite3';

const FAR_FUTURE = '2999';

const slot = (startH: number, endH: number) => ({
  start: `${FAR_FUTURE}-01-01T${String(startH).padStart(2, '0')}:00:00Z`,
  end: `${FAR_FUTURE}-01-01T${String(endH).padStart(2, '0')}:00:00Z`,
});

async function buildApp(): Promise<INestApplication> {
  process.env.DATABASE_PATH = ':memory:';

  const module: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = module.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  app.useGlobalFilters(new DomainExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  await app.init();
  return app;
}

describe('Appointments E2E', () => {
  let app: INestApplication;
  let request: ReturnType<typeof supertest>;

  beforeAll(async () => {
    app = await buildApp();
    request = supertest(app.getHttpServer());
  });

  afterAll(async () => {
    const db = app.get<Database.Database>(SQLITE_DB);
    db.close();
    await app.close();
  });

  // ─── Scenario 1: create ─────────────────────────────────────────────────
  describe('Scenario 1: create appointment', () => {
    it('should return 201 with id and ISO times when input is valid', async () => {
      const response = await request
        .post('/appointments')
        .set('X-Role', 'patient')
        .send({ clinicianId: 'c1', patientId: 'p1', ...slot(10, 11) });

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.start).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(response.body.end).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(response.body.clinicianId).toBe('c1');
      expect(response.body.patientId).toBe('p1');
    });
  });

  // ─── Scenario 2: reject overlap + allow touching ─────────────────────────
  describe('Scenario 2: reject overlapping appointment', () => {
    beforeAll(async () => {
      await request
        .post('/appointments')
        .set('X-Role', 'patient')
        .send({ clinicianId: 'c2', patientId: 'p1', ...slot(14, 15) });
    });

    it('should return 409 when booking overlaps an existing appointment', async () => {
      const response = await request
        .post('/appointments')
        .set('X-Role', 'patient')
        .send({ clinicianId: 'c2', patientId: 'p2', ...slot(14, 15) });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('OverlapError');
    });

    it('should return 201 when new appointment touches but does not overlap', async () => {
      const response = await request
        .post('/appointments')
        .set('X-Role', 'patient')
        .send({ clinicianId: 'c2', patientId: 'p2', ...slot(15, 16) });

      expect(response.status).toBe(201);
    });
  });

  // ─── Scenario 3: list clinician appointments ─────────────────────────────
  describe('Scenario 3: list clinician appointments', () => {
    beforeAll(async () => {
      await request
        .post('/appointments')
        .set('X-Role', 'patient')
        .send({ clinicianId: 'c3', patientId: 'p1', ...slot(9, 10) });
    });

    it("should return 200 with the clinician's appointments", async () => {
      const response = await request.get('/clinicians/c3/appointments').set('X-Role', 'clinician');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body.every((a: { clinicianId: string }) => a.clinicianId === 'c3')).toBe(
        true,
      );
    });

    it('should not include other clinicians in the response', async () => {
      const response = await request.get('/clinicians/c3/appointments').set('X-Role', 'clinician');

      expect(response.body.every((a: { clinicianId: string }) => a.clinicianId === 'c3')).toBe(
        true,
      );
    });
  });

  // ─── Scenario 4: date-range filtering ────────────────────────────────────
  describe('Scenario 4: date-range filtering', () => {
    beforeAll(async () => {
      await request.post('/appointments').set('X-Role', 'patient').send({
        clinicianId: 'c4',
        patientId: 'p1',
        start: '2999-03-01T10:00:00Z',
        end: '2999-03-01T11:00:00Z',
      });

      await request.post('/appointments').set('X-Role', 'patient').send({
        clinicianId: 'c4',
        patientId: 'p2',
        start: '2999-09-01T10:00:00Z',
        end: '2999-09-01T11:00:00Z',
      });
    });

    it('should return only appointments within the from/to window', async () => {
      const response = await request
        .get('/appointments')
        .set('X-Role', 'admin')
        .query({ from: '2999-01-01T00:00:00Z', to: '2999-06-01T00:00:00Z' });

      expect(response.status).toBe(200);
      const ids = response.body.map((a: { id: string }) => a.id);
      expect(ids.some(() => true)).toBe(true);
      response.body.forEach((a: { start: string }) => {
        expect(new Date(a.start) < new Date('2999-06-01T00:00:00Z')).toBe(true);
      });
    });

    it('should exclude out-of-range appointments', async () => {
      const response = await request
        .get('/appointments')
        .set('X-Role', 'admin')
        .query({ from: '2999-01-01T00:00:00Z', to: '2999-06-01T00:00:00Z' });

      response.body.forEach((a: { start: string }) => {
        expect(new Date(a.start) >= new Date('2999-09-01T00:00:00Z')).toBe(false);
      });
    });
  });

  // ─── Bonus: auth + validation ─────────────────────────────────────────────
  describe('Bonus: wrong role and malformed input', () => {
    it('should return 403 when patient tries to GET /appointments', async () => {
      const response = await request.get('/appointments').set('X-Role', 'patient');
      expect(response.status).toBe(403);
    });

    it('should return 400 when start is not a valid ISO date', async () => {
      const response = await request.post('/appointments').set('X-Role', 'patient').send({
        clinicianId: 'c1',
        patientId: 'p1',
        start: 'not-a-date',
        end: '2999-01-01T11:00:00Z',
      });

      expect(response.status).toBe(400);
    });

    it('should return 403 when X-Role header is missing', async () => {
      const response = await request.get('/appointments');
      expect(response.status).toBe(403);
    });
  });
});
