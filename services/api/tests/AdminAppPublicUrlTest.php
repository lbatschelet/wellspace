<?php

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../lib/admin_app_public_url.php';

final class AdminAppPublicUrlTest extends TestCase
{
    private array $serverBackup = [];

    protected function setUp(): void
    {
        $this->serverBackup = $_SERVER;
    }

    protected function tearDown(): void
    {
        $_SERVER = $this->serverBackup;
    }

    public function testTrustedHeaderOverridesConfigWhenHostMatches(): void
    {
        $_SERVER['HTTP_HOST'] = 'wohlopti.ch';
        $_SERVER['HTTPS'] = 'on';
        unset($_SERVER['HTTP_X_FORWARDED_HOST'], $_SERVER['HTTP_X_FORWARDED_PROTO']);
        $_SERVER['HTTP_X_ADMIN_PUBLIC_BASE'] = 'https://wohlopti.ch/admin';

        $base = resolve_admin_password_reset_app_url(['app_url' => 'https://admin.feelvonroll.ch']);
        $this->assertSame('https://wohlopti.ch/admin', $base);
    }

    public function testHeaderWithWrongHostIsIgnored(): void
    {
        $_SERVER['HTTP_HOST'] = 'wohlopti.ch';
        $_SERVER['HTTPS'] = 'on';
        unset($_SERVER['HTTP_X_FORWARDED_HOST'], $_SERVER['HTTP_X_FORWARDED_PROTO']);
        $_SERVER['HTTP_X_ADMIN_PUBLIC_BASE'] = 'https://attacker.example/admin';

        $base = resolve_admin_password_reset_app_url(['app_url' => 'https://correct.example/admin']);
        $this->assertSame('https://correct.example/admin', $base);
    }

    public function testBrandWordmarkSanitizesToEmStrongOnly(): void
    {
        $raw = '<em onclick="evil">wohl</em><strong class="x">Opti</strong><script>x</script>';
        $clean = api_sanitize_brand_wordmark_html($raw);
        $this->assertSame('<em>wohl</em><strong>Opti</strong>', $clean);
    }

    public function testRefererSubpathAdminWhenNoHeader(): void
    {
        $_SERVER['HTTP_HOST'] = 'wohlopti.ch';
        $_SERVER['HTTPS'] = 'on';
        unset(
            $_SERVER['HTTP_X_FORWARDED_HOST'],
            $_SERVER['HTTP_X_FORWARDED_PROTO'],
            $_SERVER['HTTP_X_ADMIN_PUBLIC_BASE']
        );
        $_SERVER['HTTP_REFERER'] = 'https://wohlopti.ch/admin/login';

        $base = resolve_admin_password_reset_app_url(['app_url' => 'https://old.example']);
        $this->assertSame('https://wohlopti.ch/admin', $base);
    }
}
