#!/bin/sh
set -eu

BACKUP_DIR="/backups"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
INTERVAL_SECONDS="${BACKUP_INTERVAL_SECONDS:-86400}"

mkdir -p "$BACKUP_DIR"

while true; do
  timestamp=$(date +%Y%m%d-%H%M%S)
  file="$BACKUP_DIR/atcalendar-$timestamp.sql.gz"
  echo "[backup] dumping database to $file"
  pg_dump "$DATABASE_URL" | gzip > "$file"

  echo "[backup] pruning backups older than $RETENTION_DAYS days"
  find "$BACKUP_DIR" -name "atcalendar-*.sql.gz" -mtime "+$RETENTION_DAYS" -delete

  sleep "$INTERVAL_SECONDS"
done
