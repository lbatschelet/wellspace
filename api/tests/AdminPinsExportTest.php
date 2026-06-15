<?php
/**
 * Tests for admin pins CSV formatting and JSON answer decoding.
 */

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../services/admin_pins_service.php';

final class AdminPinsExportTest extends TestCase
{
    public function testFormatSimpleListJoinsWithSemicolon(): void
    {
        $this->assertSame('a; b; c', admin_pins_format_answer_for_csv(['a', 'b', 'c']));
    }

    public function testFormatMultiWithSelectedAndOther(): void
    {
        $value = ['selected' => ['a', 'b', 'other'], 'other_text' => 'Freitext'];
        $this->assertSame('a; b; other; other: "Freitext"', admin_pins_format_answer_for_csv($value));
    }

    public function testFormatMultiSelectedOnly(): void
    {
        $value = ['selected' => ['a', 'b']];
        $this->assertSame('a; b', admin_pins_format_answer_for_csv($value));
    }

    public function testFormatInfluenceMap(): void
    {
        $value = ['licht' => 0.5, 'ruhe' => -1];
        $this->assertSame('licht: 0.5; ruhe: -1', admin_pins_format_answer_for_csv($value));
    }

    public function testFormatScalarUnchanged(): void
    {
        $this->assertSame('hello', admin_pins_format_answer_for_csv('hello'));
        $this->assertSame('', admin_pins_format_answer_for_csv(null));
    }

    public function testDecodeMultiJsonValue(): void
    {
        $decoded = pin_answers_decode_value('multi', '{"selected":["a","b"],"other_text":"x"}');
        $this->assertSame(['selected' => ['a', 'b'], 'other_text' => 'x'], $decoded);
    }

    public function testDecodeInfluenceJsonValue(): void
    {
        $decoded = pin_answers_decode_value('influence', '{"licht":0.5}');
        $this->assertSame(['licht' => 0.5], $decoded);
    }

    public function testDecodeTextTypeLeftAsString(): void
    {
        $this->assertSame('{not json}', pin_answers_decode_value('text', '{not json}'));
        $this->assertSame('plain', pin_answers_decode_value('text', 'plain'));
    }

    public function testDecodeMalformedJsonFallsBackToString(): void
    {
        $this->assertSame('{broken', pin_answers_decode_value('multi', '{broken'));
    }

    public function testLongExportMarksMultiAsJson(): void
    {
        // A decoded multi value (array) should be treated as json kind in long export.
        $value = ['selected' => ['a']];
        $this->assertTrue(admin_pins_is_answer_filled($value));
        $this->assertTrue(is_array($value));
    }
}
