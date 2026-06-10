#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "GET ${BASE_URL}/appointments  (X-Role: patient) — expects 403"
curl -sS -w '\nHTTP %{http_code}\n' \
  "${BASE_URL}/appointments" \
  -H 'X-Role: patient'
