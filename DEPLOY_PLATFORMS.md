# Hướng dẫn Deploy cho Các Platform Khác nhau

## 1. VERCEL (Recommended cho Frontend)

```bash
# Install & Login
npm install -g vercel
vercel login

# Deploy
vercel

# Set VITE_API_BASE_URL in Vercel Dashboard
```

## 2. HEROKU (Full-stack)

```bash
# Setup
heroku login
heroku create your-app-name
heroku config:set DATABASE_URL=mongodb://...
git push heroku main
```

## 3. RAILWAY (Best for Full-stack)

1. Connect GitHub repo
2. Add services (backend, database)
3. Set environment variables
4. Auto-deploy on git push

## 4. DOCKER (Self-hosted)

```bash
docker-compose up -d
# Deploy to any cloud (AWS, DigitalOcean, etc)
```

## 5. VPS with Nginx + PM2

```bash
# SSH to server
ssh root@your-ip

# Install Node
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs nginx

# Setup
npm install -g pm2
git clone your-repo
cd your-repo
npm install --legacy-peer-deps

# Build & Deploy
npm run build
pm2 start back-end/src/server.js
```

## Environment Variables

### Frontend (.env.local)
```
VITE_API_BASE_URL=https://api.your-domain.com
```

### Backend (.env)
```
PORT=5000
DATABASE_URL=mongodb://...
JWT_SECRET=your-secret-key
FRONTEND_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com
```

## Quick Deploy Checklist

- [ ] Build successful: npm run build
- [ ] No errors: npm run lint
- [ ] Environment variables set
- [ ] Database connection works
- [ ] CORS configured
- [ ] Remove debug statements
- [ ] Test in preview mode
- [ ] Deploy & verify
