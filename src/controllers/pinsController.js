/**
 * Pins controller orchestrates loader, renderer, and actions.
 * Exports: createPinsController.
 */
import { createPinsLoader } from './pins/loader'
import { createPinsRenderer } from './pins/renderer'
import { createPinsActions } from './pins/actions'

export function createPinsController({ state, views, api, shell, renderDashboard }) {
  const loader = createPinsLoader({ state, api })
  const renderer = createPinsRenderer({ state, views, api, shell })
  const actions = createPinsActions({ state, views, api, shell, render: renderer })

  const applyDeletePermissions = () => {
    const { deleteSelected } = views.pinsView
    // Keep the button visible, but only usable for admins.
    // bindEvents runs before login (state.isAdmin=false), so we must update later too.
    deleteSelected.style.display = ''
    deleteSelected.disabled = !state.isAdmin
  }

  const loadPins = async () => {
    shell.setStatus('Loading pins...', false)
    try {
      await loader.loadPins()
      // Pins view needs the question library to derive "text answers" reliably.
      if ((!state.questions || !state.questions.length) && typeof api.fetchQuestions === 'function') {
        try {
          state.questions = await api.fetchQuestions({ token: state.token })
        } catch {
          // Leave empty; renderer will show no text answers rather than breaking.
        }
      }
      state.error = ''
      renderer.renderPins()
      renderDashboard()
      applyDeletePermissions()
      shell.setStatus(`Connected (${state.pins.length} entries)`, false)
    } catch (error) {
      state.error = error.message
      renderer.renderPins()
      renderDashboard()
      applyDeletePermissions()
      shell.setStatus(error.message, true)
    }
  }

  const bindEvents = () => {
    const {
      reloadButton,
      exportCsvButton,
      exportCsvLongButton,
      exportCsvMenuButton,
      exportCsvMenuPanel,
      pageSizeSelect,
      prevPageButton,
      nextPageButton,
      searchInput,
      filterSelect,
      sortSelect,
      approveSelected,
      pendingSelected,
      blockSelected,
      deleteSelected,
      selectAll,
      pinsBody,
    } = views.pinsView

    reloadButton.addEventListener('click', () => loadPins())
    exportCsvButton.addEventListener('click', () => actions.exportCsv())
    exportCsvLongButton.addEventListener('click', () => {
      actions.exportCsvLong()
      exportCsvMenuPanel.classList.remove('is-open')
      exportCsvMenuButton?.setAttribute('aria-expanded', 'false')
    })
    exportCsvMenuButton.addEventListener('click', (e) => {
      e.stopPropagation()
      const willOpen = !exportCsvMenuPanel.classList.contains('is-open')
      exportCsvMenuPanel.classList.toggle('is-open', willOpen)
      exportCsvMenuButton.setAttribute('aria-expanded', willOpen ? 'true' : 'false')
    })
    document.addEventListener('click', () => {
      exportCsvMenuPanel.classList.remove('is-open')
      exportCsvMenuButton?.setAttribute('aria-expanded', 'false')
    })
    exportCsvMenuPanel.addEventListener('click', (e) => e.stopPropagation())
    searchInput.addEventListener('input', (event) => {
      state.query = event.target.value.toLowerCase()
      state.pageIndex = 1
      renderer.renderPins()
    })
    filterSelect.addEventListener('change', (event) => {
      state.filter = event.target.value
      state.pageIndex = 1
      renderer.renderPins()
    })
    sortSelect.addEventListener('change', (event) => {
      state.sort = event.target.value
      state.pageIndex = 1
      renderer.renderPins()
    })
    pageSizeSelect.addEventListener('change', (event) => {
      state.pageSize = Number(event.target.value)
      state.pageIndex = 1
      renderer.renderPins()
    })
    views.pinsView.firstPageButton.addEventListener('click', () => {
      state.pageIndex = 1
      renderer.renderPins()
    })
    prevPageButton.addEventListener('click', () => {
      state.pageIndex = Math.max(1, state.pageIndex - 1)
      renderer.renderPins()
    })
    nextPageButton.addEventListener('click', () => {
      state.pageIndex += 1
      renderer.renderPins()
    })
    views.pinsView.lastPageButton.addEventListener('click', () => {
      // maxPage is computed in renderPins; set a very high number and let it clamp
      state.pageIndex = 999999
      renderer.renderPins()
    })
    approveSelected.addEventListener('click', () => actions.bulkUpdateApproval(1))
    pendingSelected.addEventListener('click', () => actions.bulkUpdateApproval(0))
    blockSelected.addEventListener('click', () => actions.bulkUpdateApproval(-1))
    deleteSelected.addEventListener('click', actions.bulkDelete)
    selectAll.addEventListener('change', () => {
      const checked = selectAll.checked
      pinsBody.querySelectorAll('input[type="checkbox"][data-id]').forEach((input) => {
        input.checked = checked
      })
    })

    applyDeletePermissions()
  }

  return { bindEvents, loadPins, renderPins: renderer.renderPins }
}
