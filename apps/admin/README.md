# Wellspace admin (`apps/admin`)

Web admin for reviewing pins, questionnaires, stations, translations, users, and related settings. Ships as a branded static build per tenant under `brands/<slug>/`.

```bash
pnpm --filter admin dev
```

`BRAND` selects the tenant (see viewer / root README). Configure `VITE_API_BASE` locally if the API is not on `/api`.

Documentation: [**Wellspace**](../../README.md).
