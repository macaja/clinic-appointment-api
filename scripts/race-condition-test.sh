#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
BODY='{
  "clinicianId": "c99",
  "patientId":   "p1",
  "start":       "2999-12-01T10:00:00Z",
  "end":         "2999-12-01T10:30:00Z"
}'

echo "Firing two overlapping bookings in parallel..."
echo ""

TMP=$(mktemp -d)

post() {
  local id=$1
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "${BASE_URL}/appointments" \
    -H "Content-Type: application/json" \
    -H "X-Role: patient" \
    -d "$BODY")
  echo "$status" > "${TMP}/req${id}.status"
  echo "  Request ${id} → HTTP ${status}"
}

post 1 &
post 2 &
wait

STATUS1=$(cat "${TMP}/req1.status")
STATUS2=$(cat "${TMP}/req2.status")
rm -rf "$TMP"

SUCCESSES=0
CONFLICTS=0
for s in "$STATUS1" "$STATUS2"; do
  [ "$s" = "201" ] && SUCCESSES=$((SUCCESSES + 1))
  [ "$s" = "409" ] && CONFLICTS=$((CONFLICTS + 1))
done

echo ""
echo "Results:"
echo "  201 Created  : ${SUCCESSES}"
echo "  409 Conflict : ${CONFLICTS}"
echo ""

if [ "$SUCCESSES" -eq 1 ] && [ "$CONFLICTS" -eq 1 ]; then
  echo "PASS — BEGIN IMMEDIATE serialised correctly: 1 success, 1 overlap error."
else
  echo "FAIL — unexpected outcome (both may have inserted, or both failed)."
  exit 1
fi
