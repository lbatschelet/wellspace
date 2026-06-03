# Deployment (wellspace monorepo)

## wohlopti.ch → Infomaniak

| | |
|---|---|
| Domain | [wohlopti.ch](https://wohlopti.ch) |
| GitHub-Repo | `lbatschelet/wellspace` |
| Workflow | [.github/workflows/deploy-wohlopti-infomaniak.yml](.github/workflows/deploy-wohlopti-infomaniak.yml) |
| Trigger | Push auf `main` (nur relevante Pfade) oder **workflow_dispatch** |
| Ziel auf dem Server | `sites/wohlopti.ch/` (relativ zum SSH-Login, ≈ `~/sites/wohlopti.ch/`) |

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
- **`SSH_PASSWORD`** *oder* **`SSH_PRIVATE_KEY`** (empfohlen für CI)
- optional `SSH_PORT`

Der Zielpfad für wohlopti ist im Workflow als `SSH_TARGET_PATH` hinterlegt (`/home/uid373276/sites/wohlopti.ch/`). `SSH_TARGET_PATH` im Secret ist nur für andere/generic Workflows relevant.

#### SSH-Key (empfohlen)

```bash
ssh-keygen -t ed25519 -f ~/.ssh/wohlopti_infomaniak -N ""
# Public key auf dem Server in ~/.ssh/authorized_keys (chmod 600)
# Infomaniak: https://www.infomaniak.com/en/support/faq/2054/connect-with-ssh-key
gh secret set SSH_PRIVATE_KEY -R lbatschelet/wellspace < ~/.ssh/wohlopti_infomaniak
```

#### Fehler «Permission denied» beim rsync

Build war OK, nur SSH schlägt fehl. Typische Ursachen:

1. **Falsches Passwort** — im Infomaniak-Manager unter **Hosting → FTP / SSH** das Passwort des **FTP+SSH-Benutzers** (`uid373276`), nicht das Login-Passwort des Infomaniak-Kontos.
2. **Sonderzeichen im Passwort** — Secret neu setzen; der Workflow nutzt `sshpass -f` (robuster als `-e`).
3. **SSH-Key statt Passwort** — `SSH_PRIVATE_KEY` setzen (ed25519, kein RSA).
4. **Lokal testen:** `ssh uid373276@u58gso.ftp.infomaniak.com` — erst wenn das klappt, erneut den Workflow starten.

### feelvonRoll

Automatischer Hostinger-Deploy-Branch bleibt über [.github/workflows/publish-hostinger-auto.yml](.github/workflows/publish-hostinger-auto.yml) (`deploy/feelvonroll`). wohlopti ist dort **entfernt** — kein Doppel-Deploy.

Manueller Hostinger-Publish (beliebige Brand): [.github/workflows/publish-hostinger.yml](.github/workflows/publish-hostinger.yml).

### Server

Site-Ordner: **`sites/wohlopti.ch/`** relativ zum SSH-Login (nicht `/home/uid373276/…` im rsync — sonst `Permission denied`).

Im Manager steht oft der absolute Pfad `/home/uid373276/sites/wohlopti.ch/`; per SSH/rsync nutzt ihr den relativen Teil unter eurem Home.

Fehler `mkdir: cannot create directory '/home/uid373276'`: absoluter Pfad im Deploy — mit relativem `sites/wohlopti.ch/` beheben.

### Drei GitHub Actions bei Push?

| Workflow | Zweck |
|----------|--------|
| **CI** | Tests + Build-Matrix (feelvonroll + wohlopti) — bei jedem Push auf `main` |
| **Deploy wohlopti to Infomaniak** | Produktion wohlopti.ch (nur bei relevanten Pfaden) |
| **Publish to deploy branches (auto)** | feelvonRoll → Hostinger-Branch (nur bei feelvonroll-relevanten Pfaden) |

Reine wohlopti-Änderungen lösen **keinen** Hostinger-Publish mehr aus.

Nach erfolgreichen Deploy: `index.html`, `admin/`, `api/`, `models/`, …

### Admin: «Unexpected token '<' … is not valid JSON»

Die API antwortet, aber PHP schreibt **Warnungen als HTML** vor das JSON (häufig nach Umzug auf Infomaniak mit PHP 8.4). Fix im Repo: `?array` in `admin_common.php`, `display_errors=0` in `helpers.php` — erneut deployen.

**API-Konfiguration auf dem Server** (nicht im Git): `api/config.local.php` vom Hostinger-Setup kopieren (DB, `jwt_secret`, `admin_token`, SMTP). Ohne diese Datei: DB-Fehler oder leere Secrets. Deploy schließt `config.local.php` bewusst aus.
