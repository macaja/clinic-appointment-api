import { Appointment } from '../../domain/appointment';

export interface DateRange {
  from?: Date;
  to?: Date;
}

export interface Page {
  limit?: number;
  offset?: number;
}

export interface AppointmentRepository {
  createOverlapSafe(appt: Appointment): Promise<Appointment>;
  findUpcomingByClinician(clinicianId: string, range: DateRange): Promise<Appointment[]>;
  findAllUpcoming(range: DateRange, page: Page): Promise<Appointment[]>;
}

export const APPOINTMENT_REPOSITORY = 'APPOINTMENT_REPOSITORY';
