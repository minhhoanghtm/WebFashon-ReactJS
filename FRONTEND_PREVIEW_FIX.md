# Frontend Preview Fix Guide

## Problem
**Error**: `[vm] Failed to prepare VM: Timeout waiting for dev server at port 8080 to be ready.`

**Root Cause**: Backend server (Redis/MongoDB) not running, causing dev server initialization to hang.

---

## Quick Fix (Choose One)

### Option 1: Frontend Only (Fastest) ⚡
Start frontend without backend - perfect for UI/design work:

```bash
cd /vercel/share/v0-project/front-end

# Method A: Use npm (no backend needed)
npm run dev

# Method B: Use the convenience script
bash dev-server.sh

# Then open: http://localhost:3000
```

### Option 2: Full Stack (With Backend)
Start both frontend and backend together:

```bash
# Terminal 1: Start Backend
cd /vercel/share/v0-project/back-end
npm install --legacy-peer-deps
npm start

# Wait for backend to fully start...
# Terminal 2: Start Frontend
cd /vercel/share/v0-project/front-end
npm run dev

# Access: http://localhost:3000
```

---

## What We Fixed

### 1. **API Timeout Handling** ✓
- Added 5-second timeout to API calls
- App gracefully handles backend unavailable
- Users can still browse UI without backend

### 2. **Vite Dev Server Config** ✓
- Optimized HMR (Hot Module Replacement)
- Better error handling and faster reloads
- Added sourcemaps for debugging

### 3. **.env.development** ✓
- Proper environment variables for dev mode
- `VITE_API_URL` points to backend
- Easy to switch between local/remote backend

### 4. **Mock API Support** ✓
- Created `/src/api/mock.api.js` for development
- Mock user and product data available
- Can be enabled in main.jsx if needed

---

## Troubleshooting

### Dev Server Still Not Starting?

```bash
# Clear everything and restart
rm -rf node_modules pnpm-lock.yaml package-lock.json

# Reinstall
npm install --legacy-peer-deps

# Start dev server with verbose logging
npm run dev -- --host 0.0.0.0
```

### Port Already In Use?

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=4000 npm run dev
```

### Hot Reload Not Working?

```bash
# Delete .vite cache
rm -rf .vite

# Restart dev server
npm run dev
```

---

## File Changes Made

| File | Change |
|------|--------|
| `App.jsx` | Added API timeout + graceful error handling |
| `vite.config.js` | Optimized HMR, added sourcemaps |
| `.env.development` | Environment variables for dev mode |
| `src/api/mock.api.js` | Mock API for development |
| `dev-server.sh` | Convenience startup script |

---

## Next Steps

1. **For UI/Design Work**: Use Option 1 (Frontend Only)
2. **For Full Testing**: Use Option 2 (Full Stack)
3. **For Debugging**: Open DevTools (F12) → Console tab
4. **For Network Issues**: Check Network tab to see API calls

---

## Performance Tips

- Use Firefox DevTools for better performance profiling
- Chrome DevTools: Rendering → check FCP/LCP
- Check Network tab for slow requests
- Use Lighthouse (Chrome) for full audit

---

## Questions?

If you still see "Failed to load preview":
1. Check browser console (F12)
2. Check terminal output for errors
3. Make sure port 3000 is free
4. Try clearing browser cache (Ctrl+Shift+Delete)

**Happy coding! 🚀**
