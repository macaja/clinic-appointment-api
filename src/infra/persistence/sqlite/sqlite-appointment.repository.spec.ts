import { createDb } from './db';
import { SqliteAppointmentRepository } from './sqlite-appointment.repository';
import { SqlitePeopleRepository } from './sqlite-people.repository';
import { Appointment } from '../../../domain/appointment';
import { TimeRange } from '../../../domain/time-range';
import { OverlapError } from '../../../domain/errors';

const NOW = new Date('2025-01-01T00:00:00Z');

const makeAppt = (clinicianId: string, startIso: string, endIso: string, patientId = 'p1') =>
  Appointment.create({
    clinicianId,
    patientId,
    range: new TimeRange(new Date(startIso).getTime(), new Date(endIso).getTime()),
    now: NOW,
  });

const makeRepo = () => {
  const db = createDb(':memory:');
  const people = new SqlitePeopleRepository(db);
  const repo = new SqliteAppointmentRepository(db);
  return { db, repo, people };
};

const seedPeople = (
  people: SqlitePeopleRepository,
  clinicianIds: string[],
  patientIds: string[],
) => {
  clinicianIds.forEach((id) => people.ensureClinician(id));
  patientIds.forEach((id) => people.ensurePatient(id));
};

describe('SqliteAppointmentRepository', () => {
  it('should persist and read back an appointment with correct fields', async () => {
    const { repo, people } = makeRepo();
    seedPeople(people, ['c1'], ['p1']);
    const appt = makeAppt('c1', '2025-06-01T10:00:00Z', '2025-06-01T11:00:00Z');

    const saved = await repo.createOverlapSafe(appt);

    expect(saved.id).toBe(appt.id);
    expect(saved.clinicianId).toBe('c1');
    expect(saved.patientId).toBe('p1');
    expect(saved.range.start.toISOString()).toBe('2025-06-01T10:00:00.000Z');
    expect(saved.range.end.toISOString()).toBe('2025-06-01T11:00:00.000Z');
  });

  it('should throw OverlapError when inserting an overlapping window for the same clinician', async () => {
    const { repo, people } = makeRepo();
    seedPeople(people, ['c1'], ['p1', 'p2']);
    await repo.createOverlapSafe(makeAppt('c1', '2025-06-01T10:00:00Z', '2025-06-01T12:00:00Z'));

    await expect(
      repo.createOverlapSafe(makeAppt('c1', '2025-06-01T11:00:00Z', '2025-06-01T13:00:00Z', 'p2')),
    ).rejects.toThrow(OverlapError);
  });

  it('should allow touching appointments when new start equals existing end', async () => {
    const { repo, people } = makeRepo();
    seedPeople(people, ['c1'], ['p1', 'p2']);
    await repo.createOverlapSafe(makeAppt('c1', '2025-06-01T10:00:00Z', '2025-06-01T11:00:00Z'));

    await expect(
      repo.createOverlapSafe(makeAppt('c1', '2025-06-01T11:00:00Z', '2025-06-01T12:00:00Z', 'p2')),
    ).resolves.toBeDefined();
  });

  it('should allow the same time window for a different clinician', async () => {
    const { repo, people } = makeRepo();
    seedPeople(people, ['c1', 'c2'], ['p1']);
    await repo.createOverlapSafe(makeAppt('c1', '2025-06-01T10:00:00Z', '2025-06-01T11:00:00Z'));

    await expect(
      repo.createOverlapSafe(makeAppt('c2', '2025-06-01T10:00:00Z', '2025-06-01T11:00:00Z')),
    ).resolves.toBeDefined();
  });

  it('should exclude past and other clinician appointments in findUpcomingByClinician', async () => {
    const { repo, people } = makeRepo();
    seedPeople(people, ['c1', 'c2'], ['p1']);
    const from = new Date('2025-06-01T00:00:00Z');
    await repo.createOverlapSafe(makeAppt('c1', '2025-05-01T10:00:00Z', '2025-05-01T11:00:00Z'));
    await repo.createOverlapSafe(makeAppt('c2', '2025-07-01T10:00:00Z', '2025-07-01T11:00:00Z'));
    await repo.createOverlapSafe(makeAppt('c1', '2025-07-01T10:00:00Z', '2025-07-01T11:00:00Z'));

    const results = await repo.findUpcomingByClinician('c1', { from });

    expect(results).toHaveLength(1);
    expect(results[0].clinicianId).toBe('c1');
    expect(results[0].range.start >= from).toBe(true);
  });

  it('should return results sorted ascending in findUpcomingByClinician', async () => {
    const { repo, people } = makeRepo();
    seedPeople(people, ['c1'], ['p1']);
    const from = new Date('2025-01-01T00:00:00Z');
    await repo.createOverlapSafe(makeAppt('c1', '2025-07-03T10:00:00Z', '2025-07-03T11:00:00Z'));
    await repo.createOverlapSafe(makeAppt('c1', '2025-07-01T10:00:00Z', '2025-07-01T11:00:00Z'));
    await repo.createOverlapSafe(makeAppt('c1', '2025-07-02T10:00:00Z', '2025-07-02T11:00:00Z'));

    const results = await repo.findUpcomingByClinician('c1', { from });

    expect(results[0].range.startMs).toBeLessThan(results[1].range.startMs);
    expect(results[1].range.startMs).toBeLessThan(results[2].range.startMs);
  });

  it('should respect from/to and limit/offset in findAllUpcoming', async () => {
    const { repo, people } = makeRepo();
    seedPeople(people, ['c1', 'c2', 'c3'], ['p1']);
    const from = new Date('2025-07-01T00:00:00Z');
    const to = new Date('2025-07-31T00:00:00Z');
    await repo.createOverlapSafe(makeAppt('c1', '2025-07-05T10:00:00Z', '2025-07-05T11:00:00Z'));
    await repo.createOverlapSafe(makeAppt('c2', '2025-07-10T10:00:00Z', '2025-07-10T11:00:00Z'));
    await repo.createOverlapSafe(makeAppt('c3', '2025-08-01T10:00:00Z', '2025-08-01T11:00:00Z'));

    const all = await repo.findAllUpcoming({ from, to }, {});
    expect(all).toHaveLength(2);

    const limited = await repo.findAllUpcoming({ from, to }, { limit: 1 });
    expect(limited).toHaveLength(1);

    const offset = await repo.findAllUpcoming({ from, to }, { limit: 10, offset: 1 });
    expect(offset).toHaveLength(1);
    expect(offset[0].clinicianId).toBe('c2');
  });

  it('should return first success and throw on second for two overlapping sequential inserts', async () => {
    const { repo, people } = makeRepo();
    seedPeople(people, ['c1'], ['p1', 'p2']);

    const first = repo.createOverlapSafe(
      makeAppt('c1', '2025-06-01T10:00:00Z', '2025-06-01T12:00:00Z'),
    );
    const second = repo.createOverlapSafe(
      makeAppt('c1', '2025-06-01T11:00:00Z', '2025-06-01T13:00:00Z', 'p2'),
    );

    await expect(first).resolves.toBeDefined();
    await expect(second).rejects.toThrow(OverlapError);
  });
});
