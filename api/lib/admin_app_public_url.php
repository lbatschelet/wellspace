<?php
/**
 * Resolves public admin base URL for password-reset emails:
 * Prefer trusted request header → Referer heuristic → config app_url fallback.
 */

/**
 * Lowercase hostname without bracket noise; strips trailing port.
 */
function api_normalize_hostname(string $host): string
{
    $host = strtolower(trim(explode(',', $host)[0]));
    if ($host === '') {
        return '';
    }
    if ($host[0] === '[') {
        return $host;
    }
    return preg_replace('/:\d+$/', '', $host) ?: $host;
}

/**
 * Incoming request host as seen by PHP (Forwarded-Host or Host).
 */
function api_request_hostname(): string
{
    $raw = isset($_SERVER['HTTP_X_FORWARDED_HOST'])
        ? trim(explode(',', $_SERVER['HTTP_X_FORWARDED_HOST'])[0])
        : ($_SERVER['HTTP_HOST'] ?? '');

    return api_normalize_hostname($raw);
}

/**
 * Request scheme https|http honoring reverse proxies.
 */
function api_request_scheme(): string
{
    if (!empty($_SERVER['HTTP_X_FORWARDED_PROTO'])) {
        $proto = strtolower(trim(explode(',', $_SERVER['HTTP_X_FORWARDED_PROTO'])[0]));
        return $proto === 'https' ? 'https' : 'http';
    }
    $https = isset($_SERVER['HTTPS']) ? $_SERVER['HTTPS'] : '';

    return ($https && $https !== 'off') ? 'https' : 'http';
}

/**
 * Sanitized brand label from client header or config for email copy.
 *
 * @param array $config
 * @return string non-empty preferred; otherwise empty
 */
function api_mail_brand_display(array $config): string
{
    $rawHeader = isset($_SERVER['HTTP_X_ADMIN_BRAND_DISPLAY'])
        ? (string)$_SERVER['HTTP_X_ADMIN_BRAND_DISPLAY']
        : '';
    if ($rawHeader !== '') {
        $stripped = strip_tags(trim($rawHeader));
        $stripped = preg_replace('/\s+/u', ' ', $stripped) ?: '';
        if (mb_strlen($stripped, 'UTF-8') > 120) {
            $stripped = mb_substr($stripped, 0, 120, 'UTF-8');
        }
        return $stripped;
    }

    $fromConfig = isset($config['brand_mail_display'])
        ? trim((string)$config['brand_mail_display'])
        : '';

    return $fromConfig;
}

/**
 * Validates X-Admin-Public-Base: same hostname as API request (anti-phishing).
 */
function api_try_parse_trusted_absolute_base(string $candidate): ?string
{
    $candidate = trim($candidate);
    if ($candidate === '' || filter_var($candidate, FILTER_VALIDATE_URL) === false) {
        return null;
    }

    $parts = parse_url($candidate);
    if (!$parts || empty($parts['scheme']) || empty($parts['host'])) {
        return null;
    }

    $scheme = strtolower($parts['scheme']);
    if ($scheme !== 'http' && $scheme !== 'https') {
        return null;
    }

    $reqHost = api_request_hostname();
    $urlHost = api_normalize_hostname($parts['host']);
    if ($reqHost === '' || strcasecmp($urlHost, $reqHost) !== 0) {
        return null;
    }

    $reqScheme = api_request_scheme();
    if ($reqScheme === 'https' && $scheme === 'http') {
        return null;
    }

    $pathRaw = $parts['path'] ?? '';
    $path = $pathRaw === '' ? '/' : '/' . ltrim($pathRaw, '/');
    $path = preg_replace('#/+#', '/', $path) ?: '/';

    if ($path !== '/' && $path !== '/admin' && !str_starts_with($path, '/admin/')) {
        return null;
    }

    $origin = $scheme . '://' . $parts['host'];
    if (!empty($parts['port'])) {
        $origin .= ':' . intval($parts['port']);
    }

    if ($path === '/admin' || str_starts_with($path, '/admin/')) {
        return rtrim($origin . '/admin', '/');
    }

    return rtrim($origin, '/');
}

/**
 * Derives admin public base URL from Referer when it matches request host (subpath vs root).
 */
function api_admin_base_from_referer(): ?string
{
    if (empty($_SERVER['HTTP_REFERER'])) {
        return null;
    }

    $refRaw = trim((string)$_SERVER['HTTP_REFERER']);
    if ($refRaw === '' || filter_var($refRaw, FILTER_VALIDATE_URL) === false) {
        return null;
    }

    $ref = parse_url($refRaw);
    if (!$ref || empty($ref['host'])) {
        return null;
    }

    $reqHost = api_request_hostname();
    if ($reqHost === '' || strcasecmp(api_normalize_hostname($ref['host']), $reqHost) !== 0) {
        return null;
    }

    $scheme = strtolower($ref['scheme'] ?? 'https');
    if ($scheme !== 'http' && $scheme !== 'https') {
        $scheme = api_request_scheme();
    }

    $reqScheme = api_request_scheme();
    if ($reqScheme === 'https' && $scheme === 'http') {
        $scheme = 'https';
    }

    $path = $ref['path'] ?? '/';
    $base = $scheme . '://' . $ref['host'];
    $port = isset($ref['port']) ? ':' . intval($ref['port']) : '';
    /* Rebuild authority with explicit port only when present */
    if ($port !== '') {
        $base = $scheme . '://' . $ref['host'] . $port;
    }

    if ($path === '/admin' || (strlen($path) >= 7 && substr($path, 0, 7) === '/admin/')) {
        return $base . '/admin';
    }

    return rtrim($base, '/');
}

/**
 * Canonical base URL (no trailing slash) for composing /reset links.
 *
 * @param array $config
 */
function resolve_admin_password_reset_app_url(array $config): string
{
    $header = isset($_SERVER['HTTP_X_ADMIN_PUBLIC_BASE'])
        ? (string)$_SERVER['HTTP_X_ADMIN_PUBLIC_BASE']
        : '';
    $fromHeader = $header !== '' ? api_try_parse_trusted_absolute_base($header) : null;
    if ($fromHeader !== null && $fromHeader !== '') {
        return $fromHeader;
    }

    $fromReferer = api_admin_base_from_referer();
    if ($fromReferer !== null && $fromReferer !== '') {
        return $fromReferer;
    }

    return rtrim($config['app_url'] ?? '', '/');
}

/**
 * Builds full password-reset link for the admin SPA.
 *
 * @param array  $config
 * @param string $token Plain reset token
 */
function build_admin_reset_link(array $config, string $token): string
{
    $base = resolve_admin_password_reset_app_url($config);
    return rtrim($base, '/') . '/reset?token=' . rawurlencode($token);
}
