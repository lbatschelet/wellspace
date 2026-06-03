# Deployment (wellspace monorepo)

## wohlopti.ch → Infomaniak

| | |
|---|---|
| Domain | [wohlopti.ch](https://wohlopti.ch) |
| GitHub-Repo | `lbatschelet/wellspace` |
| Workflow | [.github/workflows/deploy-wohlopti-infomaniak.yml](.github/workflows/deploy-wohlopti-infomaniak.yml) |
| Trigger | Push auf `main` (nur relevante Pfade) oder **workflow_dispatch** |
| Ziel auf dem Server | `/home/uid373276/sites/wohlopti.ch/` |

### Hosting (Infomaniak)

| | Wert |
|---|---|
| SSH-Host | `u58gso.ftp.infomaniak.com` |
| SSH-User | `uid373276` |
| Web-IPv4 (Cloudflare A-Record) | `185.125.27.243` |

Cloudflare: Apex/`www` als **A** auf `185.125.27.243` (Proxied nach Bedarf).

### Was wird deployed?

1. `pnpm run build` mit `BRAND=wohlopti` `APP=all` → statische Apps unter `dist/` (Viewer, `/admin`, `/feedback`)
2. PHP-API unter `deploy-root/api/` inkl. `vendor/` (Composer `--no-dev`)
3. `rsync --delete` von `deploy-root/` nach Infomaniak (kein gesamtes Repo)

### GitHub Secrets

Lokal (nicht committen):

```bash
cp infomaniak-deploy.env.example infomaniak-deploy.env
# Passwort eintragen, dann:
./scripts/set-infomaniak-secrets.sh
```

Erforderlich im Repo:

- `SSH_HOST`
- `SSH_USERNAME`
- `SSH_PASSWORD`
- optional `SSH_PORT`

Der Zielpfad für wohlopti ist im Workflow als `SSH_TARGET_PATH` hinterlegt (`/home/uid373276/sites/wohlopti.ch/`). `SSH_TARGET_PATH` im Secret ist nur für andere/generic Workflows relevant.

### feelvonRoll

Automatischer Hostinger-Deploy-Branch bleibt über [.github/workflows/publish-hostinger-auto.yml](.github/workflows/publish-hostinger-auto.yml) (`deploy/feelvonroll`). wohlopti ist dort **entfernt** — kein Doppel-Deploy.

Manueller Hostinger-Publish (beliebige Brand): [.github/workflows/publish-hostinger.yml](.github/workflows/publish-hostinger.yml).

### Server

Site-Ordner im Infomaniak-Manager oder per SSH: `~/sites/wohlopti.ch/`. Document root zeigt auf diesen Ordner; nach dem ersten Deploy liegen dort u. a. `index.html`, `admin/`, `api/`, `models/`.
