# Quick Start: Khắc phục Lỗi Deploy WebFashion

## 🎯 Problem Summary

Bạn vừa redesign UI và deploy lên server, nhưng gặp:
- ❌ 404 Not Found
- ❌ 500 Internal Server Error
- ❌ Trang bị đóng băng

## 🔥 Quick Fix (5 phút)

### Step 1: Kiểm tra Build
```bash
cd front-end
npm install --legacy-peer-deps
npm run build
# Kiểm tra dist/ folder có tồn tại không
ls -la dist/
```

### Step 2: Kiểm tra Backend
```bash
cd ../back-end
npm install
# Kiểm tra .env có tất cả variables
cat .env

# Test backend
npm start
# Nên thấy: "Server running on port 5000"
```

### Step 3: Test Locally
```bash
# Terminal 1: Backend
cd back-end && npm start

# Terminal 2: Frontend preview
cd front-end && npm run preview

# Browser: http://localhost:5000
# Kiểm tra page load & no errors in DevTools (F12)
```

### Step 4: Deploy
```bash
# Push to Git
git add .
git commit -m "Fix deploy issues"
git push origin main

# Theo platform:
# - Vercel: Auto-deploy
# - Railway: Auto-deploy
# - Manual: Copy dist/ & restart
```

---

## 🔍 Debugging by Error Type

### 404 Not Found
**Nguyên nhân:** Đường dẫn không khớp hoặc file không tìm thấy

**Fix:**
```bash
# Kiểm tra dist folder
ls -la front-end/dist/index.html

# Rebuild nếu không có
cd front-end
npm run build
```

### 500 Internal Server Error
**Nguyên nhân:** Backend API lỗi

**Fix:**
```bash
# Kiểm tra logs
cd back-end
npm start 2>&1 | tail -20

# Kiểm tra .env
cat .env | grep DATABASE_URL

# Test API
curl http://localhost:5000/api/products
```

### Trang Đóng Băng
**Nguyên nhân:** Infinite loop, heavy rendering, hoặc API không responsive

**Fix:**
```bash
# Kiểm tra browser console (F12)
# Tìm red errors

# Kiểm tra Network tab
# Xem có request pending không

# Kiểm tra file CSS
grep -r "infinite\|@keyframes" src/index.css

# Optimize bundle
npm run build
npm run preview
```

---

## 📋 Environment Variables Checklist

### Frontend (.env.local)
```
✓ VITE_API_BASE_URL=http://localhost:5000/api
(hoặc production URL)
```

### Backend (.env)
```
✓ PORT=5000
✓ DATABASE_URL=mongodb://...
✓ JWT_SECRET=strong-secret-key
✓ FRONTEND_URL=http://localhost:3000
(hoặc production URL)
```

---

## 🚀 Deploy Platforms

| Platform | Command/Setup | Cost | Best For |
|----------|---------------|------|----------|
| **Vercel** | `vercel` | Free tier | Frontend |
| **Railway** | Connect GitHub | $5+ | Full-stack |
| **Docker** | `docker-compose up` | Infra cost | Any server |
| **VPS** | Manual setup | $5-20/mo | Full control |

---

## 💾 Files Created for You

Tôi đã tạo các guide đầy đủ:

1. **DEPLOYMENT_TROUBLESHOOTING.md** - Hướng dẫn chi tiết 7 lỗi phổ biến
2. **OPTIMIZATION_GUIDE.md** - Cách optimize hiệu suất
3. **DEPLOY_PLATFORMS.md** - Cách deploy lên các platform
4. **check-deployment.sh** - Script tự động kiểm tra
5. **setup-deploy.sh** - Script setup deploy

---

## 🎬 Step-by-step Deploy Guides

### Vercel (Easiest)
```bash
npm install -g vercel
vercel login
vercel
# Follow prompts
```

### Railway
1. GitHub → https://railway.app
2. New Project → Select repo
3. Set environment variables
4. Deploy

### Manual Server
```bash
# SSH to server
ssh root@your-ip

# Install Node
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs nginx

# Deploy
git clone your-repo
cd your-repo
npm install --legacy-peer-deps
npm run build
npm start (with PM2)
```

---

## ✅ Pre-Deploy Checklist

- [ ] `npm run build` thành công
- [ ] `dist/` folder có `index.html`
- [ ] `.env` file có tất cả variables
- [ ] Backend API chạy OK
- [ ] `npm run preview` không lỗi
- [ ] Browser DevTools (F12) không có red errors
- [ ] Network tab không có failed requests
- [ ] CORS được config đúng

---

## 🆘 Still Having Issues?

### Check These Files:

1. **Front-end errors:**
   - Open DevTools (F12) → Console tab
   - Look for red errors
   - Check Network tab for failed requests

2. **Back-end errors:**
   - Run `npm start` & check console
   - Run `curl http://localhost:5000/api/health`
   - Check logs for database connection errors

3. **Build errors:**
   - Run `npm run build` & check output
   - Run `npm run lint` to find code issues
   - Check imports/syntax

### Get Detailed Help:

See **DEPLOYMENT_TROUBLESHOOTING.md** for:
- Exact error messages & solutions
- Debugging commands
- Environment setup
- Security checklist

---

## 🎯 Most Common Issues After UI Redesign

**Issue:** CSS colors not applying
**Solution:** Ensure `index.css` is imported in `main.jsx`

**Issue:** Components not rendering
**Solution:** Check all imports are correct (no typos after file moves)

**Issue:** Build too large
**Solution:** See OPTIMIZATION_GUIDE.md for code splitting

**Issue:** API endpoints returning 404
**Solution:** Check CORS in backend is configured for frontend domain

---

## 📞 Support Resources

- **Vite Docs:** https://vitejs.dev/guide/ssr.html
- **React Router:** https://reactrouter.com/
- **Vercel Deploy:** https://vercel.com/docs/
- **Railway Deploy:** https://docs.railway.app/
- **MongoDB Atlas:** https://docs.atlas.mongodb.com/

---

## 🚀 You're Ready!

Follow these steps in order:
1. Fix any build errors
2. Test locally
3. Set environment variables
4. Choose deployment platform
5. Deploy & verify

Good luck! 🎉
