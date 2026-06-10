#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
CLINICIAN_ID="${CLINICIAN_ID:-c1}"

echo "GET ${BASE_URL}/clinicians/${CLINICIAN_ID}/appointments  (X-Role: clinician)"
curl -sS -w '\nHTTP %{http_code}\n' \
  "${BASE_URL}/clinicians/${CLINICIAN_ID}/appointments" \
  -H 'X-Role: clinician'
