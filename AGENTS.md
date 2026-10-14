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
- **Schema changes apply via `sequelize.sync()`, which only runs when `NODE_ENV !== "production"`.** No migrations exist. Model files in `Api/DataBase/models/` are the source of truth; production never syncs (deploy schema manually or let sync run once outside prod).

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

## Meta Pixel + cookie consent (Ley 1581 de 2012, Colombia)

- Pixel ID `1417915269868850` (public, lives in `Cliente/src/metaPixel.js`). **Do NOT add the Meta snippet to `index.html`** — the pixel loads **only after cookie consent** via `loadMetaPixel()` (idempotent: fires `init` + initial `PageView`). No `<noscript>` fallback by design — it can't be consent-gated.
- Consent is stored in `localStorage` key `meta_pixel_consent` (`granted`/`denied`). `BannerCookies.jsx` uses a `<Link>`, so it **must render inside the router** — it's mounted in the root layout AND on the standalone `/register` + `/login` route elements (never at `App` root, outside `RouterProvider`). It shows the banner and loads the pixel on accept; rejecting clears `_fbp`/`_fbc`. `resetConsent()` (Footer "Preferencias de cookies") clears the choice and reloads.
- `PixelPageViewTracker.jsx` tracks SPA route-change `PageView`s and skips the first render (StrictMode-safe); it's mounted in the root layout AND on the standalone `/register` + `/login` routes. It no-ops silently when the pixel isn't loaded (consent denied).
- Legal pages: `/privacidad` and `/terminos` are **templates with `[PENDIENTE: ...]` placeholders** (NIT, address, email, dates) — must be completed and lawyer-reviewed before any real e-commerce launch.

## Business roadmap notes

- Site is currently a **catalog** (orders close via WhatsApp). Future goal: e-commerce with payment gateway for **Colombia** — **not decided** (candidate: Wompi; also Mercado Pago / ePayco / PayU). When implemented: update `/terminos` (retracto/reversa, arts. 47 & 51 Ley 1480/2011, Decreto 587/2016), add DIAN e-invoicing, and register the trademark/database with the SIC as applicable.
