#!/bin/bash
# vps-setup.sh — Chạy 1 lần trên VPS Ubuntu 22.04 mới
# Cách dùng: bash scripts/vps-setup.sh yourdomain.com
#
# Script này sẽ:
#   1. Cài Docker + Docker Compose
#   2. Cài Certbot (SSL)
#   3. Clone project
#   4. Hướng dẫn các bước tiếp theo

set -e

DOMAIN=${1:?"Thiếu domain. Cách dùng: bash vps-setup.sh yourdomain.com"}
APP_DIR=/opt/webfashion
REPO_URL="https://github.com/YOUR_USERNAME/REACT-WebFashion.git"  # ← đổi lại

echo ""
echo "════════════════════════════════════════"
echo "  WebFashion VPS Setup"
echo "  Domain: $DOMAIN"
echo "════════════════════════════════════════"
echo ""

# ── 1. Cập nhật hệ thống ──────────────────────────────────────────
echo "[1/5] Cập nhật hệ thống..."
apt-get update -q && apt-get upgrade -y -q

# ── 2. Cài Docker ────────────────────────────────────────────────
echo "[2/5] Cài Docker..."
if ! command -v docker &> /dev/null; then
    apt-get install -y -q ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
      https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -q
    apt-get install -y -q docker-ce docker-ce-cli containerd.io docker-compose-plugin
    echo "Docker installed: $(docker --version)"
else
    echo "Docker đã cài: $(docker --version)"
fi

# ── 3. Cài Certbot ───────────────────────────────────────────────
echo "[3/5] Cài Certbot..."
if ! command -v certbot &> /dev/null; then
    apt-get install -y -q certbot
fi

# ── 4. Clone project ─────────────────────────────────────────────
echo "[4/5] Clone project vào $APP_DIR..."
if [ ! -d "$APP_DIR/.git" ]; then
    git clone "$REPO_URL" "$APP_DIR"
else
    echo "Project đã tồn tại, bỏ qua clone."
fi
mkdir -p "$APP_DIR/nginx/ssl"

# ── 5. Lấy SSL certificate ───────────────────────────────────────
echo "[5/5] Lấy SSL certificate cho $DOMAIN..."
certbot certonly --standalone \
    -d "$DOMAIN" \
    --non-interactive \
    --agree-tos \
    -m "admin@$DOMAIN" || echo "⚠️  Certbot thất bại — kiểm tra DNS đã trỏ về VPS chưa."

if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$APP_DIR/nginx/ssl/"
    cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem"   "$APP_DIR/nginx/ssl/"
    echo "SSL cert đã copy vào $APP_DIR/nginx/ssl/"
fi

# ── Hướng dẫn tiếp theo ──────────────────────────────────────────
echo ""
echo "════════════════════════════════════════"
echo "  ✅ Setup xong! Các bước tiếp theo:"
echo "════════════════════════════════════════"
echo ""
echo "  cd $APP_DIR"
echo ""
echo "  # 1. Tạo file .env.production"
echo "  cp .env.example back-end/.env.production"
echo "  nano back-end/.env.production"
echo ""
echo "  # 2. Đổi YOUR_DOMAIN trong nginx config"
echo "  sed -i 's/YOUR_DOMAIN/$DOMAIN/g' nginx/nginx.conf"
echo ""
echo "  # 3. Tạo .env cho docker-compose.prod.yml"
echo "  echo 'DOMAIN=$DOMAIN' > .env"
echo "  echo 'MONGO_USER=admin' >> .env"
echo "  echo 'MONGO_PASS=your_strong_password' >> .env"
echo ""
echo "  # 4. Khởi động"
echo "  docker compose -f docker-compose.prod.yml up -d --build"
echo ""
echo "  # 5. Cài auto-renew SSL (chạy 1 lần)"
echo "  (crontab -l 2>/dev/null; echo \"0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/$DOMAIN/*.pem $APP_DIR/nginx/ssl/ && docker compose -f $APP_DIR/docker-compose.prod.yml restart nginx\") | crontab -"
echo ""
