import { AppointmentRepository } from '../ports/appointment-repository.port';
import { PeopleRepository } from '../ports/people-repository.port';
import { Clock } from '../ports/clock.port';
import { TimeRange } from '../../domain/time-range';
import { Appointment } from '../../domain/appointment';
import { PastAppointmentError } from '../../domain/errors';

export interface CreateAppointmentInput {
  clinicianId: string;
  patientId: string;
  start: string | Date;
  end: string | Date;
}

export class CreateAppointmentUseCase {
  constructor(
    private readonly appointmentRepo: AppointmentRepository,
    private readonly peopleRepo: PeopleRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: CreateAppointmentInput): Promise<Appointment> {
    const startMs = new Date(input.start).getTime();
    const endMs = new Date(input.end).getTime();
    const range = new TimeRange(startMs, endMs);

    if (range.start < this.clock.now()) {
      throw new PastAppointmentError();
    }

    await this.peopleRepo.ensureClinician(input.clinicianId);
    await this.peopleRepo.ensurePatient(input.patientId);

    const appt = Appointment.create({
      clinicianId: input.clinicianId,
      patientId: input.patientId,
      range,
      now: this.clock.now(),
    });

    return this.appointmentRepo.createOverlapSafe(appt);
  }
}
