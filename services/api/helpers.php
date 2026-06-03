<?php
/**
 * Helper bootstrap for shared API functions.
 * Exports: functions from lib/* helpers.
 */

// Infomaniak/PHP 8.4+ may emit deprecations as HTML before JSON (breaks admin fetch).
if (PHP_SAPI !== 'cli') {
    ini_set('display_errors', '0');
}

require_once __DIR__ . '/lib/pin_normalizer.php';
require_once __DIR__ . '/lib/translations.php';
require_once __DIR__ . '/lib/jwt.php';
require_once __DIR__ . '/lib/errors.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/audit.php';
require_once __DIR__ . '/lib/json.php';
require_once __DIR__ . '/lib/admin_app_public_url.php';
