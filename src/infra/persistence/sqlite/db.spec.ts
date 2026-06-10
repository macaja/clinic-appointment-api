import { createDb } from './db';

describe('createDb', () => {
  it('should create all three tables when opening :memory:', () => {
    const db = createDb(':memory:');

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as Array<{ name: string }>;
    const names = tables.map((t) => t.name);

    expect(names).toContain('clinician');
    expect(names).toContain('patient');
    expect(names).toContain('appointment');
  });

  it('should create the clinician_time index when opening :memory:', () => {
    const db = createDb(':memory:');

    const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index'").all() as Array<{
      name: string;
    }>;
    const names = indexes.map((i) => i.name);

    expect(names).toContain('idx_appt_clinician_time');
  });

  it('should have foreign_keys pragma enabled', () => {
    const db = createDb(':memory:');

    const [row] = db.pragma('foreign_keys') as Array<{ foreign_keys: number }>;

    expect(row.foreign_keys).toBe(1);
  });
});
