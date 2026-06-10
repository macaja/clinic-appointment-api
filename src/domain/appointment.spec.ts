import { Appointment } from './appointment';
import { TimeRange } from './time-range';

const START_MS = new Date('2025-06-01T09:00:00Z').getTime();
const END_MS = new Date('2025-06-01T10:00:00Z').getTime();

const makeRange = () => new TimeRange(START_MS, END_MS);

const makeAppointment = (overrides: Partial<Parameters<typeof Appointment.create>[0]> = {}) =>
  Appointment.create({
    clinicianId: 'clinician-1',
    patientId: 'patient-1',
    range: makeRange(),
    now: new Date('2025-06-01T08:00:00Z'),
    ...overrides,
  });

describe('Appointment', () => {
  it('should assign a uuid id when none provided', () => {
    const appt = makeAppointment();
    expect(appt.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('should use provided id when given', () => {
    const appt = makeAppointment({ id: 'fixed-id' });
    expect(appt.id).toBe('fixed-id');
  });

  it('should store clinicianId, patientId, range, and createdAt', () => {
    const range = makeRange();
    const now = new Date('2025-06-01T08:00:00Z');
    const appt = Appointment.create({
      clinicianId: 'clinician-abc',
      patientId: 'patient-xyz',
      range,
      now,
    });
    expect(appt.clinicianId).toBe('clinician-abc');
    expect(appt.patientId).toBe('patient-xyz');
    expect(appt.range).toBe(range);
    expect(appt.createdAt).toBe(now);
  });

  it('should emit ISO-8601 strings for start, end, and createdAt in toPrimitives', () => {
    const range = makeRange();
    const now = new Date('2025-06-01T08:00:00Z');
    const appt = Appointment.create({ clinicianId: 'c1', patientId: 'p1', range, now });
    const primitives = appt.toPrimitives();
    expect(primitives.start).toBe('2025-06-01T09:00:00.000Z');
    expect(primitives.end).toBe('2025-06-01T10:00:00.000Z');
    expect(primitives.createdAt).toBe('2025-06-01T08:00:00.000Z');
  });

  it('should include id, clinicianId, and patientId in toPrimitives', () => {
    const appt = makeAppointment({ id: 'appt-id', clinicianId: 'c1', patientId: 'p1' });
    const primitives = appt.toPrimitives();
    expect(primitives.id).toBe('appt-id');
    expect(primitives.clinicianId).toBe('c1');
    expect(primitives.patientId).toBe('p1');
  });
});
