/**
 * Admin LV95 calibration API client.
 * Exports: fetchLv95CalibrationActive, previewLv95Calibration, saveLv95Calibration
 */
import { API_BASE, requestJson } from './baseClient'

export function fetchLv95CalibrationActive({ token }) {
  return requestJson(`${API_BASE}/admin_lv95_calibration.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action: 'get_active' }),
  })
}

export function previewLv95Calibration({ token, points }) {
  return requestJson(`${API_BASE}/admin_lv95_calibration.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action: 'preview', points }),
  })
}

export function saveLv95Calibration({ token, label, points, apply_to_stations }) {
  return requestJson(`${API_BASE}/admin_lv95_calibration.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action: 'save', label, points, apply_to_stations: !!apply_to_stations }),
  })
}

