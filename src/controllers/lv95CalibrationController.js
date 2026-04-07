/**
 * LV95 calibration controller.
 * Exports: createLv95CalibrationController.
 */
export function createLv95CalibrationController({ state, views, api, shell }) {
  const view = views.lv95CalibrationView

  let unlocked = false
  let captureWindow = null

  const points = Array.from({ length: 3 }).map(() => ({
    world: { x: null, z: null },
    lv95: { e: null, n: null },
  }))

  const getWebappBase = () => import.meta.env.VITE_WEBAPP_BASE || 'https://feelvonroll.ch'

  const render = () => {
    view.pointsBody.innerHTML = ''
    points.forEach((p, idx) => {
      const tr = document.createElement('tr')
      tr.innerHTML = `
        <td><strong>${idx + 1}</strong></td>
        <td><input type="number" step="any" data-world-x="${idx}" value="${p.world.x ?? ''}" ${unlocked ? 'readonly' : 'readonly'} /></td>
        <td><input type="number" step="any" data-world-z="${idx}" value="${p.world.z ?? ''}" ${unlocked ? 'readonly' : 'readonly'} /></td>
        <td><input type="number" step="any" data-lv95-e="${idx}" value="${p.lv95.e ?? ''}" ${unlocked ? '' : 'disabled'} /></td>
        <td><input type="number" step="any" data-lv95-n="${idx}" value="${p.lv95.n ?? ''}" ${unlocked ? '' : 'disabled'} /></td>
        <td class="actions-cell">
          <button class="ghost" type="button" data-capture="${idx}" ${unlocked ? '' : 'disabled'}>Capture</button>
        </td>
      `
      view.pointsBody.appendChild(tr)
    })

    const canPreview = unlocked && points.every((p) =>
      Number.isFinite(p.world.x) && Number.isFinite(p.world.z) && Number.isFinite(p.lv95.e) && Number.isFinite(p.lv95.n)
    )
    view.previewBtn.disabled = !canPreview
    view.saveBtn.disabled = !canPreview
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
    const captureUrl = `${getWebappBase()}?mode=capture`
    captureWindow = window.open(captureUrl, 'feelvonroll-capture', 'width=1200,height=800')

    const handleMessage = (event) => {
      if (event.data && event.data.type === 'feelvonroll-capture') {
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

  const bindEvents = () => {
    view.unlockBtn.addEventListener('click', unlock)
    view.previewBtn.addEventListener('click', preview)
    view.saveBtn.addEventListener('click', save)

    view.pointsBody.addEventListener('input', (e) => {
      const el = e.target
      if (!(el instanceof HTMLInputElement)) return

      const idxE = el.dataset.lv95E
      const idxN = el.dataset.lv95N
      if (idxE !== undefined) {
        points[Number(idxE)].lv95.e = el.value === '' ? null : parseFloat(el.value)
        render()
      }
      if (idxN !== undefined) {
        points[Number(idxN)].lv95.n = el.value === '' ? null : parseFloat(el.value)
        render()
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

