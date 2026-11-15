#!/usr/bin/env bash
# ==============================================================================
# REACT-WebFashion — Automated MongoDB Backup Script
# Usage: ./scripts/backup-db.sh [backup_dir]
# Cron example (Daily at 02:00 AM):
# 0 2 * * * /opt/webfashion/scripts/backup-db.sh /opt/webfashion/backups >> /var/log/db-backup.log 2>&1
# ==============================================================================

set -euo pipefail

# Configuration
BACKUP_DIR="${1:-./backups/mongo}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="webfashion_db_${TIMESTAMP}.archive.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"
RETENTION_DAYS=14

# Database credentials (defaults from environment or docker-compose)
MONGO_CONTAINER="${MONGO_CONTAINER:-webfashion-mongo-prod}"
MONGO_USER="${MONGO_USER:-webfashion_admin}"
MONGO_PASS="${MONGO_PASS:-webfashion_prod_pass}"
MONGO_DB="${MONGO_DB:-webfashion}"

echo "=========================================================="
echo " Starting MongoDB backup at $(date)"
echo " Database: ${MONGO_DB}"
echo " Destination: ${BACKUP_PATH}"
echo "=========================================================="

mkdir -p "${BACKUP_DIR}"

# Execute backup via docker container if running in docker, or mongodump directly
if docker ps --format '{{.Names}}' | grep -q "^${MONGO_CONTAINER}$"; then
    echo "Backing up via Docker container: ${MONGO_CONTAINER}..."
    docker exec "${MONGO_CONTAINER}" mongodump \
        --username="${MONGO_USER}" \
        --password="${MONGO_PASS}" \
        --authenticationDatabase=admin \
        --db="${MONGO_DB}" \
        --archive --gzip > "${BACKUP_PATH}"
else
    echo "Docker container ${MONGO_CONTAINER} not found. Attempting host mongodump..."
    mongodump \
        --uri="${MONGO_CONNECTIONSTRING:-mongodb://${MONGO_USER}:${MONGO_PASS}@127.0.0.1:27017/${MONGO_DB}?authSource=admin}" \
        --archive="${BACKUP_PATH}" \
        --gzip
fi

# Verify backup file size
if [ -s "${BACKUP_PATH}" ]; then
    FILE_SIZE=$(du -h "${BACKUP_PATH}" | cut -f1)
    echo "✅ Backup completed successfully: ${BACKUP_PATH} (${FILE_SIZE})"
    
    # Calculate SHA256 checksum for integrity verification
    if command -v sha256sum > /dev/null; then
        sha256sum "${BACKUP_PATH}" > "${BACKUP_PATH}.sha256"
        echo "✅ SHA256 checksum created: ${BACKUP_PATH}.sha256"
    fi
else
    echo "❌ ERROR: Backup file is empty or was not created!"
    exit 1
fi

# Retention policy: delete backups older than RETENTION_DAYS
echo "Applying retention policy: removing backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "webfashion_db_*.archive.gz*" -mtime "+${RETENTION_DAYS}" -exec rm -f {} \; -print || true

echo "Backup workflow finished at $(date)"
