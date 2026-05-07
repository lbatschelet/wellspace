/**
 * About overlay component.
 * Full-screen backdrop with scrollable Markdown content and close button.
 * Exports: createAboutOverlay.
 */

/**
 * Creates the about overlay DOM structure.
 * @returns {{ backdrop: HTMLElement, contentArea: HTMLElement, closeButton: HTMLElement, show: () => void, hide: () => void, setContent: (html: string) => void }}
 */
export function createAboutOverlay() {
  const backdrop = document.createElement('div')
  backdrop.className = 'ui-about-backdrop'

  const dialog = document.createElement('div')
  dialog.className = 'ui-about-dialog'
  backdrop.appendChild(dialog)

  const closeButton = document.createElement('button')
  closeButton.type = 'button'
  closeButton.className = 'ui-about-close'
  closeButton.setAttribute('aria-label', 'Close')
  closeButton.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6 6l12 12M18 6l-12 12" />
    </svg>
  `
  dialog.appendChild(closeButton)

  const contentArea = document.createElement('div')
  contentArea.className = 'about-content'
  dialog.appendChild(contentArea)

  closeButton.addEventListener('click', hide)
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) hide()
  })

  function show() {
    backdrop.classList.add('is-visible')
  }

  function hide() {
    backdrop.classList.remove('is-visible')
  }

  function setContent(html) {
    contentArea.innerHTML = html

    // Clone header logos for mobile placement (above footer)
    const existingMobileLogos = contentArea.querySelector('.about-logos-mobile')
    if (existingMobileLogos) existingMobileLogos.remove()

    const headerLogos = contentArea.querySelector('.about-header-logos')
    const footer = contentArea.querySelector('.about-footer')
    if (headerLogos && footer) {
      const mobileLogos = headerLogos.cloneNode(true)
      mobileLogos.className = 'about-logos-mobile'
      footer.parentNode.insertBefore(mobileLogos, footer)
    }

    // Inject build version into the about footer (if present).
    if (footer) {
      const existing = footer.querySelector('.about-version')
      if (!existing) {
        const version = String(import.meta.env.VITE_APP_VERSION || 'dev')
        const releasesUrl = 'https://github.com/lbatschelet/wellspace/releases'
        const isLikelyExactTag =
          /^v[0-9]/.test(version) &&
          !/-g[0-9a-f]{7,}$/i.test(version) &&
          !/dirty/i.test(version)
        const href = isLikelyExactTag
          ? `${releasesUrl}#${encodeURIComponent(version)}`
          : releasesUrl
        const el = document.createElement('a')
        el.className = 'about-version'
        el.href = href
        el.target = '_blank'
        el.rel = 'noopener'
        el.textContent = version

        // Place the version under the "report a bug" link (if present).
        const bugLink = footer.querySelector('.about-footer-bug')
        if (bugLink && bugLink.parentElement === footer) {
          let right = footer.querySelector('.about-footer-right')
          if (!right) {
            right = document.createElement('div')
            right.className = 'about-footer-right'
            footer.appendChild(right)
          }
          right.appendChild(bugLink)
          right.appendChild(el)
        } else {
          footer.appendChild(el)
        }
      }
    }
  }

  document.body.appendChild(backdrop)

  return { backdrop, contentArea, closeButton, show, hide, setContent }
}
