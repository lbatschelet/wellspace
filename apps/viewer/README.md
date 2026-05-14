# Wellspace viewer (`apps/viewer`)

Public-facing 3D web application (Vite + Three.js) for participatory spatial wellbeing maps. Builds are **tenant-specific** via `brands/<slug>/` (e.g. `feelvonroll`, `wohlopti`).

```bash
pnpm --filter viewer dev
```

Uses `infra/vite/brand.mjs` (`BRAND` env, default slug `feelvonroll`).

**API lokal testen**

- Standard: `apiBase` aus der Brand-Config (z. B. `/api`) wird als `VITE_API_BASE` eingebunden — Anfragen gehen an denselben Host wie der Dev-Server (localhost), es sei denn, du überschreibst das.
- In `apps/viewer/.env.local` kannst du setzen: `VITE_API_BASE=https://wohlopti.ch/api` — funktioniert nur, wenn die API **CORS** für `http://localhost:5174` erlaubt.
- **Ohne CORS-Probleme:** Vite leitet `/api` auf die Live-Site weiter:
  - `VITE_DEV_API_ORIGIN=https://wohlopti.ch`
  - `VITE_API_BASE` weglassen oder `/api` lassen  
  Beispiel:  
  `BRAND=wohlopti VITE_DEV_API_ORIGIN=https://wohlopti.ch pnpm --filter viewer dev`

Upstream documentation: [**Wellspace** monorepo](../../README.md).
