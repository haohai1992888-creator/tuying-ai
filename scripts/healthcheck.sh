#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:3001/api/health}"

echo "[healthcheck] probing ${API_URL}"

RESPONSE="$(curl -sf "${API_URL}" 2>/dev/null || true)"

if [ -z "$RESPONSE" ]; then
  echo "[healthcheck] FAIL — no response"
  exit 1
fi

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "[healthcheck] OK"
  echo "$RESPONSE"
  exit 0
fi

echo "[healthcheck] FAIL — unhealthy"
echo "$RESPONSE"
exit 1
