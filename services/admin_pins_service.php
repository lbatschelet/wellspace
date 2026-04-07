<?php
/**
 * Admin pins service for listing and approval updates.
 * Exports: admin_pins_list, admin_pins_export_rows, admin_pins_export_header_keys,
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
        'wellbeing',
        'note',
        'group_key',
        'station_key',
        'reasons',
        'status',
        'approved',
        'created_at',
        'updated_at',
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
    return array_map('normalize_pin_row', $rows);
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

    $lv95Ctx = admin_pins_load_active_lv95_context($pdo);
    $lv95Id = $lv95Ctx['id'];
    $affine = $lv95Ctx['affine'];

    $out = [];
    foreach ($rows as $row) {
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

        $out[] = [
            'id' => intval($row['id']),
            'floor_index' => intval($row['floor_index']),
            'scene_world_x' => $sx,
            'scene_world_y' => $sy,
            'scene_world_z' => $sz,
            'lv95_e' => $lv95E,
            'lv95_n' => $lv95N,
            'lv95_calibration_id' => $lv95CalId,
            'wellbeing' => floatval($row['wellbeing']),
            'note' => $row['note'] ?? '',
            'group_key' => $row['group_key'] ?? '',
            'station_key' => $row['station_key'] ?? '',
            'reasons' => $reasons,
            'status' => $status,
            'approved' => $val,
            'created_at' => $row['created_at'] ?? '',
            'updated_at' => $row['updated_at'] ?? '',
        ];
    }

    return $out;
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
