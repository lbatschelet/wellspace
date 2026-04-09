<?php
/**
 * Admin pins service for listing and approval updates.
 * Exports: admin_pins_list, admin_pins_export_rows, admin_pins_export_header_keys,
 *          admin_pins_export_long_rows, admin_pins_export_long_header_keys,
 *          admin_pins_update_approval, admin_pins_delete.
 */

require_once __DIR__ . '/../lib/lv95_affine.php';

/**
 * CSV column order (stable header even when there are zero rows).
 *
 * @return array<int, string>
 */
function admin_pins_export_header_keys(): array
{
    return [
        'id',
        'floor_index',
        'scene_world_x',
        'scene_world_y',
        'scene_world_z',
        'lv95_e',
        'lv95_n',
        'lv95_calibration_id',
        'questionnaire_key',
        'wellbeing',
        'note',
        'group_key',
        'station_key',
        'reasons',
        'asked_questions',
        'generic_answers_json',
        'status',
        'approved',
        'created_at',
        'updated_at',
    ];
}

/**
 * Long CSV header: one row per (pin, question_key) with asked/answered flags.
 */
function admin_pins_export_long_header_keys(): array
{
    return [
        'pin_id',
        'station_key',
        'questionnaire_key',
        'floor_index',
        'created_at',
        'question_key',
        'asked',
        'answered',
        'answer_text',
        'answer_numeric',
    ];
}

/**
 * Loads active LV95 calibration affine (if table exists and a row is active).
 *
 * @return array{ id: int|null, affine: array|null }
 */
function admin_pins_load_active_lv95_context(PDO $pdo): array
{
    try {
        $stmt = $pdo->query(
            'SELECT id, points, params FROM lv95_calibrations WHERE is_active = 1 ORDER BY id DESC LIMIT 1'
        );
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return ['id' => null, 'affine' => null];
        }
        $affine = lv95_affine_from_calibration_row($row);
        return ['id' => intval($row['id']), 'affine' => $affine];
    } catch (Throwable $e) {
        return ['id' => null, 'affine' => null];
    }
}

/**
 * Returns all pins for admin view.
 *
 * @param PDO $pdo
 * @return array
 */
function admin_pins_list(PDO $pdo): array
{
    $stmt = $pdo->query(
        "SELECT pins.*, GROUP_CONCAT(pin_reasons.reason_key) AS reason_keys
         FROM pins
         LEFT JOIN pin_reasons ON pin_reasons.pin_id = pins.id AND pin_reasons.question_key = 'reasons'
         GROUP BY pins.id
         ORDER BY pins.created_at DESC"
    );
    $rows = $stmt->fetchAll();
    $pins = array_map('normalize_pin_row', $rows);
    admin_pins_attach_asked_questions($pdo, $pins);
    admin_pins_attach_generic_answers($pdo, $pins);
    return $pins;
}

/**
 * Returns raw pin rows for CSV export.
 *
 * @param PDO $pdo
 * @return array
 */
function admin_pins_export_rows(PDO $pdo): array
{
    $stmt = $pdo->query(
        "SELECT pins.*, GROUP_CONCAT(pin_reasons.reason_key) AS reason_keys
         FROM pins
         LEFT JOIN pin_reasons ON pin_reasons.pin_id = pins.id AND pin_reasons.question_key = 'reasons'
         GROUP BY pins.id
         ORDER BY pins.created_at DESC"
    );
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $pins = array_map('normalize_pin_row', $rows);
    admin_pins_attach_asked_questions($pdo, $pins);
    admin_pins_attach_generic_answers($pdo, $pins);

    $lv95Ctx = admin_pins_load_active_lv95_context($pdo);
    $lv95Id = $lv95Ctx['id'];
    $affine = $lv95Ctx['affine'];

    $out = [];
    foreach ($pins as $row) {
        $val = array_key_exists('approved', $row) ? intval($row['approved']) : 0;
        $status = $val === 1 ? 'approved' : ($val === -1 ? 'rejected' : 'pending');

        $sx = floatval($row['position_x']);
        $sy = floatval($row['position_y']);
        $sz = floatval($row['position_z']);

        $lv95E = '';
        $lv95N = '';
        $lv95CalId = '';
        if ($affine !== null && $lv95Id !== null) {
            $en = lv95_apply_scene_xz_to_lv95($affine, $sx, $sz);
            $lv95E = round($en['e'], 4);
            $lv95N = round($en['n'], 4);
            $lv95CalId = $lv95Id;
        }

        $reasons = isset($row['reason_keys']) && $row['reason_keys'] !== '' && $row['reason_keys'] !== null
            ? $row['reason_keys']
            : '';

        $asked = isset($row['asked_questions']) && is_array($row['asked_questions'])
            ? implode(',', $row['asked_questions'])
            : '';
        $genericJson = '';
        if (array_key_exists('generic_answers', $row)) {
            $genericJson = json_encode($row['generic_answers'], JSON_UNESCAPED_UNICODE);
        }

        $out[] = [
            'id' => intval($row['id']),
            'floor_index' => intval($row['floor_index']),
            'scene_world_x' => $sx,
            'scene_world_y' => $sy,
            'scene_world_z' => $sz,
            'lv95_e' => $lv95E,
            'lv95_n' => $lv95N,
            'lv95_calibration_id' => $lv95CalId,
            'questionnaire_key' => $row['questionnaire_key'] ?? 'default',
            'wellbeing' => floatval($row['wellbeing']),
            'note' => $row['note'] ?? '',
            'group_key' => $row['group_key'] ?? '',
            'station_key' => $row['station_key'] ?? '',
            'reasons' => $reasons,
            'asked_questions' => $asked,
            'generic_answers_json' => $genericJson,
            'status' => $status,
            'approved' => $val,
            'created_at' => $row['created_at'] ?? '',
            'updated_at' => $row['updated_at'] ?? '',
        ];
    }

    return $out;
}

/**
 * Long CSV export rows: one row per (pin, question_key) for asked questions.
 */
function admin_pins_export_long_rows(PDO $pdo): array
{
    // Base pin meta.
    $pins = admin_pins_list($pdo);
    if (empty($pins)) return [];

    // Build answer maps.
    $pinIds = array_map(fn($p) => intval($p['id']), $pins);
    $placeholders = implode(',', array_fill(0, count($pinIds), '?'));

    $ansStmt = $pdo->prepare(
        "SELECT pin_id, question_key, answer_text, answer_numeric
         FROM pin_answers
         WHERE pin_id IN ($placeholders)"
    );
    $ansStmt->execute($pinIds);
    $ansRows = $ansStmt->fetchAll(PDO::FETCH_ASSOC);
    $ansByPin = [];
    foreach ($ansRows as $r) {
        $pid = intval($r['pin_id']);
        $qk = (string)($r['question_key'] ?? '');
        if ($pid <= 0 || $qk === '') continue;
        $ansByPin[$pid][$qk] = [
            'answer_text' => $r['answer_text'] ?? null,
            'answer_numeric' => $r['answer_numeric'] ?? null,
        ];
    }

    // Reasons (multi) and core fields handled as synthetic answers.
    $reasonsStmt = $pdo->prepare(
        "SELECT pin_id, GROUP_CONCAT(reason_key) AS reasons
         FROM pin_reasons
         WHERE pin_id IN ($placeholders) AND question_key = 'reasons'
         GROUP BY pin_id"
    );
    $reasonsStmt->execute($pinIds);
    $reasonsRows = $reasonsStmt->fetchAll(PDO::FETCH_ASSOC);
    $reasonsByPin = [];
    foreach ($reasonsRows as $r) {
        $reasonsByPin[intval($r['pin_id'])] = $r['reasons'] ?? '';
    }

    $out = [];
    foreach ($pins as $pin) {
        $pid = intval($pin['id']);
        $asked = isset($pin['asked_questions']) && is_array($pin['asked_questions']) ? $pin['asked_questions'] : [];
        // Include legacy/core questions as asked.
        $askedSet = array_unique(array_merge($asked, ['wellbeing', 'reasons', 'group', 'note']));

        foreach ($askedSet as $qk) {
            $qk = (string)$qk;
            if ($qk === '') continue;
            $answered = 0;
            $answerText = '';
            $answerNumeric = '';

            if ($qk === 'wellbeing') {
                $answerNumeric = $pin['wellbeing'] ?? '';
                $answered = ($answerNumeric !== '' && $answerNumeric !== null) ? 1 : 0;
            } elseif ($qk === 'note') {
                $answerText = $pin['note'] ?? '';
                $answered = (trim((string)$answerText) !== '') ? 1 : 0;
            } elseif ($qk === 'group') {
                $answerText = $pin['group_key'] ?? '';
                $answered = (trim((string)$answerText) !== '') ? 1 : 0;
            } elseif ($qk === 'reasons') {
                $answerText = $reasonsByPin[$pid] ?? '';
                $answered = (trim((string)$answerText) !== '') ? 1 : 0;
            } else {
                $a = $ansByPin[$pid][$qk] ?? null;
                if ($a) {
                    if ($a['answer_text'] !== null && $a['answer_text'] !== '') {
                        $answerText = $a['answer_text'];
                        $answered = 1;
                    } elseif ($a['answer_numeric'] !== null && $a['answer_numeric'] !== '') {
                        $answerNumeric = $a['answer_numeric'];
                        $answered = 1;
                    }
                }
            }

            $out[] = [
                'pin_id' => $pid,
                'station_key' => $pin['station_key'] ?? '',
                'questionnaire_key' => $pin['questionnaire_key'] ?? 'default',
                'floor_index' => $pin['floor_index'] ?? '',
                'created_at' => $pin['created_at'] ?? '',
                'question_key' => $qk,
                'asked' => 1,
                'answered' => $answered,
                'answer_text' => $answerText,
                'answer_numeric' => $answerNumeric,
            ];
        }
    }
    return $out;
}

function admin_pins_attach_asked_questions(PDO $pdo, array &$pins): void
{
    if (empty($pins)) return;
    $ids = array_map(fn($p) => intval($p['id']), $pins);
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $pdo->prepare(
        "SELECT pin_id, question_key
         FROM pin_questionnaire_questions
         WHERE pin_id IN ($placeholders)
         ORDER BY slot_sort ASC, question_key ASC"
    );
    $stmt->execute($ids);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $byPin = [];
    foreach ($rows as $r) {
        $pid = intval($r['pin_id'] ?? 0);
        $qk = (string)($r['question_key'] ?? '');
        if ($pid <= 0 || $qk === '') continue;
        $byPin[$pid][] = $qk;
    }
    foreach ($pins as &$p) {
        $pid = intval($p['id']);
        $p['asked_questions'] = $byPin[$pid] ?? [];
    }
}

function admin_pins_attach_generic_answers(PDO $pdo, array &$pins): void
{
    if (empty($pins)) return;
    $ids = array_map(fn($p) => intval($p['id']), $pins);
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $pdo->prepare(
        "SELECT pin_id, question_key, answer_text, answer_numeric
         FROM pin_answers
         WHERE pin_id IN ($placeholders)"
    );
    $stmt->execute($ids);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $byPin = [];
    foreach ($rows as $r) {
        $pid = intval($r['pin_id'] ?? 0);
        $qk = (string)($r['question_key'] ?? '');
        if ($pid <= 0 || $qk === '') continue;
        $val = null;
        if (isset($r['answer_text']) && $r['answer_text'] !== null && $r['answer_text'] !== '') {
            $val = $r['answer_text'];
        } elseif (isset($r['answer_numeric']) && $r['answer_numeric'] !== null && $r['answer_numeric'] !== '') {
            $val = floatval($r['answer_numeric']);
        }
        $byPin[$pid][$qk] = $val;
    }
    foreach ($pins as &$p) {
        $pid = intval($p['id']);
        $p['generic_answers'] = $byPin[$pid] ?? new stdClass();
    }
}

/**
 * Updates approval state for a list of pins.
 *
 * @param PDO $pdo
 * @param int|null $userId
 * @param array $ids
 * @param int $approved
 * @return array
 */
function admin_pins_update_approval(PDO $pdo, ?int $userId, array $ids, int $approved): array
{
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $params = array_merge([$approved], array_map('intval', $ids));
    $stmt = $pdo->prepare("UPDATE pins SET approved = ? WHERE id IN ($placeholders)");
    $stmt->execute($params);
    log_admin_action($pdo, $userId, 'pin_update_approval', 'pins', ['ids' => $ids, 'approved' => $approved]);
    return ['updated' => $stmt->rowCount()];
}

/**
 * Deletes pins by id.
 *
 * @param PDO $pdo
 * @param int|null $userId
 * @param array $ids
 * @return array
 */
function admin_pins_delete(PDO $pdo, ?int $userId, array $ids): array
{
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $params = array_map('intval', $ids);
    $stmt = $pdo->prepare("DELETE FROM pins WHERE id IN ($placeholders)");
    $stmt->execute($params);
    log_admin_action($pdo, $userId, 'pin_delete', 'pins', ['ids' => $ids]);
    return ['deleted' => $stmt->rowCount()];
}
