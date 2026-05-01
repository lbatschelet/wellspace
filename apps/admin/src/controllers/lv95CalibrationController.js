/**
 * LV95 calibration controller.
 * Exports: createLv95CalibrationController.
 */
import { parseSwissNumber, parseSwissLv95Pair } from '../utils/lv95Parse'
import { getPublicWebappBase } from '../utils/webappBase'

export function createLv95CalibrationController({ state, views, api, shell }) {
  const view = views.lv95CalibrationView

  let unlocked = false
  let captureWindow = null

  const points = Array.from({ length: 3 }).map(() => ({
    world: { x: null, z: null },
    lv95: { e: null, n: null },
  }))

  const getWebappBase = () => getPublicWebappBase()

  function formatNum(v) {
    if (v == null || !Number.isFinite(v)) return ''
    return String(v)
  }

  function updatePreviewButtons() {
    const canPreview = unlocked && points.every((p) =>
      Number.isFinite(p.world.x) && Number.isFinite(p.world.z) && Number.isFinite(p.lv95.e) && Number.isFinite(p.lv95.n)
    )
    view.previewBtn.disabled = !canPreview
    view.saveBtn.disabled = !canPreview
  }

  const render = () => {
    view.pointsBody.innerHTML = ''
    points.forEach((p, idx) => {
      const article = document.createElement('article')
      article.className = 'lv95-point'
      article.dataset.lv95Point = String(idx)
      article.innerHTML = `
        <h3 class="lv95-point-title">Point ${idx + 1}</h3>
        <div class="lv95-point-grid">
          <label class="lv95-field">
            <span>World X</span>
            <input type="text" inputmode="decimal" readonly data-world-x="${idx}" value="${formatNum(p.world.x)}" />
          </label>
          <label class="lv95-field">
            <span>World Z</span>
            <input type="text" inputmode="decimal" readonly data-world-z="${idx}" value="${formatNum(p.world.z)}" />
          </label>
          <label class="lv95-field">
            <span>LV95 E</span>
            <input type="text" inputmode="decimal" spellcheck="false" autocomplete="off" data-lv95-e="${idx}" value="${formatNum(p.lv95.e)}" placeholder="E" ${unlocked ? '' : 'disabled'} />
          </label>
          <label class="lv95-field">
            <span>LV95 N</span>
            <input type="text" inputmode="decimal" spellcheck="false" autocomplete="off" data-lv95-n="${idx}" value="${formatNum(p.lv95.n)}" placeholder="N" ${unlocked ? '' : 'disabled'} />
          </label>
          <label class="lv95-field lv95-field-span">
            <span>Paste E, N (map.geo.admin.ch)</span>
            <input type="text" class="lv95-pair-paste" spellcheck="false" autocomplete="off" data-lv95-pair="${idx}"
              placeholder="2'598'784.10, 1'200'158.40"
              ${unlocked ? '' : 'disabled'}
              title="E and N in one line, comma-separated" />
          </label>
          <div class="lv95-capture-wrap">
            <button class="ghost" type="button" data-capture="${idx}" ${unlocked ? '' : 'disabled'}>Capture from webapp</button>
          </div>
        </div>
      `
      view.pointsBody.appendChild(article)
    })

    updatePreviewButtons()
  }

  const loadActive = async () => {
    view.activeHint.textContent = ''
    view.previewHint.textContent = ''
    try {
      const res = await api.fetchLv95CalibrationActive({ token: state.token })
      if (res?.active?.id) {
        view.activeHint.textContent = `Active calibration: #${res.active.id}${res.active.label ? ` (${res.active.label})` : ''}`
      } else {
        view.activeHint.textContent = 'No active calibration yet.'
      }
    } catch (error) {
      view.activeHint.textContent = `Failed to load active calibration: ${error.message}`
    }
  }

  const unlock = () => {
    if (unlocked) return
    const ok = confirm('Unlock calibration editing? This can affect station coordinates.')
    if (!ok) return
    unlocked = true
    render()
  }

  const openCaptureMode = (idx) => {
    const captureUrl = `${getWebappBase()}?mode=capture&capture=pin`
      captureWindow = window.open(captureUrl, 'wellspace-capture', 'width=1200,height=800')
    if (!captureWindow) {
      shell.setStatus('Popup blocked. Please allow popups for the admin site, then try again.', true)
      window.open(captureUrl, '_blank', 'noopener')
      return
    }

    const handleMessage = (event) => {
      if (event.data && event.data.type === 'wellspace-capture') {
        const { target } = event.data
        if (target) {
          points[idx].world.x = Number(target.x.toFixed(3))
          points[idx].world.z = Number(target.z.toFixed(3))
        }
        shell.setStatus(`Captured point ${idx + 1} from webapp`, false)
        render()
        window.removeEventListener('message', handleMessage)
        if (captureWindow && !captureWindow.closed) captureWindow.close()
        captureWindow = null
      }
    }
    window.addEventListener('message', handleMessage)
  }

  const preview = async () => {
    shell.setStatus('Previewing calibration...', false)
    view.previewHint.textContent = ''
    try {
      const res = await api.previewLv95Calibration({ token: state.token, points })
      const rms = res?.diagnostics?.rms_m
      view.previewHint.textContent = Number.isFinite(rms) ? `Preview RMS: ${rms.toFixed(3)} m` : 'Preview ok'
      shell.setStatus('Preview computed', false)
    } catch (error) {
      shell.setStatus(error.message, true)
    }
  }

  const save = async () => {
    const ok = confirm('Save and activate this calibration?')
    if (!ok) return
    shell.setStatus('Saving calibration...', false)
    view.previewHint.textContent = ''
    try {
      const res = await api.saveLv95Calibration({
        token: state.token,
        label: view.labelInput.value.trim() || null,
        points,
        apply_to_stations: view.applyStations.checked,
      })
      shell.setStatus('Calibration saved', false)
      unlocked = false
      await loadActive()
      const rms = res?.diagnostics?.rms_m
      view.previewHint.textContent = Number.isFinite(rms) ? `Saved RMS: ${rms.toFixed(3)} m` : ''
      render()
    } catch (error) {
      shell.setStatus(error.message, true)
    }
  }

  function applyPairToRow(idx, pair) {
    if (!pair) return
    points[idx].lv95.e = pair.e
    points[idx].lv95.n = pair.n
    const row = view.pointsBody.querySelector(`[data-lv95-point="${idx}"]`)
    if (row) {
      const eIn = row.querySelector(`[data-lv95-e="${idx}"]`)
      const nIn = row.querySelector(`[data-lv95-n="${idx}"]`)
      const pIn = row.querySelector(`[data-lv95-pair="${idx}"]`)
      if (eIn) eIn.value = formatNum(pair.e)
      if (nIn) nIn.value = formatNum(pair.n)
      if (pIn) pIn.value = ''
    }
    updatePreviewButtons()
  }

  const bindEvents = () => {
    view.unlockBtn.addEventListener('click', unlock)
    view.previewBtn.addEventListener('click', preview)
    view.saveBtn.addEventListener('click', save)

    view.pointsBody.addEventListener('input', (e) => {
      const el = e.target
      if (!(el instanceof HTMLInputElement)) return

      const idxE = el.dataset.lv95E
      if (idxE !== undefined) {
        const v = parseSwissNumber(el.value)
        points[Number(idxE)].lv95.e = v
        updatePreviewButtons()
        return
      }

      const idxN = el.dataset.lv95N
      if (idxN !== undefined) {
        const v = parseSwissNumber(el.value)
        points[Number(idxN)].lv95.n = v
        updatePreviewButtons()
        return
      }

      const idxPair = el.dataset.lv95Pair
      if (idxPair !== undefined) {
        const pair = parseSwissLv95Pair(el.value)
        if (pair) applyPairToRow(Number(idxPair), pair)
        else updatePreviewButtons()
      }
    })

    view.pointsBody.addEventListener('paste', (e) => {
      const el = e.target
      if (!(el instanceof HTMLInputElement)) return
      const idxPair = el.dataset.lv95Pair
      if (idxPair === undefined) return
      e.preventDefault()
      const text = e.clipboardData?.getData('text/plain') ?? ''
      const pair = parseSwissLv95Pair(text)
      if (pair) {
        applyPairToRow(Number(idxPair), pair)
        shell.setStatus(`LV95 E/N pasted for point ${Number(idxPair) + 1}`, false)
      } else {
        el.value = text
        shell.setStatus('Could not parse pasted text as E, N (use comma between values)', true)
      }
    })

    view.pointsBody.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-capture]')
      if (!btn) return
      const idx = Number(btn.dataset.capture)
      if (!Number.isFinite(idx)) return
      openCaptureMode(idx)
    })
  }

  return {
    bindEvents,
    loadLv95Calibration: async () => {
      await loadActive()
      render()
    },
  }
}
