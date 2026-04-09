/**
 * Pins renderer for table rows and pagination UI.
 * Exports: createPinsRenderer.
 */
import { escapeHtml, formatDate, formatPercent } from '../../utils/format'
import { getFilteredPins, paginatePins } from '../../services/pinsService'
import { getStatusClass, getStatusLabel, getNextStatus } from './status'
import { updatePagination, emptyRow } from '../../utils/adminTable'

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
      pinsBody.innerHTML = emptyRow(6, 'No pins found')
      return
    }

    pagePins.forEach((pin) => {
      const row = document.createElement('tr')
      const statusLabel = getStatusLabel(pin.approved)
      const stationLabel = pin.station_key ? escapeHtml(pin.station_key) : ''
      const questionnaireLabel = pin.questionnaire_key ? escapeHtml(pin.questionnaire_key) : ''
      row.innerHTML = `
        <td><input type="checkbox" data-id="${pin.id}" /></td>
        <td>${pin.id}</td>
        <td>${stationLabel}</td>
        <td>${questionnaireLabel}</td>
        <td>${formatDate(pin.created_at)}</td>
        <td class="text-right">
          <button class="toggle ${getStatusClass(pin.approved)}" data-id="${pin.id}" title="Click to cycle status">
            ${statusLabel}
          </button>
        </td>
      `
      pinsBody.appendChild(row)

      // Expandable details row (answers + asked/unasked).
      const detailsRow = document.createElement('tr')
      detailsRow.className = 'pin-details is-hidden'
      detailsRow.innerHTML = `<td colspan="6"><div class="pin-details-inner"></div></td>`
      const detailsInner = detailsRow.querySelector('.pin-details-inner')
      pinsBody.appendChild(detailsRow)

      const renderDetails = async () => {
        const asked = Array.isArray(pin.asked_questions) ? pin.asked_questions : []
        const generic = (pin && typeof pin.generic_answers === 'object' && pin.generic_answers) ? pin.generic_answers : {}
        const reasons = Array.isArray(pin.reasons)
          ? pin.reasons.map((key) => translateOption('reasons', key)).join(', ')
          : ''
        const groupLabel = pin.group_key ? translateOption('group', pin.group_key) : ''
        const note = pin.note || ''

        const list = []
        const push = (label, value) => {
          list.push(`<div class="kv"><span class="k">${escapeHtml(label)}</span><span class="v">${escapeHtml(value || '—')}</span></div>`)
        }

        push('Floor', String(pin.floor_index))
        push('Wellbeing', formatPercent(pin.wellbeing))
        push('Reasons', reasons)
        push('Group', groupLabel)
        push('Note', note)
        push('Asked questions', asked.join(', '))
        push('Generic answers (JSON)', JSON.stringify(generic))

        detailsInner.innerHTML = list.join('')
      }

      // Toggle details on row click (except checkbox/toggle button).
      row.addEventListener('click', async (e) => {
        if (e.target.closest('input[type="checkbox"]')) return
        if (e.target.closest('button.toggle')) return
        const willShow = detailsRow.classList.contains('is-hidden')
        if (willShow) {
          await renderDetails()
          detailsRow.classList.remove('is-hidden')
        } else {
          detailsRow.classList.add('is-hidden')
        }
      })
    })

    pinsBody.querySelectorAll('.toggle').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = Number(button.dataset.id)
        const pin = state.pins.find((item) => item.id === id)
        if (!pin) return
        const nextApproved = getNextStatus(pin.approved)
        if (nextApproved === -1) {
          const ok = window.confirm('Reject this pin?\n\nThis is effectively irreversible. Use with care.')
          if (!ok) return
        }
        button.disabled = true
        try {
          await api.updatePinApprovalBulk({
            token: state.token,
            ids: [id],
            approved: nextApproved,
          })
          pin.approved = nextApproved
          renderPins()
        } catch (error) {
          shell.setStatus(error.message, true)
          button.disabled = false
        }
      })
    })
  }

  return { renderPins }
}
