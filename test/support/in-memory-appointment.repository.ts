import { Appointment } from '../../src/domain/appointment';
import { OverlapError } from '../../src/domain/errors';
import {
  AppointmentRepository,
  DateRange,
  Page,
} from '../../src/application/ports/appointment-repository.port';

export class InMemoryAppointmentRepository implements AppointmentRepository {
  private readonly appointments: Appointment[] = [];

  async createOverlapSafe(appt: Appointment): Promise<Appointment> {
    const clash = this.appointments.some(
      (existing) =>
        existing.clinicianId === appt.clinicianId && existing.range.overlaps(appt.range),
    );
    if (clash) throw new OverlapError();
    this.appointments.push(appt);
    return appt;
  }

  async findUpcomingByClinician(clinicianId: string, range: DateRange): Promise<Appointment[]> {
    return this.appointments.filter((a) => {
      if (a.clinicianId !== clinicianId) return false;
      return this.matchesRange(a, range);
    });
  }

  async findAllUpcoming(range: DateRange, page: Page): Promise<Appointment[]> {
    const matched = this.appointments.filter((a) => this.matchesRange(a, range));
    const offset = page.offset ?? 0;
    const limit = page.limit ?? matched.length;
    return matched.slice(offset, offset + limit);
  }

  private matchesRange(appt: Appointment, range: DateRange): boolean {
    const start = appt.range.start;
    if (range.from && start < range.from) return false;
    if (range.to && start >= range.to) return false;
    return true;
  }
}
