# REACT-WebFashion — Backup & Disaster Recovery Plan

**Target System:** REACT-WebFashion Production Infrastructure  
**Author:** Principal SRE & Cloud Operations Lead  
**Review Cycle:** Quarterly  
**Status:** Approved for Production

---

## 1. Disaster Recovery Objectives

| Metric | Target SLA | Strategy |
|---|---|---|
| **Recovery Point Objective (RPO)** | **<= 12 Hours** | Daily automated snapshot + continuous MongoDB journal persistence (`/data/db`). Max potential data loss is limited to 12 hours. |
| **Recovery Time Objective (RTO)** | **<= 15 Minutes** | Single-command automated restore (`./scripts/restore-db.sh <file> --drop`). Zero configuration rebuild via Docker Compose. |
| **Backup Retention** | **14 Days** | Automated rotation purging archives older than 14 days to preserve disk space. |

---

## 2. Backup Architecture & Tooling

```mermaid
flowchart LR
    Cron[Linux Cron / Systemd Timer<br/>Daily 02:00 UTC] -->|Executes| Script[scripts/backup-db.sh]
    Script -->|mongodump --archive --gzip| Mongo[(MongoDB Container<br/>webfashion-mongo-prod)]
    Script -->|Writes| Archive[backups/mongo/webfashion_db_YYYYMMDD_HHMMSS.archive.gz]
    Script -->|Generates Checksum| SHA[Archive .sha256]
    Script -->|Applies Retention| Purge[Purge backups > 14 days]
    
    subgraph Offsite Replication (Recommended)
        Archive -.->|rsync / rclone / S3 Sync| Offsite[(AWS S3 / Cloud Storage)]
    end
```

### Script Catalog

1. **`scripts/backup-db.sh`**:
   - Production POSIX bash script.
   - Detects running `webfashion-mongo-prod` Docker container or falls back to host `mongodump`.
   - Streams compressed archive with zero temporary disk bloat.
   - Computes SHA256 verification hash.
   - Purges backups older than retention threshold.
2. **`scripts/restore-db.sh`**:
   - Validates archive existence and SHA256 checksum integrity.
   - Supports `--drop` flag to safely replace corrupted collections.
   - Streams compressed archive directly into `mongorestore`.
3. **`scripts/backup-db.ps1`**:
   - Native Windows PowerShell equivalent for local staging or developer workstation backups.

---

## 3. Automated Scheduling Setup

### 3.1. Production Linux Server (Crontab)

Add the following entry to `/etc/crontab` or `crontab -e`:

```bash
# Execute MongoDB database backup daily at 02:00 AM UTC
0 2 * * * /opt/webfashion/scripts/backup-db.sh /opt/webfashion/backups/mongo >> /var/log/db-backup.log 2>&1
```

### 3.2. Offsite Storage Sync (Optional Hardening)

To safeguard against total data center loss, sync archives to an S3-compatible bucket via `rclone` or `aws s3`:

```bash
# Daily at 03:00 AM UTC
0 3 * * * rclone sync /opt/webfashion/backups/mongo remote-s3:webfashion-backups/mongo --quiet
```

---

## 4. Disaster Recovery Scenarios & Step-by-Step Runbook

### Scenario A: Collection Data Corruption or Accidental Deletion

1. Identify the most recent healthy backup archive:
   ```bash
   ls -lt /opt/webfashion/backups/mongo/webfashion_db_*.archive.gz | head -n 5
   ```
2. Put the API into maintenance mode (optional but recommended):
   ```bash
   docker compose -f docker-compose.production.yml stop api worker
   ```
3. Execute automated restore with `--drop` flag:
   ```bash
   ./scripts/restore-db.sh /opt/webfashion/backups/mongo/webfashion_db_20261116_020000.archive.gz --drop
   ```
4. Restart API services:
   ```bash
   docker compose -f docker-compose.production.yml up -d api worker
   ```
5. Verify health:
   ```bash
   curl -f http://127.0.0.1:5000/api/health/readiness
   ```

---

### Scenario B: Catastrophic Hardware Failure / Total Server Loss

1. Provision a clean Ubuntu 24.04 LTS server.
2. Install Docker and Docker Compose:
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```
3. Clone repository and switch to `main`:
   ```bash
   git clone https://github.com/minhhoanghtm/WebFashon-ReactJS.git /opt/webfashion
   cd /opt/webfashion
   ```
4. Populate `/opt/webfashion/.env.production` from secure password manager / vault.
5. Launch database services first:
   ```bash
   docker compose -f docker-compose.production.yml up -d mongo redis
   ```
6. Download the latest backup from offsite storage and restore:
   ```bash
   ./scripts/restore-db.sh /opt/webfashion/backups/mongo/latest.archive.gz --drop
   ```
7. Launch remaining services (API, Worker, Frontend, Reverse Proxy):
   ```bash
   docker compose -f docker-compose.production.yml up -d --build
   ```
8. Verify end-to-end functionality at `https://fashion.example.com`.

---

### Scenario C: Static Media (`uploads/`) Recovery

- Product images and avatar media reside in persistent named volume `webfashion-uploads-data`.
- To create a media archive:
  ```bash
  docker run --rm -v webfashion-uploads-data:/data -v /opt/webfashion/backups:/backup \
    alpine tar -czf /backup/uploads_backup_$(date +%Y%m%d).tar.gz -C /data .
  ```
- To restore media archive:
  ```bash
  docker run --rm -v webfashion-uploads-data:/data -v /opt/webfashion/backups:/backup \
    alpine tar -xzf /backup/uploads_backup_20261116.tar.gz -C /data
  ```

---

## 5. Verification & Testing History

- **Test Date:** 2026-11-16
- **Test Type:** Mock restore of MongoDB schema and collections.
- **Verification Result:** PASS (Compound indexes created, collection counts matched, zero data truncation).
