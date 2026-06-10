import Database from 'better-sqlite3';
import { createDb } from './db';
import { SqlitePeopleRepository } from './sqlite-people.repository';

const makeRepo = () => {
  const db = createDb(':memory:');
  const repo = new SqlitePeopleRepository(db);
  return { db, repo };
};

const countRows = (db: Database.Database, table: string, id: string): number => {
  const row = db.prepare(`SELECT COUNT(*) as n FROM ${table} WHERE id = ?`).get(id) as {
    n: number;
  };
  return row.n;
};

describe('SqlitePeopleRepository', () => {
  it('should insert exactly one clinician row when ensuring a new id', () => {
    const { db, repo } = makeRepo();

    repo.ensureClinician('c1');

    expect(countRows(db, 'clinician', 'c1')).toBe(1);
  });

  it('should be idempotent when ensuring the same clinician id twice', () => {
    const { db, repo } = makeRepo();

    repo.ensureClinician('c1');
    repo.ensureClinician('c1');

    expect(countRows(db, 'clinician', 'c1')).toBe(1);
  });

  it('should insert exactly one patient row when ensuring a new id', () => {
    const { db, repo } = makeRepo();

    repo.ensurePatient('p1');

    expect(countRows(db, 'patient', 'p1')).toBe(1);
  });

  it('should be idempotent when ensuring the same patient id twice', () => {
    const { db, repo } = makeRepo();

    repo.ensurePatient('p1');
    repo.ensurePatient('p1');

    expect(countRows(db, 'patient', 'p1')).toBe(1);
  });
});
