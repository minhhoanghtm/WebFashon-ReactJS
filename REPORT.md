# Redesign V2 delivery report

## Result

The frontend now enters through `front-end/src/main.jsx` → `front-end/src/App.jsx` → `front-end/src/v2/App.jsx`. Every new visual component, layout, page, route definition and stylesheet lives under `front-end/src/v2`. Existing API clients, services, stores, hooks, utilities and configuration were retained as non-UI dependencies.

## Verification

- `npm run build`: passed (Vite production bundle).
- Playwright route sweep: **47/47 desktop PASS, 47/47 mobile PASS**, zero overflow warnings; results in `test-results.json`.
- Legacy baseline captures: `screenshots/old/desktop` and `screenshots/old/mobile`.
- V2 captures: `screenshots/new/desktop` and `screenshots/new/mobile`. The asymmetric Archive / Signal layout is visibly distinct from the legacy card/boutique layouts.
- Route-run video artifacts are retained in `videos/01-desktop-all-routes.webm` and `videos/02-mobile-all-routes.webm`.
- No source import outside `src/v2` references the removed `components`, `pages`, `layouts`, `routes` or `styles` UI folders.

## Deleted legacy UI files

The legacy UI was deleted rather than edited. The full, filename-level deletion manifest is Git's authoritative diff command:

```powershell
git diff --name-only --diff-filter=D -- front-end/src
```

Deleted UI roots (including every file underneath):

- `front-end/src/components/**` — storefront, cart, chat, consent, motion, 3D, auth and admin UI components
- `front-end/src/pages/**` — all customer, auth, content and admin pages plus their CSS/assets
- `front-end/src/layouts/**` — previous Main/Auth/Admin layouts
- `front-end/src/routes/**` — previous UI router
- `front-end/src/styles/**` and `front-end/src/index.css` — legacy CSS
- `front-end/src/test/coreFlows.test.jsx` — test tied to deleted UI components

Selected removed filenames: `components/Header.jsx`, `components/Footer.jsx`, `components/ProductCard.jsx`, `components/ProtectedRoute.jsx`, `components/3d/AtelierSilkCanvas.jsx`, `layouts/MainLayout.jsx`, `layouts/AuthLayout.jsx`, `layouts/AdminLayout.jsx`, `pages/Home/index.jsx`, `pages/ProductSearch/index.jsx`, `pages/ProductDetail/index.jsx`, `pages/Cart/index.jsx`, `pages/Checkout/index.jsx`, `pages/admin/Dashboard.jsx`, `pages/profile/index.jsx`, `routes/AppRouter.jsx`, `styles/ui-refresh.css`, `styles/login.css`, and `index.css`.

## API gaps

No new UI-only API is required by V2. API failures intentionally render empty/fallback states rather than mocked business data. The pre-existing API proposals in `MISSING_APIS.md` remain backend backlog only and were not implemented or simulated.
