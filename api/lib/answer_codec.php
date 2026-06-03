<?php
/**
 * Shared codec for pin_answers.answer_text.
 *
 * Some question types (multi, influence) store JSON in answer_text. Read paths
 * must decode these back into structured values so the admin UI and CSV export
 * see arrays/objects instead of raw JSON strings.
 *
 * Exports: pin_answers_load_types, pin_answers_decode_value.
 */

/**
 * Loads a question_key => type map for the given keys.
 *
 * @param PDO $pdo
 * @param array<int, string> $keys
 * @return array<string, string>
 */
function pin_answers_load_types(PDO $pdo, array $keys): array
{
    $keys = array_values(array_unique(array_filter(
        array_map(fn($k) => (string)$k, $keys),
        fn($k) => $k !== ''
    )));
    if (empty($keys)) {
        return [];
    }
    $placeholders = implode(',', array_fill(0, count($keys), '?'));
    $stmt = $pdo->prepare(
        "SELECT question_key, type FROM questions WHERE question_key IN ($placeholders)"
    );
    $stmt->execute($keys);
    $map = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $map[(string)$row['question_key']] = (string)$row['type'];
    }
    return $map;
}

/**
 * Decodes a raw answer_text value based on the question type.
 * JSON-backed types (multi, influence) are decoded into arrays; others are
 * returned unchanged.
 *
 * @param string|null $type
 * @param mixed $raw
 * @return mixed
 */
function pin_answers_decode_value(?string $type, $raw)
{
    if (!is_string($raw) || $raw === '') {
        return $raw;
    }
    if ($type !== 'multi' && $type !== 'influence') {
        return $raw;
    }
    $decoded = json_decode($raw, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
        return $decoded;
    }
    return $raw;
}
