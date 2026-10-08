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

- **Both `.env` files are tracked in git** and required to run. Don't delete them; don't add secrets expecting them to stay private.
- `Cliente/.env`: `VITE_API_URL` (every API call flows through `Cliente/src/config.js`), `VITE_NUMBER_PHONE`, `VITE_CLOUDINARY_NAME`, `VITE_CLOUDINARY_PRESET`, `VITE_CLOUDINARY_PRESET_DTF`, `VITE_CLOUDINARY_PRESET_BANNER`. Only `VITE_*` vars reach the browser; they're read at **build** time.
- `Api/.env`: `DB_HOST` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` / `DB_PORT` (+ `_GIO` variants) and `DB_DIALECT`; `Api/config.js` builds the Postgres URL from them (`DATABASE_URL` wins if set).
- Dev CORS origin is hardcoded to `http://localhost:5173` in `Api/config.js`; production uses `FRONTEND_URL`. Cookies require `credentials: true` (already configured) — the client must send axios requests with `withCredentials: true`.
- **Schema changes apply via `sequelize.sync()`, which only runs when `NODE_ENV !== "production"`.** No migrations exist. Model files in `Api/DataBase/models/` are the source of truth; production never syncs (deploy schema manually or let sync run once outside prod).

## Backend conventions

- Route flow: `Api/Rutas/` → `Api/Controllers/` → `Api/DataBase/models/`.
- Mounted endpoints: `/api/posts`, `/api/auth`, `/api/user`, `/api/banner`, `/api/dtf`, `/api/category`.
- Auth: JWT (`jsonwebtoken`) stored in the httpOnly cookie `access_token`, secret is the hardcoded string `"jwtkey"`.
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
