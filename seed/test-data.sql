-- Clinicians
INSERT OR IGNORE INTO clinician (id, name) VALUES ('c1', 'Dr. Alice Smith');
INSERT OR IGNORE INTO clinician (id, name) VALUES ('c2', 'Dr. Bob Jones');
INSERT OR IGNORE INTO clinician (id, name) VALUES ('c3', 'Dr. Carol White');

-- Patients
INSERT OR IGNORE INTO patient (id, name) VALUES ('p1', 'Patient One');
INSERT OR IGNORE INTO patient (id, name) VALUES ('p2', 'Patient Two');
INSERT OR IGNORE INTO patient (id, name) VALUES ('p3', 'Patient Three');

-- c1 clean future slot: 2999-06-01 10:00–11:00 UTC
-- A normal booking reviewers can observe
INSERT OR IGNORE INTO appointment (id, clinicianId, patientId, startUtc, endUtc, createdAt)
VALUES ('a1', 'c1', 'p1', 32473872000000, 32473875600000, 32473872000000);

-- c1 adjacent slot (touching): 2999-06-01 11:00–12:00 UTC
-- end of a1 == start of a2, so they do NOT overlap — both succeed
INSERT OR IGNORE INTO appointment (id, clinicianId, patientId, startUtc, endUtc, createdAt)
VALUES ('a2', 'c1', 'p2', 32473875600000, 32473879200000, 32473875600000);

-- c1 third slot: 2999-06-01 14:00–15:00 UTC
-- Posting a new booking at 14:30–15:30 for c1 will trigger a 409
INSERT OR IGNORE INTO appointment (id, clinicianId, patientId, startUtc, endUtc, createdAt)
VALUES ('a3', 'c1', 'p3', 32473890000000, 32473893600000, 32473890000000);

-- c2 independent slot: 2999-06-02 09:00–10:00 UTC
-- Same time as c1 has nothing — different clinician, no conflict
INSERT OR IGNORE INTO appointment (id, clinicianId, patientId, startUtc, endUtc, createdAt)
VALUES ('a4', 'c2', 'p1', 32473954800000, 32473958400000, 32473954800000);
