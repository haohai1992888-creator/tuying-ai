#!/usr/bin/env bash
# Release Candidate backup — database + env snapshot
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${ROOT}/backups/rc"
STAMP="$(date +%Y%m%d_%H%M%S)"
TARGET="${BACKUP_DIR}/${STAMP}"

mkdir -p "$TARGET"

echo "[backup-rc] database..."
bash "${ROOT}/scripts/backup-db.sh"

LATEST_PG="$(ls -t "${ROOT}/backups"/pg_*.sql.gz 2>/dev/null | head -1 || true)"
if [ -n "$LATEST_PG" ]; then
  cp "$LATEST_PG" "${TARGET}/"
fi

echo "[backup-rc] env snapshot..."
for f in .env .env.production .env.development; do
  if [ -f "${ROOT}/${f}" ]; then
    cp "${ROOT}/${f}" "${TARGET}/${f}.snapshot"
  fi
done
cp "${ROOT}/env/env.template" "${TARGET}/env.template" 2>/dev/null || true

echo "[backup-rc] done → ${TARGET}"
find "${BACKUP_DIR}" -mindepth 1 -maxdepth 1 -type d -mtime +14 -exec rm -rf {} +
