import Database from 'better-sqlite3';
import {
  AppointmentRepository,
  DateRange,
  Page,
} from '../../../application/ports/appointment-repository.port';
import { Appointment } from '../../../domain/appointment';
import { TimeRange } from '../../../domain/time-range';
import { OverlapError } from '../../../domain/errors';

interface AppointmentRow {
  id: string;
  clinicianId: string;
  patientId: string;
  startUtc: number;
  endUtc: number;
  createdAt: number;
}

const rowToAppointment = (row: AppointmentRow): Appointment =>
  Appointment.create({
    id: row.id,
    clinicianId: row.clinicianId,
    patientId: row.patientId,
    range: new TimeRange(row.startUtc, row.endUtc),
    now: new Date(row.createdAt),
  });

export class SqliteAppointmentRepository implements AppointmentRepository {
  private readonly candidatesStmt: Database.Statement;
  private readonly insertStmt: Database.Statement;
  private readonly findByClinicianStmt: Database.Statement;
  private readonly findByClinicianWithToStmt: Database.Statement;
  private readonly findAllStmt: Database.Statement;
  private readonly findAllWithToStmt: Database.Statement;

  constructor(private readonly db: Database.Database) {
    this.candidatesStmt = db.prepare(
      'SELECT * FROM appointment WHERE clinicianId = ? AND endUtc > ? AND startUtc < ?',
    );
    this.insertStmt = db.prepare(
      'INSERT INTO appointment (id, clinicianId, patientId, startUtc, endUtc, createdAt) VALUES (@id, @clinicianId, @patientId, @startUtc, @endUtc, @createdAt)',
    );
    this.findByClinicianStmt = db.prepare(
      'SELECT * FROM appointment WHERE clinicianId = ? AND startUtc >= ? ORDER BY startUtc ASC',
    );
    this.findByClinicianWithToStmt = db.prepare(
      'SELECT * FROM appointment WHERE clinicianId = ? AND startUtc >= ? AND startUtc < ? ORDER BY startUtc ASC',
    );
    this.findAllStmt = db.prepare(
      'SELECT * FROM appointment WHERE startUtc >= ? ORDER BY startUtc ASC LIMIT ? OFFSET ?',
    );
    this.findAllWithToStmt = db.prepare(
      'SELECT * FROM appointment WHERE startUtc >= ? AND startUtc < ? ORDER BY startUtc ASC LIMIT ? OFFSET ?',
    );
  }

  async createOverlapSafe(appt: Appointment): Promise<Appointment> {
    const txn = this.db.transaction((a: Appointment) => {
      const candidates = this.candidatesStmt.all(
        a.clinicianId,
        a.range.startMs,
        a.range.endMs,
      ) as AppointmentRow[];
      const clash = candidates.some((row) =>
        new TimeRange(row.startUtc, row.endUtc).overlaps(a.range),
      );
      if (clash) throw new OverlapError();
      this.insertStmt.run({
        id: a.id,
        clinicianId: a.clinicianId,
        patientId: a.patientId,
        startUtc: a.range.startMs,
        endUtc: a.range.endMs,
        createdAt: a.createdAt.getTime(),
      });
      return a;
    });
    return txn.immediate(appt) as Appointment;
  }

  async findUpcomingByClinician(clinicianId: string, range: DateRange): Promise<Appointment[]> {
    const fromMs = (range.from ?? new Date(0)).getTime();
    const rows = range.to
      ? (this.findByClinicianWithToStmt.all(
          clinicianId,
          fromMs,
          range.to.getTime(),
        ) as AppointmentRow[])
      : (this.findByClinicianStmt.all(clinicianId, fromMs) as AppointmentRow[]);
    return rows.map(rowToAppointment);
  }

  async findAllUpcoming(range: DateRange, page: Page): Promise<Appointment[]> {
    const fromMs = (range.from ?? new Date(0)).getTime();
    const limit = page.limit ?? 100;
    const offset = page.offset ?? 0;
    const rows = range.to
      ? (this.findAllWithToStmt.all(fromMs, range.to.getTime(), limit, offset) as AppointmentRow[])
      : (this.findAllStmt.all(fromMs, limit, offset) as AppointmentRow[]);
    return rows.map(rowToAppointment);
  }
}
