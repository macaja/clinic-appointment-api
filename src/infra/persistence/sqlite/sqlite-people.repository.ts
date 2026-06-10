import Database from 'better-sqlite3';
import { PeopleRepository } from '../../../application/ports/people-repository.port';

export class SqlitePeopleRepository implements PeopleRepository {
  private readonly insertClinicianStmt: Database.Statement;
  private readonly insertPatientStmt: Database.Statement;

  constructor(private readonly db: Database.Database) {
    this.insertClinicianStmt = db.prepare('INSERT OR IGNORE INTO clinician (id) VALUES (?)');
    this.insertPatientStmt = db.prepare('INSERT OR IGNORE INTO patient (id) VALUES (?)');
  }

  async ensureClinician(id: string): Promise<void> {
    this.insertClinicianStmt.run(id);
  }

  async ensurePatient(id: string): Promise<void> {
    this.insertPatientStmt.run(id);
  }
}
