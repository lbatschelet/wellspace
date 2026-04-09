/**
 * Generic confirm dialog (no browser popup).
 * Exports: createConfirmDialog.
 */
import { bindModalClose, hideModal, showModal } from '../utils/adminModal'

export function createConfirmDialog() {
  const backdrop = document.createElement('div')
  backdrop.className = 'modal-backdrop confirm-dialog'
  backdrop.innerHTML = `
    <div class="modal modal-sm" role="dialog" aria-modal="true" aria-labelledby="confirmTitle">
      <div class="modal-header">
        <h3 id="confirmTitle">Confirm</h3>
        <button type="button" class="modal-close" aria-label="Close">×</button>
      </div>
      <p class="unsaved-message confirm-message"></p>
      <div class="modal-actions">
        <button type="button" class="ghost" id="confirmCancel">Cancel</button>
        <button type="button" class="danger" id="confirmOk">Delete</button>
      </div>
    </div>
  `

  const titleEl = backdrop.querySelector('#confirmTitle')
  const messageEl = backdrop.querySelector('.confirm-message')
  const closeBtn = backdrop.querySelector('.modal-close')
  const cancelBtn = backdrop.querySelector('#confirmCancel')
  const okBtn = backdrop.querySelector('#confirmOk')

  let resolveCurrent = null

  const close = (result) => {
    hideModal(backdrop)
    if (resolveCurrent) {
      const resolve = resolveCurrent
      resolveCurrent = null
      resolve(Boolean(result))
    }
  }

  bindModalClose(backdrop, () => close(false), [closeBtn, cancelBtn])
  okBtn.addEventListener('click', () => close(true))

  const onKeyDown = (e) => {
    if (e.key === 'Escape') close(false)
  }

  const confirm = async ({
    title = 'Confirm',
    message = '',
    okLabel = 'OK',
    cancelLabel = 'Cancel',
  } = {}) => {
    titleEl.textContent = title
    messageEl.textContent = message
    okBtn.textContent = okLabel
    cancelBtn.textContent = cancelLabel

    showModal(backdrop)
    okBtn.focus()

    document.addEventListener('keydown', onKeyDown)
    return await new Promise((resolve) => {
      resolveCurrent = (result) => {
        document.removeEventListener('keydown', onKeyDown)
        resolve(result)
      }
    })
  }

  return { element: backdrop, confirm }
}

