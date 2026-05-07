/**
 * Pins renderer for table rows and pagination UI.
 * Exports: createPinsRenderer.
 */
import { escapeHtml, formatDate, formatPercent } from '../../utils/format'
import { getFilteredPins, paginatePins } from '../../services/pinsService'
import { getStatusClass, getStatusLabel, getNextStatus } from './status'
import { updatePagination, emptyRow } from '../../utils/adminTable'
import { icons } from '../../utils/dom'

export function createPinsRenderer({ state, views, api, shell }) {
  const {
    pinCount,
    pageInfo,
    firstPageButton,
    prevPageButton,
    nextPageButton,
    lastPageButton,
    pinsBody,
  } = views.pinsView

  const translateOption = (questionKey, optionKey) => {
    const key = `options.${questionKey}.${optionKey}`
    return state.translations[key] || optionKey
  }

  const translateQuestionLabel = (questionKey) => {
    const key = `questions.${questionKey}.label`
    return state.translations[key] || questionKey
  }

  let cachedTextKeys = null
  let cachedQuestionsRef = null

  const getTextQuestionKeys = () => {
    if (cachedQuestionsRef === state.questions && Array.isArray(cachedTextKeys)) return cachedTextKeys
    cachedQuestionsRef = state.questions
    cachedTextKeys = (state.questions || [])
      .map((q) => q?.question_key || q?.key)
      .filter(Boolean)
      .filter((qKey, idx, arr) => arr.indexOf(qKey) === idx)
      .filter((qKey) => {
        const q = (state.questions || []).find((item) => (item.question_key || item.key) === qKey)
        const type = q?.question_type || q?.type
        return type === 'text'
      })
    return cachedTextKeys
  }

  const formatAnswerForKey = (pin, key) => {
    const generic = (pin && typeof pin.generic_answers === 'object' && pin.generic_answers) ? pin.generic_answers : {}
    if (key === 'wellbeing') return formatPercent(pin.wellbeing)
    if (key === 'note') return (pin.note || '').trim() || '—'
    if (key === 'group') return pin.group_key ? translateOption('group', pin.group_key) : '—'
    if (key === 'reasons') {
      return Array.isArray(pin.reasons) && pin.reasons.length
        ? pin.reasons.map((opt) => translateOption('reasons', opt)).join(', ')
        : '—'
    }
    const raw = generic[key]
    if (raw == null) return '—'
    const text = String(raw).trim()
    return text || '—'
  }

  const askedKeysForPin = (pin) => {
    const asked = Array.isArray(pin.asked_questions) ? pin.asked_questions : []
    if (asked.length) return asked
    // Legacy fallback (older pins without snapshot).
    return ['wellbeing', 'reasons', 'group', 'note']
  }

  const buildTextOverview = (pin) => {
    const generic = (pin && typeof pin.generic_answers === 'object' && pin.generic_answers) ? pin.generic_answers : {}
    const textAnswerSource = {
      ...generic,
      // Only show if there is an actual question with type === 'text' for this key.
      note: (pin?.note || '').trim(),
    }
    const parts = []
    getTextQuestionKeys().forEach((qKey) => {
      const raw = textAnswerSource[qKey]
      if (raw == null) return
      const val = String(raw).trim()
      if (!val) return
      parts.push(`${qKey}: ${val}`)
    })

    const joined = parts.join(' · ')
    // Keep the overview compact; full text is available in the expanded row.
    if (joined.length > 220) return `${joined.slice(0, 217)}...`
    return joined
  }

  const renderPins = () => {
    pinsBody.innerHTML = ''
    const filteredPins = getFilteredPins(state.pins, {
      filter: state.filter,
      query: state.query,
      sort: state.sort,
    })
    const { items: pagePins, page, total, maxPage } = paginatePins(
      filteredPins,
      state.pageIndex,
      state.pageSize
    )
    state.pageIndex = page
    pinCount.textContent = String(total)

    updatePagination({
      page,
      maxPage,
      pageInfo,
      firstBtn: firstPageButton,
      prevBtn: prevPageButton,
      nextBtn: nextPageButton,
      lastBtn: lastPageButton,
    })

    if (!pagePins.length) {
      pinsBody.innerHTML = emptyRow(7, 'No pins found')
      return
    }

    pagePins.forEach((pin) => {
      const row = document.createElement('tr')
      row.className = 'pin-row'
      row.dataset.id = String(pin.id)
      const statusLabel = getStatusLabel(pin.approved)
      const stationLabel = pin.station_key ? escapeHtml(pin.station_key) : ''
      const questionnaireLabel = pin.questionnaire_key ? escapeHtml(pin.questionnaire_key) : ''
      const textOverview = buildTextOverview(pin)
      const statusIcon = pin.approved === 1
        ? icons.statusApproved
        : (pin.approved === -1 ? icons.statusRejected : icons.statusPending)
      row.innerHTML = `
        <td><input type="checkbox" data-id="${pin.id}" /></td>
        <td><span class="pin-expand" aria-hidden="true">›</span> ${pin.id}</td>
        <td>${stationLabel}</td>
        <td>${questionnaireLabel}</td>
        <td><div class="text-answers-cell">${escapeHtml(textOverview || '—')}</div></td>
        <td>${formatDate(pin.created_at)}</td>
        <td class="text-right">
          <button class="toggle icon-only ${getStatusClass(pin.approved)}" data-id="${pin.id}" title="${escapeHtml(statusLabel)} (click to cycle)">
            <span class="status-icon" aria-hidden="true">${statusIcon}</span>
            <span class="sr-only">${escapeHtml(statusLabel)}</span>
          </button>
        </td>
      `
      pinsBody.appendChild(row)

      // Expandable details row (answers + asked/unasked).
      const detailsRow = document.createElement('tr')
      detailsRow.className = 'pin-details is-hidden'
      detailsRow.dataset.id = String(pin.id)
      detailsRow.innerHTML = `<td colspan="7"><div class="pin-details-inner"></div></td>`
      const detailsInner = detailsRow.querySelector('.pin-details-inner')
      pinsBody.appendChild(detailsRow)

      const renderDetails = () => {
        const list = []
        const push = (label, value) => {
          list.push(`<div class="kv"><span class="k">${escapeHtml(label)}</span><span class="v">${escapeHtml(value || '—')}</span></div>`)
        }

        // Show exactly the questions that were asked, with their answers.
        askedKeysForPin(pin).forEach((qKey) => {
          const label = translateQuestionLabel(qKey)
          const value = formatAnswerForKey(pin, qKey)
          push(label, value)
        })

        detailsInner.innerHTML = list.join('')
      }

      // Store a cheap marker so delegated handler knows details are rendered.
      detailsRow.dataset.rendered = '0'
      detailsRow._renderDetails = renderDetails
    })

    // Delegated events (avoid per-row listeners).
    if (!pinsBody.dataset.bound) {
      pinsBody.dataset.bound = '1'
      pinsBody.addEventListener('click', async (e) => {
        const toggleBtn = e.target.closest('button.toggle')
        if (toggleBtn) {
          const id = Number(toggleBtn.dataset.id)
          const pin = state.pins.find((item) => item.id === id)
          if (!pin) return
          const nextApproved = getNextStatus(pin.approved)
          toggleBtn.disabled = true
          try {
            await api.updatePinApprovalBulk({
              token: state.token,
              ids: [id],
              approved: nextApproved,
            })
            pin.approved = nextApproved
            // Update UI in-place (avoid full rerender).
            toggleBtn.className = `toggle icon-only ${getStatusClass(pin.approved)}`
            const statusLabel = getStatusLabel(pin.approved)
            toggleBtn.title = `${statusLabel} (click to cycle)`
            const statusIcon = pin.approved === 1
              ? icons.statusApproved
              : (pin.approved === -1 ? icons.statusRejected : icons.statusPending)
            const iconEl = toggleBtn.querySelector('.status-icon')
            if (iconEl) iconEl.innerHTML = statusIcon
            const sr = toggleBtn.querySelector('.sr-only')
            if (sr) sr.textContent = statusLabel
          } catch (error) {
            shell.setStatus(error.message, true)
          } finally {
            toggleBtn.disabled = false
          }
          return
        }

        if (e.target.closest('input[type="checkbox"]')) return
        const row = e.target.closest('tr.pin-row')
        if (!row) return
        const id = row.dataset.id
        const detailsRow = pinsBody.querySelector(`tr.pin-details[data-id="${CSS.escape(id)}"]`)
        if (!detailsRow) return
        const willShow = detailsRow.classList.contains('is-hidden')
        if (willShow) {
          if (detailsRow.dataset.rendered !== '1') {
            detailsRow._renderDetails?.()
            detailsRow.dataset.rendered = '1'
          }
          detailsRow.classList.remove('is-hidden')
          row.classList.add('is-expanded')
          const caret = row.querySelector('.pin-expand')
          if (caret) caret.textContent = '⌄'
        } else {
          detailsRow.classList.add('is-hidden')
          row.classList.remove('is-expanded')
          const caret = row.querySelector('.pin-expand')
          if (caret) caret.textContent = '›'
        }
      })
    }
  }

  return { renderPins }
}
