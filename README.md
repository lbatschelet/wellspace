![](logo_header.svg)

An interactive wellbeing mapping tool for the [vonRoll campus](https://www.phbern.ch/ueber-die-phbern/standorte/vonroll) at [PHBern](https://www.phbern.ch). Visitors place pins on a 3D model of the building to share how they feel in different spaces -- and why.

*feel***vonRoll** is developed as part of [**RealTransform**](https://sustainability.uzh.ch/de/forschung-lehre/forschung/realtransform.html), a cross-university project funded by [swissuniversities](https://www.swissuniversities.ch/) that fosters sustainability culture at Swiss higher education institutions through participatory real-world experiments. At PHBern, the project takes the form of [*Stationen des Wandels*](https://www.phbern.ch/ueber-die-phbern/bildung-fuer-nachhaltige-entwicklung/stationen-des-wandels-nachhaltigkeit-im-dialog) -- interactive installations that invite students, staff, and visitors to reflect on sustainability and wellbeing on campus.

## Components

The project consists of three components:

| Component                                                               | Stack             | Description                                                                      |
| ----------------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------- |
| [feelvonroll-webapp](https://github.com/lbatschelet/feelvonroll-webapp) | Vite + Three.js   | Public-facing 3D webapp where users place pins                                   |
| [feelvonroll-api](https://github.com/lbatschelet/feelvonroll-api)       | PHP 8.1 + MySQL   | REST API for pins, questionnaire config, and translations                        |
| [feelvonroll-admin](https://github.com/lbatschelet/feelvonroll-admin)   | Vite + vanilla JS | Admin panel for reviewing pins, managing the questionnaire, users, and languages |

## Architecture

```mermaid
graph LR
  User["User (Browser)"] --> Webapp["feelvonroll-webapp"]
  Webapp -->|"REST"| API["feelvonroll-api"]
  Admin["feelvonroll-admin"] -->|"REST + JWT"| API
  API --> DB["MySQL Database"]
  AdminUser["Admin (Browser)"] --> Admin
```

The **webapp** lets visitors navigate a 3D model of the vonRoll building, select a location, and fill out a dynamic questionnaire (wellbeing slider, multiple-choice reasons, free text). Submitted pins are stored via the **API**.

The **admin panel** authenticates via JWT and provides tools to review/approve pins, configure the questionnaire and its translations, manage users, and export data as CSV.

The **API** serves both public endpoints (pins, questions, languages, translations) and authenticated admin endpoints (pin management, user management, audit logging).

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [PHP](https://www.php.net/) >= 8.1
- MySQL / MariaDB
- A web server with PHP support (Apache, Nginx, or PHP built-in server)

### Clone with submodules

```bash
git clone --recurse-submodules https://github.com/lbatschelet/feelvonroll.git
cd feelvonroll
```

If you already cloned without `--recurse-submodules`:

```bash
git submodule update --init --recursive
```

### 1. Set up the API

```bash
cd feelvonroll-api

# Create the database schema
mysql -u root your_db_name < schema.sql

# Apply migrations
mysql -u root your_db_name < migrations/001_questionnaire.sql
mysql -u root your_db_name < migrations/002_slider_percent.sql
mysql -u root your_db_name < migrations/003_admin_users.sql
mysql -u root your_db_name < migrations/004_admin_token_version.sql
mysql -u root your_db_name < migrations/005_admin_roles_profile.sql

# Configure credentials
cp config.example.php config.local.php
# Edit config.local.php with your database credentials, jwt_secret, and admin_token

# Start a local PHP server (for development)
php -S localhost:8080
```

### 2. Start the webapp

```bash
cd feelvonroll-webapp
npm install
npm run dev
```

By default the webapp expects the API at `/api`. Override with a `.env.local` file:

```
VITE_API_BASE=http://localhost:8080
```

### 3. Start the admin panel

```bash
cd feelvonroll-admin
npm install
npm run dev
```

Override the API base the same way:

```
VITE_API_BASE=http://localhost:8080
```

## Testing

```bash
# Webapp tests
cd feelvonroll-webapp && npm test

# Admin tests
cd feelvonroll-admin && npm test

# API tests
cd feelvonroll-api && composer test
```

## Deployment

1. **API**: Upload `feelvonroll-api/` to your PHP hosting (e.g. `/api`). Ensure `config.local.php` is configured and not publicly accessible.
2. **Webapp**: Run `npm run build` in `feelvonroll-webapp/` and deploy the `dist/` folder to your web root.
3. **Admin**: Run `npm run build` in `feelvonroll-admin/` and deploy the `dist/` folder (e.g. to `/admin`).

Set `VITE_API_BASE` at build time if the API is not served from `/api`:

```bash
VITE_API_BASE=https://api.example.com npm run build
```

### Email (SMTP) Setup

The admin panel can send password-reset emails. This requires an SMTP server.

1. **Install PHP dependencies** on the server (requires [Composer](https://getcomposer.org/)):

   ```bash
   cd feelvonroll-api
   composer install --no-dev
   ```

   > **Shared hosting**: If Composer is not available via SSH, run `composer install --no-dev` locally and upload the resulting `vendor/` directory to the server.

2. **Configure SMTP** in `config.local.php`:

   ```php
   'smtp_host'      => 'smtp.example.com',
   'smtp_port'      => 587,          // 587 for STARTTLS, 465 for SMTPS
   'smtp_user'      => 'you@example.com',
   'smtp_pass'      => 'your-smtp-password',
   'smtp_from'      => 'noreply@example.com',
   'smtp_from_name' => 'feelvonRoll Admin',
   'app_url'        => 'https://admin.example.com',
   ```

   | Setting | Description |
   | --- | --- |
   | `smtp_host` | SMTP server hostname |
   | `smtp_port` | `587` (STARTTLS) or `465` (SMTPS) -- the encryption method is chosen automatically |
   | `smtp_user` / `smtp_pass` | SMTP credentials |
   | `smtp_from` | Sender address shown in emails |
   | `smtp_from_name` | Sender display name |
   | `app_url` | Public URL of the admin frontend (used to build reset links) |

   Without SMTP configuration, the admin panel still works -- reset links can be generated and copied manually instead of being sent by email.

## Project Structure

```
feelvonroll/
  feelvonroll-webapp/       Public 3D webapp (Three.js)
    src/
      main.js               Entry point, scene setup
      floors.js             Floor geometry and management
      pins.js               Pin placement and visualization
      ui/                   Questionnaire UI components
  feelvonroll-api/          PHP REST API
    pins.php                Public pin endpoints
    questions.php           Questionnaire config endpoint
    admin_auth.php          JWT authentication
    admin_pins.php          Pin management
    admin_users.php         User management
    services/               Business logic layer
    migrations/             SQL migration files
  feelvonroll-admin/        Admin panel (vanilla JS)
    src/
      main.js               Entry point, view assembly
      app/                  Shell, routing, initialization
      controllers/          Business logic controllers
      ui/                   View builders
      api/                  API client modules
      state/                Application state
```

## License

*feel***vonRoll** is licensed under the [GNU Affero General Public License v3.0](LICENSE).

## Credits

Developed by [Lukas Batschelet](https://lukasbatschelet.ch) for [PHBern](https://www.phbern.ch) as part of the [RealTransform](https://sustainability.uzh.ch/de/forschung-lehre/forschung/realtransform.html) project.

RealTransform is led by the University of Zurich in cooperation with the University of Bern, PHBern, and OST -- Ostschweizer Fachhochschule, with the support of the [td-net](https://transdisciplinarity.ch/) Network for Transdisciplinary Research.
