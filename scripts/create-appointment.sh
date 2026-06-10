#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "POST ${BASE_URL}/appointments  (X-Role: patient)"
curl -sS -w '\nHTTP %{http_code}\n' \
  -X POST "${BASE_URL}/appointments" \
  -H 'X-Role: patient' \
  -H 'Content-Type: application/json' \
  -d '{
    "clinicianId": "c1",
    "patientId": "p1",
    "start": "2999-07-01T09:00:00Z",
    "end":   "2999-07-01T09:30:00Z"
  }'
