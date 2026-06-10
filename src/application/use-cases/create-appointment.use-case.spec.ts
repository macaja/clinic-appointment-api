import { CreateAppointmentUseCase } from './create-appointment.use-case';
import { InMemoryAppointmentRepository } from '../../../test/support/in-memory-appointment.repository';
import { InMemoryPeopleRepository } from '../../../test/support/in-memory-people.repository';
import { FixedClock } from '../../../test/support/fixed-clock';
import { InvalidTimeRangeError, OverlapError, PastAppointmentError } from '../../domain/errors';

const NOW = new Date('2025-01-01T12:00:00Z');
const FUTURE_START = new Date('2025-06-01T10:00:00Z');
const FUTURE_END = new Date('2025-06-01T11:00:00Z');

const makeUseCase = () => {
  const appointmentRepo = new InMemoryAppointmentRepository();
  const peopleRepo = new InMemoryPeopleRepository();
  const clock = new FixedClock(NOW);
  const useCase = new CreateAppointmentUseCase(appointmentRepo, peopleRepo, clock);
  return { useCase, appointmentRepo, peopleRepo };
};

describe('CreateAppointmentUseCase', () => {
  it('should return a persisted appointment with an id when input is valid', async () => {
    const { useCase } = makeUseCase();

    const result = await useCase.execute({
      clinicianId: 'c1',
      patientId: 'p1',
      start: FUTURE_START,
      end: FUTURE_END,
    });

    expect(result.id).toBeDefined();
    expect(result.clinicianId).toBe('c1');
    expect(result.patientId).toBe('p1');
  });

  it('should ensure clinician and patient are persisted when appointment is created', async () => {
    const { useCase, peopleRepo } = makeUseCase();

    await useCase.execute({
      clinicianId: 'c1',
      patientId: 'p1',
      start: FUTURE_START,
      end: FUTURE_END,
    });

    expect(peopleRepo.clinicianIds.has('c1')).toBe(true);
    expect(peopleRepo.patientIds.has('p1')).toBe(true);
  });

  it('should throw OverlapError when an overlapping appointment already exists for the clinician', async () => {
    const { useCase } = makeUseCase();

    await useCase.execute({
      clinicianId: 'c1',
      patientId: 'p1',
      start: FUTURE_START,
      end: FUTURE_END,
    });

    await expect(
      useCase.execute({ clinicianId: 'c1', patientId: 'p2', start: FUTURE_START, end: FUTURE_END }),
    ).rejects.toThrow(OverlapError);
  });

  it('should allow a touching appointment when new start equals existing end', async () => {
    const { useCase } = makeUseCase();

    await useCase.execute({
      clinicianId: 'c1',
      patientId: 'p1',
      start: FUTURE_START,
      end: FUTURE_END,
    });

    const touchingStart = FUTURE_END;
    const touchingEnd = new Date('2025-06-01T12:00:00Z');

    await expect(
      useCase.execute({
        clinicianId: 'c1',
        patientId: 'p2',
        start: touchingStart,
        end: touchingEnd,
      }),
    ).resolves.toBeDefined();
  });

  it('should throw PastAppointmentError when start is before clock.now()', async () => {
    const { useCase } = makeUseCase();

    const pastStart = new Date('2024-01-01T10:00:00Z');
    const pastEnd = new Date('2024-01-01T11:00:00Z');

    await expect(
      useCase.execute({ clinicianId: 'c1', patientId: 'p1', start: pastStart, end: pastEnd }),
    ).rejects.toThrow(PastAppointmentError);
  });

  it('should throw InvalidTimeRangeError when start is equal to end', async () => {
    const { useCase } = makeUseCase();

    await expect(
      useCase.execute({
        clinicianId: 'c1',
        patientId: 'p1',
        start: FUTURE_START,
        end: FUTURE_START,
      }),
    ).rejects.toThrow(InvalidTimeRangeError);
  });

  it('should throw InvalidTimeRangeError when start is after end', async () => {
    const { useCase } = makeUseCase();

    await expect(
      useCase.execute({ clinicianId: 'c1', patientId: 'p1', start: FUTURE_END, end: FUTURE_START }),
    ).rejects.toThrow(InvalidTimeRangeError);
  });

  it('should auto-create unknown clinician and patient ids without error', async () => {
    const { useCase, peopleRepo } = makeUseCase();

    await expect(
      useCase.execute({
        clinicianId: 'unknown-c',
        patientId: 'unknown-p',
        start: FUTURE_START,
        end: FUTURE_END,
      }),
    ).resolves.toBeDefined();

    expect(peopleRepo.clinicianIds.has('unknown-c')).toBe(true);
    expect(peopleRepo.patientIds.has('unknown-p')).toBe(true);
  });
});
