# REACT-WebFashion — Production Deployment Runbook

This runbook provides complete, step-by-step instructions for deploying and operating **REACT-WebFashion** on a production Linux VPS or Cloud Virtual Machine (AWS EC2, DigitalOcean, Hetzner, Linode, etc.).

---

## 1. System Requirements

| Specification | Minimum | Recommended |
|---|---|---|
| **Operating System** | Ubuntu 22.04 / 24.04 LTS (x86_64) | Ubuntu 24.04 LTS |
| **CPU** | 2 vCPUs | 4 vCPUs |
| **Memory (RAM)** | 4 GB | 8 GB |
| **Storage (SSD/NVMe)** | 40 GB | 80 GB+ |
| **Docker Engine** | Docker 24.0+ | Docker 27.0+ |
| **Docker Compose** | Compose v2.20+ | Compose v2.30+ |

---

## 2. Server Preparation

Connect to your server via SSH:

```bash
ssh -i ~/.ssh/id_rsa root@YOUR_SERVER_IP
```

### 2.1. Update System & Install Essentials

```bash
apt-get update && apt-get upgrade -y
apt-get install -y curl git ufw htop jq tar gzip
```

### 2.2. Configure UFW Firewall

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable
ufw status
```

### 2.3. Install Docker Engine & Compose

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl enable --now docker
docker --version && docker compose version
```

---

## 3. Clone Repository & Setup Application

```bash
mkdir -p /opt/webfashion
cd /opt/webfashion

git clone https://github.com/minhhoanghtm/WebFashon-ReactJS.git .
git checkout main
```

---

## 4. Environment & Secrets Configuration

Create the production environment file:

```bash
cp .env.production.example .env.production
chmod 600 .env.production
```

Generate cryptographically secure tokens for authentication and cookies:

```bash
# Generate 64-character random hex strings
ACCESS_SECRET=$(openssl rand -hex 64)
REFRESH_SECRET=$(openssl rand -hex 64)
ACTION_SECRET=$(openssl rand -hex 64)
OTP_SECRET=$(openssl rand -hex 64)
REDIS_SECRET=$(openssl rand -hex 32)
MONGO_PASS=$(openssl rand -hex 24)

# Populate into .env.production
sed -i "s|change_me_super_secret_jwt_access_token_min_32_chars|$ACCESS_SECRET|g" .env.production
sed -i "s|change_me_super_secret_jwt_refresh_token_min_32_chars|$REFRESH_SECRET|g" .env.production
sed -i "s|change_me_super_secret_action_token_min_32_chars|$ACTION_SECRET|g" .env.production
sed -i "s|change_me_super_secret_otp_token_min_32_chars|$OTP_SECRET|g" .env.production
sed -i "s|webfashion_redis_secret|$REDIS_SECRET|g" .env.production
sed -i "s|webfashion_prod_pass|$MONGO_PASS|g" .env.production
```

Now open `.env.production` in nano/vim and update your domain name and payment/email credentials:

```bash
nano .env.production
```

Set:
- `DOMAIN=yourdomain.com`
- `CLIENT_URL=https://yourdomain.com`
- `FRONTEND_URL=https://yourdomain.com`
- `VNPAY_*` and `MOMO_*` payment credentials if live payment is activated.
- `EMAIL_USERNAME` and `EMAIL_PASSWORD` for transactional customer emails.

---

## 5. SSL / TLS Certificate Setup (Let's Encrypt)

Create directories for SSL certs and certbot verification:

```bash
mkdir -p /opt/webfashion/nginx/ssl
mkdir -p /opt/webfashion/nginx/certbot-www
```

### Option A: Certbot Automated Certificate
If your domain's DNS A-record already points to this server IP:

```bash
apt-get install -y certbot
certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com --non-interactive --agree-tos -m admin@yourdomain.com

# Link or copy certificates to nginx/ssl
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/webfashion/nginx/ssl/fullchain.pem
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/webfashion/nginx/ssl/privkey.pem
chmod 600 /opt/webfashion/nginx/ssl/privkey.pem
```

Update `/opt/webfashion/nginx/nginx.conf` and replace `YOUR_DOMAIN` with your actual domain name:

```bash
sed -i "s|YOUR_DOMAIN|yourdomain.com|g" /opt/webfashion/nginx/nginx.conf
```

---

## 6. Launch Production Services

Start all containers in detached mode:

```bash
docker compose -f docker-compose.production.yml up -d --build
```

### Optional: Scale the HTTP API Gateway
For higher concurrency and multi-core CPU utilization:

```bash
docker compose -f docker-compose.production.yml up -d --scale api=2 --no-recreate
```

---

## 7. Verification & Health Monitoring

Verify that all 6 containers are running and reported `healthy`:

```bash
docker compose -f docker-compose.production.yml ps
```

Expected output:
```text
NAME                     IMAGE                 STATUS                     PORTS
webfashion-proxy-prod    nginx:1.27-alpine     Up (healthy)               0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
webfashion-frontend-prod (custom build)        Up (healthy)               80/tcp
webfashion-api-1         (custom build)        Up (healthy)               5000/tcp
webfashion-worker-prod   (custom build)        Up                         
webfashion-mongo-prod    mongo:7.0             Up (healthy)               27017/tcp
webfashion-redis-prod    redis:7-alpine        Up (healthy)               6379/tcp
```

### Query Application Probes:

```bash
# External Nginx Gateway probe
curl -I https://yourdomain.com/healthz

# Backend Health probe
curl https://yourdomain.com/api/health

# Backend Liveness probe
curl https://yourdomain.com/api/health/liveness

# Backend Readiness probe
curl https://yourdomain.com/api/health/readiness
```

---

## 8. Automated Backups & Maintenance

Make backup scripts executable:

```bash
chmod +x /opt/webfashion/scripts/backup-db.sh
chmod +x /opt/webfashion/scripts/restore-db.sh
```

Add daily backup to cron:

```bash
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/webfashion/scripts/backup-db.sh /opt/webfashion/backups/mongo >> /var/log/webfashion-backup.log 2>&1") | crontab -
```

---

## 9. Zero-Downtime Updates & Rolling Deployments

When new commits are merged to `main`:

```bash
cd /opt/webfashion

# 1. Capture current commit in case rollback is needed
PREV_COMMIT=$(git rev-parse HEAD)

# 2. Pull updates
git pull origin main

# 3. Build new container images in background
docker compose -f docker-compose.production.yml build --pull api worker frontend

# 4. Recreate API service
docker compose -f docker-compose.production.yml up -d --no-deps api
sleep 8

# 5. Verify API readiness
curl -f http://127.0.0.1:5000/api/health/liveness || {
  echo "Health check failed! Rolling back..."
  git checkout $PREV_COMMIT
  docker compose -f docker-compose.production.yml up -d --build api
  exit 1
}

# 6. Update frontend and workers
docker compose -f docker-compose.production.yml up -d --no-deps frontend worker reverse-proxy

# 7. Clean up dangling images
docker image prune -f
```

---

## 10. Disaster Recovery Procedure

To restore from a backup:

```bash
./scripts/restore-db.sh /opt/webfashion/backups/mongo/webfashion_db_YYYYMMDD_HHMMSS.archive.gz --drop
```
