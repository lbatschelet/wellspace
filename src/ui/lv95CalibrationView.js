/**
 * LV95 calibration view.
 * Exports: createLv95CalibrationView.
 */
export function createLv95CalibrationView() {
  const card = document.createElement('section')
  card.className = 'card lv95-calibration-card'
  card.style.display = 'none'
  card.innerHTML = `
    <div class="card-header">
      <div class="card-header-left">
        <h2>LV95 Calibration</h2>
        <span class="muted">EPSG:2056</span>
      </div>
      <div class="header-actions">
        <button class="ghost" id="lv95UnlockBtn" type="button">Unlock</button>
        <button class="ghost" id="lv95PreviewBtn" type="button" disabled>Preview</button>
        <button class="primary" id="lv95SaveBtn" type="button" disabled>Save</button>
      </div>
    </div>

    <p class="form-hint">
      This is a one-time setup. Pick 3 points in the webapp (capture mode) and enter their LV95 coordinates (E/N).
      Use Preview to validate RMS error before saving.
    </p>

    <div class="form-row" style="max-width:520px">
      <label><strong>Label (optional)</strong></label>
      <input type="text" id="lv95Label" placeholder="e.g. VonRoll 2026-04" />
    </div>

    <div class="admin-toggle" style="margin-bottom:14px">
      <label class="admin-toggle-row">
        <input type="checkbox" id="lv95ApplyStations" checked />
        <strong>Apply to stations</strong>
      </label>
      <p class="admin-toggle-hint">Updates stations.lv95_e/lv95_n from target_x/target_z using the saved calibration.</p>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>World X</th>
            <th>World Z</th>
            <th>LV95 E</th>
            <th>LV95 N</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="lv95PointsBody"></tbody>
      </table>
    </div>

    <div style="margin-top:12px; display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
      <div class="muted" id="lv95ActiveHint"></div>
      <div class="muted" id="lv95PreviewHint"></div>
    </div>
  `

  return {
    element: card,
    unlockBtn: card.querySelector('#lv95UnlockBtn'),
    previewBtn: card.querySelector('#lv95PreviewBtn'),
    saveBtn: card.querySelector('#lv95SaveBtn'),
    labelInput: card.querySelector('#lv95Label'),
    applyStations: card.querySelector('#lv95ApplyStations'),
    pointsBody: card.querySelector('#lv95PointsBody'),
    activeHint: card.querySelector('#lv95ActiveHint'),
    previewHint: card.querySelector('#lv95PreviewHint'),
  }
}

