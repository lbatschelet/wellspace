<?php
/**
 * Tests for public_pins_normalize_multi_json: multi-choice answer storage
 * including the extended "other" free-text option (Issue #4).
 */

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../services/public_pins_service.php';

final class PublicPinsMultiAnswerTest extends TestCase
{
    private PDO $pdo;

    protected function setUp(): void
    {
        $this->pdo = new PDO('sqlite::memory:');
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->pdo->exec('
            CREATE TABLE question_options (
                question_key VARCHAR(64) NOT NULL,
                option_key VARCHAR(64) NOT NULL,
                sort INTEGER NOT NULL DEFAULT 0,
                is_active INTEGER NOT NULL DEFAULT 1,
                PRIMARY KEY (question_key, option_key)
            )
        ');
        $this->pdo->exec("
            INSERT INTO question_options (question_key, option_key, sort, is_active) VALUES
            ('topics', 'a', 10, 1),
            ('topics', 'b', 20, 1),
            ('topics', 'c', 30, 1),
            ('topics', 'other', 40, 1),
            ('topics', 'hidden', 50, 0)
        ");
    }

    public function testMultiSelectArrayStoredAsJson(): void
    {
        $json = public_pins_normalize_multi_json($this->pdo, 'topics', ['a', 'b'], ['allow_multiple' => 1]);
        $this->assertSame(['selected' => ['a', 'b']], json_decode($json, true));
    }

    public function testSingleSelectStringStoredAsJson(): void
    {
        $json = public_pins_normalize_multi_json($this->pdo, 'topics', 'a', ['allow_multiple' => 0]);
        $this->assertSame(['selected' => ['a']], json_decode($json, true));
    }

    public function testEmptySelectionReturnsNull(): void
    {
        $this->assertNull(public_pins_normalize_multi_json($this->pdo, 'topics', [], ['allow_multiple' => 1]));
        $this->assertNull(public_pins_normalize_multi_json($this->pdo, 'topics', '', ['allow_multiple' => 0]));
    }

    public function testDuplicateSelectionsAreDeduped(): void
    {
        $json = public_pins_normalize_multi_json($this->pdo, 'topics', ['a', 'a', 'b'], ['allow_multiple' => 1]);
        $this->assertSame(['a', 'b'], json_decode($json, true)['selected']);
    }

    public function testOtherWithTextStored(): void
    {
        $json = public_pins_normalize_multi_json(
            $this->pdo,
            'topics',
            ['selected' => ['a', 'other'], 'other_text' => 'My reason'],
            ['allow_multiple' => 1, 'allow_other' => 1]
        );
        $decoded = json_decode($json, true);
        $this->assertSame(['a', 'other'], $decoded['selected']);
        $this->assertSame('My reason', $decoded['other_text']);
    }

    public function testOtherWithoutTextThrows(): void
    {
        $this->expectException(ApiError::class);
        public_pins_normalize_multi_json(
            $this->pdo,
            'topics',
            ['selected' => ['other'], 'other_text' => '  '],
            ['allow_multiple' => 1, 'allow_other' => 1]
        );
    }

    public function testOtherWhenNotAllowedThrows(): void
    {
        $this->expectException(ApiError::class);
        public_pins_normalize_multi_json(
            $this->pdo,
            'topics',
            ['selected' => ['other'], 'other_text' => 'x'],
            ['allow_multiple' => 1, 'allow_other' => 0]
        );
    }

    public function testUnknownOptionThrows(): void
    {
        $this->expectException(ApiError::class);
        public_pins_normalize_multi_json($this->pdo, 'topics', ['a', 'zzz'], ['allow_multiple' => 1]);
    }

    public function testInactiveOptionThrows(): void
    {
        $this->expectException(ApiError::class);
        public_pins_normalize_multi_json($this->pdo, 'topics', ['hidden'], ['allow_multiple' => 1]);
    }

    public function testOtherTextTooLongThrows(): void
    {
        $this->expectException(ApiError::class);
        public_pins_normalize_multi_json(
            $this->pdo,
            'topics',
            ['selected' => ['other'], 'other_text' => str_repeat('x', 11)],
            ['allow_multiple' => 1, 'allow_other' => 1, 'other_max_length' => 10]
        );
    }

    public function testOtherTextTrimmed(): void
    {
        $json = public_pins_normalize_multi_json(
            $this->pdo,
            'topics',
            ['selected' => ['other'], 'other_text' => '  hello  '],
            ['allow_other' => 1]
        );
        $this->assertSame('hello', json_decode($json, true)['other_text']);
    }
}
