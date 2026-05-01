# Wellspace viewer (`apps/viewer`)

Public-facing 3D web application (Vite + Three.js) for participatory spatial wellbeing maps. Builds are **tenant-specific** via `brands/<slug>/` (e.g. `feelvonroll`, `wohlopti`).

```bash
pnpm --filter viewer dev
```

Uses `infra/vite/brand.mjs` (`BRAND` env, default slug `feelvonroll`). Override API base when needed (`VITE_API_BASE` in `.env.local`).

Upstream documentation: [**Wellspace** monorepo](../../README.md).
