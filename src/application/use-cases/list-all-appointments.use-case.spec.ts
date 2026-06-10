import { ListAllAppointmentsUseCase } from './list-all-appointments.use-case';
import { InMemoryAppointmentRepository } from '../../../test/support/in-memory-appointment.repository';
import { FixedClock } from '../../../test/support/fixed-clock';
import { Appointment } from '../../domain/appointment';
import { TimeRange } from '../../domain/time-range';

const NOW = new Date('2025-06-01T12:00:00Z');

const makeAppt = (clinicianId: string, startIso: string, endIso: string) =>
  Appointment.create({
    clinicianId,
    patientId: 'p1',
    range: new TimeRange(new Date(startIso).getTime(), new Date(endIso).getTime()),
    now: NOW,
  });

const seedRepo = async (appts: Appointment[]): Promise<InMemoryAppointmentRepository> => {
  const repo = new InMemoryAppointmentRepository();
  for (const a of appts) {
    await repo.createOverlapSafe(a);
  }
  return repo;
};

const makeUseCase = async (appts: Appointment[] = []) => {
  const repo = await seedRepo(appts);
  const clock = new FixedClock(NOW);
  const useCase = new ListAllAppointmentsUseCase(repo, clock);
  return { useCase };
};

describe('ListAllAppointmentsUseCase', () => {
  it('should exclude past appointments when no from is provided', async () => {
    const past = makeAppt('c1', '2025-01-01T10:00:00Z', '2025-01-01T11:00:00Z');
    const future = makeAppt('c2', '2025-07-01T10:00:00Z', '2025-07-01T11:00:00Z');
    const { useCase } = await makeUseCase([past, future]);

    const result = await useCase.execute({});

    expect(result).toHaveLength(1);
    expect(result[0].clinicianId).toBe('c2');
  });

  it('should filter across multiple clinicians when from/to are provided', async () => {
    const c1 = makeAppt('c1', '2025-07-01T10:00:00Z', '2025-07-01T11:00:00Z');
    const c2 = makeAppt('c2', '2025-07-01T10:00:00Z', '2025-07-01T11:00:00Z');
    const outOfRange = makeAppt('c1', '2025-08-01T10:00:00Z', '2025-08-01T11:00:00Z');
    const { useCase } = await makeUseCase([c1, c2, outOfRange]);

    const result = await useCase.execute({
      from: new Date('2025-07-01T00:00:00Z'),
      to: new Date('2025-07-31T00:00:00Z'),
    });

    expect(result).toHaveLength(2);
  });

  it('should cap result count when limit is provided', async () => {
    const appts = [
      makeAppt('c1', '2025-07-01T10:00:00Z', '2025-07-01T11:00:00Z'),
      makeAppt('c2', '2025-07-02T10:00:00Z', '2025-07-02T11:00:00Z'),
      makeAppt('c3', '2025-07-03T10:00:00Z', '2025-07-03T11:00:00Z'),
    ];
    const { useCase } = await makeUseCase(appts);

    const result = await useCase.execute({ limit: 2 });

    expect(result).toHaveLength(2);
  });

  it('should skip rows when offset is provided', async () => {
    const appts = [
      makeAppt('c1', '2025-07-01T10:00:00Z', '2025-07-01T11:00:00Z'),
      makeAppt('c2', '2025-07-02T10:00:00Z', '2025-07-02T11:00:00Z'),
      makeAppt('c3', '2025-07-03T10:00:00Z', '2025-07-03T11:00:00Z'),
    ];
    const { useCase } = await makeUseCase(appts);

    const result = await useCase.execute({ offset: 1 });

    expect(result).toHaveLength(2);
    expect(result[0].clinicianId).toBe('c2');
  });

  it('should return results sorted ascending by start', async () => {
    const appts = [
      makeAppt('c1', '2025-07-03T10:00:00Z', '2025-07-03T11:00:00Z'),
      makeAppt('c2', '2025-07-01T10:00:00Z', '2025-07-01T11:00:00Z'),
      makeAppt('c3', '2025-07-02T10:00:00Z', '2025-07-02T11:00:00Z'),
    ];
    const { useCase } = await makeUseCase(appts);

    const result = await useCase.execute({});

    expect(result[0].range.startMs).toBeLessThan(result[1].range.startMs);
    expect(result[1].range.startMs).toBeLessThan(result[2].range.startMs);
  });
});
