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

### DB-Migrationen (manuell, nach Deploy)

Der Deploy spielt **keine** SQL-Migrationen automatisch ein. Nach einem Deploy, der
neue Migrationen unter `services/api/migrations/` mitbringt, einmal per SSH ausführen:

```bash
ssh uid373276@u58gso.ftp.infomaniak.com
cd sites/wohlopti.ch/api
php bin/migrate.php --status   # zeigt applied / pending
php bin/migrate.php            # wendet ausstehende Migrationen an (idempotent)
```

Der Runner liest die DB-Zugangsdaten aus `config.local.php` (liegt nur auf dem Server),
trackt angewendete Dateien in `schema_migrations` und ist idempotent — wiederholtes
Ausführen ist gefahrlos.

#### Bestehende Prod-DB (Baseline) — «Duplicate column name»

Wenn die Datenbank **schon** den Stand von `schema.sql` / früheren manuellen Migrationen
hat, `schema_migrations` aber **leer** ist, schlägt `php bin/migrate.php` bei `001_*`
fehl (`Duplicate column name 'group_key'`). Das ist erwartbar — die DB ist aktuell,
nur der Migrations-Tracker nicht.

**Einmalig so vorgehen** (nur die wirklich neue Migration ausführen, Rest als erledigt markieren):

```bash
cd sites/wohlopti.ch/api
php bin/migrate.php --status          # alle 001–013 stehen vermutlich auf «pending»

# 1) Nur die neue Migration 013 einspielen (Spalte display_mode)
php -r '
$config = require "config.local.php";
$pdo = new PDO(
  sprintf("mysql:host=%s;dbname=%s;charset=utf8mb4", $config["db_host"] ?? "localhost", $config["db_name"]),
  $config["db_user"],
  $config["db_pass"] ?? "",
  [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);
$pdo->exec(file_get_contents("migrations/013_questionnaire_display_mode.sql"));
echo "013 applied OK\n";
'

# 2) Alle Migrationsdateien als «applied» eintragen, ohne sie erneut auszuführen
php bin/migrate.php --mark-applied

# 3) Kontrolle — «Pending migrations (0)»
php bin/migrate.php --status
```

Ab dann reicht für künftige Releases wieder nur `php bin/migrate.php` (wendet dann
ausschliesslich neue Dateien ab 014 an).

> **Aktuell relevant:** `013_questionnaire_display_mode.sql` (Spalte `display_mode`
> auf `questionnaires` für den Schritt-Modus). Bestehende Fragebögen bleiben auf
> `scroll`. Ohne diese Spalte schlägt das Speichern eines Fragebogens im Admin fehl.

### Admin: «Unexpected token '<' … is not valid JSON»

Die API antwortet, aber PHP schreibt **Warnungen als HTML** vor das JSON (häufig nach Umzug auf Infomaniak mit PHP 8.4). Fix im Repo: `?array` in `admin_common.php`, `display_errors=0` in `helpers.php` — erneut deployen.

**API-Konfiguration auf dem Server** (nicht im Git): einmalig `sites/wohlopti.ch/api/config.local.php` anlegen (z. B. von Hostinger kopieren: DB, `jwt_secret`, `admin_token`, SMTP). Liegt nur auf dem Server.

Der Deploy packt `config.local.php` nicht ins Bundle **und** lässt sie per `rsync --exclude=api/config.local.php` beim `--delete` auf dem Server **stehen** — ein erneuter Deploy löscht sie nicht mehr (früherer Bug: `--delete` ohne Exclude).
