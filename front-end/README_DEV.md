# WebFashion Frontend - Development Guide

## Quick Start (30 seconds)

```bash
cd /vercel/share/v0-project/front-end
npm run dev
# Open http://localhost:3000
```

## Available Commands

```bash
npm run dev      # Start development server (with HMR)
npm run build    # Build for production
npm run preview  # Preview production build locally
```

## Environment Variables

Create `.env.development` (or use existing):
```
VITE_API_URL=http://localhost:5000
VITE_ENV=development
```

## Folder Structure

```
src/
├── api/              # API clients & interceptors
├── components/       # Reusable components
├── pages/           # Page components  
├── store/           # Zustand state management
├── config/          # Configuration files
├── styles/          # Global styles
├── utils/           # Helper functions
└── routes/          # Route definitions
```

## Key Files Modified for Preview Fix

- **App.jsx** - Added API timeout handling
- **vite.config.js** - Optimized HMR configuration  
- **.env.development** - Environment variables
- **src/api/mock.api.js** - Mock data for dev

## Styling

- **Framework**: Tailwind CSS v4
- **Color System**: Design tokens in `index.css`
- **Components**: Shadcn/ui components
- **Colors**: 
  - Primary: `#0a0a0a` (black)
  - Accent: `#06b6d4` (cyan)
  - Neutral: Grays (e5e5e5, 999999, etc)

## Testing

### Frontend Only (No Backend)
```bash
npm run dev
# API errors are handled gracefully
# Mock data available in src/api/mock.api.js
```

### Full Stack (With Backend)
```bash
# Terminal 1
cd ../back-end && npm start

# Terminal 2 (in this directory)
npm run dev
```

## Debugging

**Browser DevTools** (F12):
- Console: Check for errors
- Network: Monitor API calls
- Elements: Inspect components
- Performance: Check frame rate

**Vite Logs**:
Watch terminal for build warnings/errors

## Hot Module Replacement (HMR)

- Auto-reloads when files are saved
- Preserves component state during reload
- If HMR fails: Hard refresh with `Ctrl+Shift+R`

## Performance

- Build time: ~2 seconds
- Dev server startup: ~3 seconds
- HMR reload: ~500ms
- Bundle: 2.6MB

## Common Issues

| Issue | Solution |
|-------|----------|
| Port 3000 in use | `PORT=4000 npm run dev` |
| Module not found | `npm install --legacy-peer-deps` |
| Hot reload broken | Hard refresh: `Ctrl+Shift+R` |
| API errors | Backend may be down (check console) |

## Production Build

```bash
npm run build
# Outputs to: dist/

# Preview before deploying
npm run preview

# Check bundle size
npm run build -- --report
```

## Dependencies

- **React 19.2** - UI library
- **Vite 8** - Build tool
- **Tailwind CSS 4** - Styling
- **React Router 7** - Routing
- **Zustand 5** - State management
- **React Query 5** - Data fetching
- **Ant Design 6** - UI components
- **Socket.io** - Real-time updates

## Resources

- [Vite Docs](https://vitejs.dev)
- [React Docs](https://react.dev)
- [Tailwind Docs](https://tailwindcss.com)
- [Zustand Docs](https://zustand-demo.vercel.app)

## Getting Help

1. Check browser console (F12) for errors
2. Check terminal output for build errors
3. Review `FRONTEND_PREVIEW_FIX.md` for detailed troubleshooting
4. Check API logs if backend is running

---

**Happy coding!** 🚀
