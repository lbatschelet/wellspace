<?php
/**
 * Example configuration – copy to config.local.php and fill in your values.
 *
 *   cp config.example.php config.local.php
 */

return [
    /* ── Database ── */
    'db_host' => 'localhost',
    'db_name' => '',
    'db_user' => '',
    'db_pass' => '',

    /* ── Authentication ── */
    'admin_token' => '',   // shared API token (long random string)
    'jwt_secret'  => '',   // JWT signing secret (long random string)

    /* ── GitHub (issue submission) ── */
    'github_token'     => '',   // PAT with repo scope for creating issues
    'github_repo'      => 'lbatschelet/wellspace',  // must match live repo for Issues API
    'github_assignees' => '',   // auto-assign to these users (comma-separated, e.g. 'lbatschelet')

    /* ── SMTP (password-reset emails) ── */
    'smtp_host'      => '',   // e.g. smtp.example.com
    'smtp_port'      => 587,  // 587 for STARTTLS, 465 for SMTPS
    'smtp_user'      => '',
    'smtp_pass'      => '',
    'smtp_from'      => '',   // sender address, e.g. noreply@example.com
    'smtp_from_name' => 'Wellspace Admin',

    /* ── Frontend ── */
    'app_url' => '',   // Fallback public URL of admin (e.g. https://example.com/admin); prefer request headers from the admin app in production.
    'brand_mail_display' => '',   // Optional fallback for password-reset email branding if the client does not send X-Admin-Brand-Display

    /* ── Debug ── */
    'api_debug' => false,
];
