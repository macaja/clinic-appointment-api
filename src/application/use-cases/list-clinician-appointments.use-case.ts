import { AppointmentRepository } from '../ports/appointment-repository.port';
import { Clock } from '../ports/clock.port';
import { Appointment } from '../../domain/appointment';

export interface ListClinicianAppointmentsInput {
  clinicianId: string;
  from?: Date;
  to?: Date;
}

export class ListClinicianAppointmentsUseCase {
  constructor(
    private readonly appointmentRepo: AppointmentRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: ListClinicianAppointmentsInput): Promise<Appointment[]> {
    const from = input.from ?? this.clock.now();
    const results = await this.appointmentRepo.findUpcomingByClinician(input.clinicianId, {
      from,
      to: input.to,
    });
    return results.slice().sort((a, b) => a.range.startMs - b.range.startMs);
  }
}
