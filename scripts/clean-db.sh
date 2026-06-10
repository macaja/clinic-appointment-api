#!/usr/bin/env bash
set -euo pipefail

DB_PATH="${DATABASE_PATH:-./data/clinic.db}"

if [ ! -f "$DB_PATH" ]; then
  echo "No database found at ${DB_PATH}, nothing to clean."
  exit 0
fi

sqlite3 "$DB_PATH" "DELETE FROM appointment; DELETE FROM clinician; DELETE FROM patient;"

echo "Cleared all rows from appointment, clinician, and patient in ${DB_PATH}."
