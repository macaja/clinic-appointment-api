import { randomUUID } from 'crypto';
import { TimeRange } from './time-range';

interface AppointmentProps {
  id?: string;
  clinicianId: string;
  patientId: string;
  range: TimeRange;
  now: Date;
}

interface AppointmentPrimitives {
  id: string;
  clinicianId: string;
  patientId: string;
  start: string;
  end: string;
  createdAt: string;
}

// Past-time validation belongs in use-case C2 via the Clock, not here.
// The entity is responsible for identity/structure only.
export class Appointment {
  readonly id: string;
  readonly clinicianId: string;
  readonly patientId: string;
  readonly range: TimeRange;
  readonly createdAt: Date;

  private constructor(
    id: string,
    clinicianId: string,
    patientId: string,
    range: TimeRange,
    createdAt: Date,
  ) {
    this.id = id;
    this.clinicianId = clinicianId;
    this.patientId = patientId;
    this.range = range;
    this.createdAt = createdAt;
  }

  static create({ id, clinicianId, patientId, range, now }: AppointmentProps): Appointment {
    return new Appointment(id ?? randomUUID(), clinicianId, patientId, range, now);
  }

  toPrimitives(): AppointmentPrimitives {
    return {
      id: this.id,
      clinicianId: this.clinicianId,
      patientId: this.patientId,
      start: this.range.start.toISOString(),
      end: this.range.end.toISOString(),
      createdAt: this.createdAt.toISOString(),
    };
  }
}
