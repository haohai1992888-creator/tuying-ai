#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${ROOT}/backups"
STAMP="$(date +%Y%m%d_%H%M%S)"
FILE="${BACKUP_DIR}/pg_${STAMP}.sql"

mkdir -p "$BACKUP_DIR"

source "${ROOT}/.env" 2>/dev/null || true
source "${ROOT}/.env.production" 2>/dev/null || true

DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/ai_commerce_studio?schema=public}"

echo "[backup] dumping to ${FILE}"
pg_dump "$DB_URL" > "$FILE"
gzip -f "$FILE"
echo "[backup] done: ${FILE}.gz"

# Keep last 14 days
find "$BACKUP_DIR" -name 'pg_*.sql.gz' -mtime +14 -delete
