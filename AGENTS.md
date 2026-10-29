# AGENTS.md

## Repo layout

Two **independent** packages (no root `package.json`, no workspaces, no CI):

- `Api/` — Express + Sequelize (PostgreSQL/Neon), **CommonJS**, entry `Api/index.js`
- `Cliente/` — React 18 + Vite SPA, **ESM**, entry `Cliente/src/main.jsx` → `App.jsx`

Each deploys as its own Vercel project (both have `vercel.json`). Always run npm commands from **inside** the package dir.

## Commands

```bash
# Cliente (port 5173)
npm run dev        # Vite dev server
npm run build

# Api (port 3000, nodemon)
npm run dev
```

- **`npm run lint` (Cliente) is broken.** `Cliente/eslint.config.js` contains a JSX copy of `Paginas/Editor.jsx` instead of ESLint config (committed since `9d11638`); lint crashes with `SyntaxError: Unexpected token '<'`. Restore a real flat config before relying on lint — do not assume linting passes.
- There are **no tests, no typecheck, no CI**.

## Environment

- **Both `.env` files are tracked in git as TEMPLATES** (placeholders only — never put real secrets in them; GitHub Push Protection blocks pushes containing secrets). Real local values go in `Api/.env.local` / `Cliente/.env.local` (gitignored; Vite loads `.env.local` automatically, `Api/config.js` loads it with `override` after `.env`). Production values go in each Vercel project's Environment Variables.
- `Cliente/.env`: `VITE_API_URL` (every API call flows through `Cliente/src/config.js`), `VITE_NUMBER_PHONE`, `VITE_CLOUDINARY_NAME`, `VITE_CLOUDINARY_PRESET`, `VITE_CLOUDINARY_PRESET_DTF`, `VITE_CLOUDINARY_PRESET_BANNER`, `VITE_GOOGLE_CLIENT_ID`, `VITE_FACEBOOK_APP_ID`. Only `VITE_*` vars reach the browser; they're read at **build** time.
- Social login (frontend): `GoogleOAuthProvider` wraps the app in `main.jsx` only when `VITE_GOOGLE_CLIENT_ID` exists. `Componentes/SocialAuthButtons.jsx` (Google button via `@react-oauth/google`, Facebook via `src/facebookSdk.js` — official SDK, no extra dependency) is used in `InicioSecion.jsx` and `Registro.jsx`; buttons hide themselves when IDs are missing. On success they set the session via `AuthContext.loginWithSocial`.
- `authContext.jsx`: session timers live in refs (never state), activity listener is throttled (1/min), storage parse is crash-safe, `logout` always clears local state, `refreshUserData` calls `GET /api/auth/me`.
- `Api/.env`: `DB_HOST` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` / `DB_PORT` (+ `_GIO` variants), `DB_DIALECT`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`; `Api/config.js` builds the Postgres URL from them (`DATABASE_URL` wins if set).
- Dev CORS origin is hardcoded to `http://localhost:5173` in `Api/config.js`; production uses `FRONTEND_URL`. Cookies require `credentials: true` (already configured) — the client must send axios requests with `withCredentials: true`.
- **`sequelize.sync()` only runs when `NODE_ENV !== "production"`.** Model files in `Api/DataBase/models/` are the source of truth. In production the schema is applied by `ensurePricingSchema()` (`Api/DataBase/ensurePricing.js`), which is idempotent: it resolves with **2 read-only queries when everything is in place** and only opens a transaction (advisory lock + `lock_timeout`) when something is actually missing. SQL migrations live in `Api/migrations/` and are run **manually** in the Neon console (there is no runner in prod).
- DB runtime tuning (all optional): `DB_SSL=false` disables SSL (to run the production path against a local Postgres), `DB_CONNECT_ATTEMPTS` (default 3), `DB_DEBUG=true` makes `GET /health` return the real DB error message. `GET /` and `GET /health` do not touch the DB, so a `200` on `/` plus `503` on `/api/*` means "function is up, database is the problem". The DB init promise is retried on the next request after a failure (never cached as rejected).
- **Vercel's `DATABASE_URL` is Neon's DIRECT connection string (no `-pooler`).** That is deliberate and is what works in production; the pooled string caused problems before. Don't switch it back without measuring. The app logs the host it connects to on every cold start.

## Backend conventions

- Route flow: `Api/Rutas/` → `Api/Controllers/` → `Api/DataBase/models/`.
- Mounted endpoints: `/api/posts`, `/api/auth`, `/api/user`, `/api/banner`, `/api/dtf`, `/api/category`.
- Auth: JWT (`jsonwebtoken`, 12h `expiresIn`) stored in the httpOnly cookie `access_token`. The secret is `JWT_SECRET` from `Api/config.js` (`process.env.JWT_SECRET`, dev fallback `"jwtkey"`) — all controllers import it from config; never hardcode.
- Session emission is centralized in `issueSession(res, user)` (`Controllers/auth.js`) — reused by traditional login and social auth. Cookie flags depend on `process.env.NODE_ENV === "production"` (Secure + SameSite=None only in prod).
- Social auth (`Controllers/socialAuth.js`): `POST /api/auth/google {credential}` verifies the Google ID token with `google-auth-library` (aud = `GOOGLE_CLIENT_ID`), requires `email_verified`; auto-links a verified-Google email to an existing account. `POST /api/auth/facebook {accessToken}` validates via Graph `debug_token` + `/me` (native fetch, Node 18+); Facebook does NOT auto-link by email. `GET /api/auth/me` returns the cookie-verified user (no password). Needs `GOOGLE_CLIENT_ID`, `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` in `Api/.env` (endpoints return 503 while empty).
- `usuarios` table: `username`/`password` nullable (social accounts), `googleId`/`facebookId` unique nullable, email must be unique — prod migration is manual: `Api/migrations/001_social_auth.sql` (run the duplicate-email pre-check FIRST; sync() never runs in prod).
- **API errors are returned as plain JSON strings**, not objects: `res.status(409).json("Usuario Existente")`. Client code reads `err.response?.data` directly (sometimes it's an object — check the specific controller before assuming).
- Production DB (Neon) forces SSL with `rejectUnauthorized: false` (`Api/DataBase/db.js`).

## Frontend conventions

- **React 18 (not 19):** `ref` cannot be passed to plain function components — it silently fails with a console warning. Use `useRef` + props or `React.forwardRef`.
- `src/index.css` has a global `a { all: unset; }` — every `<a>` / `<Link>` loses default styling; re-specify color, cursor, underline explicitly when adding links/buttons.
- Routing lives entirely in `src/App.jsx` (`createBrowserRouter`). The child route `/:id` (article detail) catches any unmatched single segment under the layout — add new top-level paths as explicit routes, not single segments, or they'll resolve to an article lookup.
- File/directory names are Spanish and some are intentional (`Paginas/`, `Componentes/`, `InicioSecion.jsx`). Follow existing naming; don't anglicize.
- Server fields `img` and `sizes` arrive as **JSON strings**, not arrays — use the `parseJsonValue` helper pattern from `Paginas/Editor.jsx`.
- Images upload to Cloudinary via unsigned presets (`Paginas/Editor.jsx`, `DTF/UploadDTF.jsx`, `Componentes/EditBanner.jsx`). Cart state persists to localStorage (`Componentes/cartUtils.js`). User feedback via `react-toastify` (`toast.promise` for async ops).
- UI/UX work: the `ui-ux-pro-max` skill is installed under `.agents/skills/` (see `skills-lock.json`). Its search script requires Python, which is **not installed** on this machine — read `references/quick-reference.md` directly instead of running `scripts/search.py`.

## UI system (every new section follows this — ByGio tokens, no new palettes)

The visual language is **editorial type Sabina**: warm soft bands, thin `--line` rules, pill/chip controls, large centered page titles, 3-column grids. A new section must look like it was always part of the site; never import a new palette, font or motion timing.

- **Where styles live.** Global CSS is imported in this order from `Cliente/src/main.jsx`: `index.css` (reset + global `a { all: unset }`) → `estilos/tema.css` (tokens + base) → `estilos/componentes.css` (layout, shared sections, catalog) → `estilos/movimiento.css` (motion primitives, loaded last on purpose). Page-specific CSS stays next to the page (`Paginas/DTF/DtfCard.css`, `Paginas/DTF/DtfCategories.css`, `Paginas/ArticuloDetallado/Articulo.css`). Add shared section styles to `componentes.css`, not to a page file.
- **Tokens only.** Colors, radii, shadows, spacing, timing and easing come from `tema.css`; both themes are just `[data-theme="dark"]` overrides of those variables.
  - Surfaces/text: `--bg-page`, `--bg-soft`, `--surface`, `--surface-2`, `--ink`, `--ink-soft`, `--muted`, `--muted-soft`, `--line`, `--line-strong`, `--header-bg`.
  - Brand/actions: `--brand`, `--brand-strong`, `--brand-ink`, `--brand-soft`, `--danger*`, `--success*`.
  - Shape: `--radius-xs|sm|md|lg|pill`, `--shadow-sm|md|lg`, `--shadow-drawer`, `--overlay`.
  - Layout: `--ancho-max`, `--espacio-lateral`, `--espacio-seccion`, `--header-h`.
  - Motion: `--mov-rapido|base|lento|entrada|stagger`, `--mov-ease`, `--mov-ease-suave`, `--mov-ease-hover`, `--mov-ease-resorte`, `--panel-*`, `--desplegable-*`, `--icono-*`, `--foco-ancho`, `--foco-offset`, `--pulse-*`.
  - Never hardcode `#fff`/`#000` for new UI, never `transition: all`, never arbitrary ms values, never animate layout properties (`width`, `height`, `margin`, `top`). If a value seems missing, add a token to `tema.css` and use it in both themes.
- **Section skeleton.** `<section className="seccion">` (or `seccion seccion--suave` for a banded background, `seccion--ajustada` for tight vertical rhythm) → `<div className="contenedor">` → header `.seccion-cabecera` (or `.seccion-cabecera--centrada`) with `.etiqueta-seccion` + `.titulo-seccion` + `.texto-seccion`, and `.enlace-seccion` for a "ver todos" link → content. One `h1` per page (the page hero); inner sections use `h2` and reference it with `aria-labelledby`.
- **Reusable bands** (compose, don't reinvent):
  - `.catalogo-hero` — page header: `--bg-soft`, centered `h1` + subtitle, bottom `--line` (used by `/productos`).
  - `.banda-editorial` — image + text divisor, 2 columns, collapses on mobile (`Componentes/BandaEditorial.jsx`).
  - `.banda-beneficios` — icon strip, 4 columns divided by `--line` (`Componentes/BandaBeneficios.jsx`).
  - `.estado` + `.estado-titulo` + `.estado-texto` — empty/error blocks.
  - `.esqueleto*`, `RejillaEsqueleto`, `DtfEsqueleto` — loading skeletons (pulse uses `--pulse-*`).
- **Grids (single source of truth).** Products: `.grid-productos` → 3 cols, 2 at ≤1023, 1 at ≤479 (`componentes.css`). DTF: `.dtf-grid` (+ `.dtf-grid-item` children) → 3 cols, 2 at ≤1023, defined **only** in `DtfCard.css`. Reuse these classes; do not declare a second `grid-template-columns` for the same class in another file — duplicated rules already caused stale overrides because Vite/OneDrive can serve old CSS.
- **Catalog pattern (`/productos`).** Intro (`.catalogo-intro`: label/title/description left, `.catalogo-conteo` with `aria-live` right) → filter band `.catalogo-filtros` (grid of `.filtros-grupo` rows, closed by `border-bottom: 1px solid var(--line)`, so the split with the results is **horizontal**) → `.catalogo-resultados`. Chips are `.filtro-chip` with `aria-pressed`; `.activo` inverts to `--ink` / `--bg-page`. Filter state lives in the URL (`?coleccion=…&categoria=…`) so it is shareable and route transitions don't remount the page.
- **Async sections** need all three states and must not shift layout when swapping them (same grid/`min-height`): skeleton while loading (`RejillaEsqueleto` / `DtfEsqueleto`, or `.cargador` inline), and the `.estado` + `.estado-titulo` + `.estado-texto` block for both empty and error (there is no `.estado--error`; tint the text with `--danger` when it is an error). Track a "request started" flag so the empty state never flashes before the first fetch.
- **Motion.** Entrance: `.revelar` + `useEnVista()` with `.revelar-linea` children (stagger via `--mov-stagger`); grids use `.rejilla-entrada` / `.is-visible`. Hover/focus: only `transform`, `opacity` and colors, with `--mov-*` durations and `--foco-*` ring. `prefers-reduced-motion` is neutralised globally in `tema.css`/`movimiento.css` — don't re-implement it per component, and never add JS animation loops.
- **Media**: wrappers carry an explicit `aspect-ratio` and images use `loading="lazy"` so bands and cards don't reflow.
- **Check**: `npm run build` (lint is broken), then the page at 912×670 (the 1023/991 px breakpoints stack layouts) and in both themes, plus 0 console errors.

## Meta Pixel + cookie consent (Ley 1581 de 2012, Colombia)

- Pixel ID `1417915269868850` (public, lives in `Cliente/src/metaPixel.js`). **Do NOT add the Meta snippet to `index.html`** — the pixel loads **only after cookie consent** via `loadMetaPixel()` (idempotent: fires `init` + initial `PageView`). No `<noscript>` fallback by design — it can't be consent-gated.
- Consent is stored in `localStorage` key `meta_pixel_consent` (`granted`/`denied`). `BannerCookies.jsx` uses a `<Link>`, so it **must render inside the router** — it's mounted in the root layout AND on the standalone `/register` + `/login` route elements (never at `App` root, outside `RouterProvider`). It shows the banner and loads the pixel on accept; rejecting clears `_fbp`/`_fbc`. `resetConsent()` (Footer "Preferencias de cookies") clears the choice and reloads.
- `PixelPageViewTracker.jsx` tracks SPA route-change `PageView`s and skips the first render (StrictMode-safe); it's mounted in the root layout AND on the standalone `/register` + `/login` routes. It no-ops silently when the pixel isn't loaded (consent denied).
- Legal pages: `/privacidad` and `/terminos` are **templates with `[PENDIENTE: ...]` placeholders** (NIT, address, email, dates) — must be completed and lawyer-reviewed before any real e-commerce launch.

## Business roadmap notes

- Site is currently a **catalog** (orders close via WhatsApp). Future goal: e-commerce with payment gateway for **Colombia** — **not decided** (candidate: Wompi; also Mercado Pago / ePayco / PayU). When implemented: update `/terminos` (retracto/reversa, arts. 47 & 51 Ley 1480/2011, Decreto 587/2016), add DIAN e-invoicing, and register the trademark/database with the SIC as applicable.
