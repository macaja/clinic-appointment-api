import { ListClinicianAppointmentsUseCase } from './list-clinician-appointments.use-case';
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
  const useCase = new ListClinicianAppointmentsUseCase(repo, clock);
  return { useCase, repo };
};

describe('ListClinicianAppointmentsUseCase', () => {
  it('should exclude past appointments when no from is provided', async () => {
    const past = makeAppt('c1', '2025-01-01T10:00:00Z', '2025-01-01T11:00:00Z');
    const future = makeAppt('c1', '2025-07-01T10:00:00Z', '2025-07-01T11:00:00Z');
    const { useCase } = await makeUseCase([past, future]);

    const result = await useCase.execute({ clinicianId: 'c1' });

    expect(result).toHaveLength(1);
    expect(result[0].range.start.toISOString()).toBe('2025-07-01T10:00:00.000Z');
  });

  it('should return only appointments within explicit from/to window', async () => {
    const early = makeAppt('c1', '2025-07-01T08:00:00Z', '2025-07-01T09:00:00Z');
    const inWindow = makeAppt('c1', '2025-07-01T10:00:00Z', '2025-07-01T11:00:00Z');
    const late = makeAppt('c1', '2025-07-01T14:00:00Z', '2025-07-01T15:00:00Z');
    const { useCase } = await makeUseCase([early, inWindow, late]);

    const result = await useCase.execute({
      clinicianId: 'c1',
      from: new Date('2025-07-01T09:30:00Z'),
      to: new Date('2025-07-01T13:00:00Z'),
    });

    expect(result).toHaveLength(1);
    expect(result[0].range.start.toISOString()).toBe('2025-07-01T10:00:00.000Z');
  });

  it("should return only the requested clinician's appointments", async () => {
    const c1Appt = makeAppt('c1', '2025-07-01T10:00:00Z', '2025-07-01T11:00:00Z');
    const c2Appt = makeAppt('c2', '2025-07-01T10:00:00Z', '2025-07-01T11:00:00Z');
    const { useCase } = await makeUseCase([c1Appt, c2Appt]);

    const result = await useCase.execute({ clinicianId: 'c1' });

    expect(result).toHaveLength(1);
    expect(result[0].clinicianId).toBe('c1');
  });

  it('should return results sorted ascending by start', async () => {
    const second = makeAppt('c1', '2025-07-02T10:00:00Z', '2025-07-02T11:00:00Z');
    const first = makeAppt('c1', '2025-07-01T10:00:00Z', '2025-07-01T11:00:00Z');
    const third = makeAppt('c1', '2025-07-03T10:00:00Z', '2025-07-03T11:00:00Z');
    const { useCase } = await makeUseCase([second, first, third]);

    const result = await useCase.execute({ clinicianId: 'c1' });

    expect(result[0].range.startMs).toBeLessThan(result[1].range.startMs);
    expect(result[1].range.startMs).toBeLessThan(result[2].range.startMs);
  });
});
