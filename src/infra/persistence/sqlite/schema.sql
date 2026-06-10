CREATE TABLE IF NOT EXISTS clinician (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL DEFAULT '',
  email TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS patient (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL DEFAULT '',
  email TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS appointment (
  id          TEXT PRIMARY KEY,
  clinicianId TEXT NOT NULL REFERENCES clinician(id),
  patientId   TEXT NOT NULL REFERENCES patient(id),
  startUtc    INTEGER NOT NULL,
  endUtc      INTEGER NOT NULL,
  createdAt   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_appt_clinician_time
  ON appointment(clinicianId, startUtc, endUtc);
