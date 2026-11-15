#!/usr/bin/env bash
# ==============================================================================
# REACT-WebFashion — Automated MongoDB Disaster Recovery / Restore Script
# Usage: ./scripts/restore-db.sh <path_to_backup_archive.gz> [--drop]
# ==============================================================================

set -euo pipefail

if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <path_to_backup_archive.gz> [--drop]"
    echo "Example: $0 ./backups/mongo/webfashion_db_20261116.archive.gz --drop"
    exit 1
fi

BACKUP_FILE="$1"
DROP_FLAG=""

if [ "${2:-}" = "--drop" ]; then
    DROP_FLAG="--drop"
    echo "⚠️ WARNING: --drop flag passed! Existing collections will be replaced!"
fi

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "❌ ERROR: Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

# Verify SHA256 checksum if present
if [ -f "${BACKUP_FILE}.sha256" ] && command -v sha256sum > /dev/null; then
    echo "Verifying SHA256 checksum..."
    sha256sum -c "${BACKUP_FILE}.sha256" || {
        echo "❌ ERROR: Checksum verification failed! File may be corrupt."
        exit 1
    }
    echo "✅ Checksum verified."
fi

MONGO_CONTAINER="${MONGO_CONTAINER:-webfashion-mongo-prod}"
MONGO_USER="${MONGO_USER:-webfashion_admin}"
MONGO_PASS="${MONGO_PASS:-webfashion_prod_pass}"
MONGO_DB="${MONGO_DB:-webfashion}"

echo "=========================================================="
echo " Starting MongoDB restore at $(date)"
echo " Source: ${BACKUP_FILE}"
echo " Database: ${MONGO_DB}"
echo "=========================================================="

if docker ps --format '{{.Names}}' | grep -q "^${MONGO_CONTAINER}$"; then
    echo "Restoring into Docker container: ${MONGO_CONTAINER}..."
    docker exec -i "${MONGO_CONTAINER}" mongorestore \
        --username="${MONGO_USER}" \
        --password="${MONGO_PASS}" \
        --authenticationDatabase=admin \
        --db="${MONGO_DB}" \
        --archive --gzip ${DROP_FLAG} < "${BACKUP_FILE}"
else
    echo "Docker container not found. Restoring directly via host mongorestore..."
    mongorestore \
        --uri="${MONGO_CONNECTIONSTRING:-mongodb://${MONGO_USER}:${MONGO_PASS}@127.0.0.1:27017/${MONGO_DB}?authSource=admin}" \
        --archive="${BACKUP_FILE}" \
        --gzip ${DROP_FLAG}
fi

echo "✅ Database restore successfully completed at $(date)!"
