import { AppointmentRepository } from '../ports/appointment-repository.port';
import { Clock } from '../ports/clock.port';
import { Appointment } from '../../domain/appointment';

export interface ListAllAppointmentsInput {
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}

export class ListAllAppointmentsUseCase {
  constructor(
    private readonly appointmentRepo: AppointmentRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: ListAllAppointmentsInput): Promise<Appointment[]> {
    const from = input.from ?? this.clock.now();
    const results = await this.appointmentRepo.findAllUpcoming(
      { from, to: input.to },
      { limit: input.limit, offset: input.offset },
    );
    return results.slice().sort((a, b) => a.range.startMs - b.range.startMs);
  }
}
