/**
 * Renders the success state after a successful issue submission.
 * @param {HTMLElement} cardElement — the `.issue-card` element
 * @param {object} options
 * @param {(key: string) => string} options.t
 * @param {() => void} options.onSubmitAnother
 */
export function renderSuccess(cardElement, { t, onSubmitAnother }) {
  cardElement.innerHTML = `
    <div class="issue-success">
      <div class="success-icon" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <h2>${t('success.title')}</h2>
      <p>${t('success.body')}</p>
      <a href="#" id="submitAnother">${t('success.again')}</a>
    </div>
  `
  cardElement.querySelector('#submitAnother')?.addEventListener('click', (e) => {
    e.preventDefault()
    onSubmitAnother()
  })
}

