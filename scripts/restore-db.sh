#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 backups/pg_YYYYMMDD_HHMMSS.sql[.gz]"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FILE="$1"

source "${ROOT}/.env" 2>/dev/null || true
source "${ROOT}/.env.production" 2>/dev/null || true

DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/ai_commerce_studio?schema=public}"

if [[ "$FILE" == *.gz ]]; then
  gunzip -c "$FILE" | psql "$DB_URL"
else
  psql "$DB_URL" < "$FILE"
fi

echo "[restore] completed from $FILE"
