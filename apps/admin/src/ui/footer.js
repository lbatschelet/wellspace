/**
 * Footer builder with license, author credit, and bug report link.
 * Exports: createFooter.
 */
import { getPublicWebappBase } from '../utils/webappBase'

const issueBase =
  (typeof import.meta.env.VITE_WEBAPP_URL === 'string' && import.meta.env.VITE_WEBAPP_URL.trim()
    ? import.meta.env.VITE_WEBAPP_URL.trim().replace(/\/+$/, '')
    : getPublicWebappBase()) || ''
const ISSUE_URL = issueBase ? `${issueBase}/issue/?source=admin` : '#'

export function createFooter() {
  const footer = document.createElement('footer')
  footer.className = 'app-footer'
  const year = new Date().getFullYear()
  footer.innerHTML = `
    <div class="footer-left">
      <span class="footer-credit">
        © ${year}
        <a href="https://lukasbatschelet.ch" target="_blank" rel="noopener">Lukas Batschelet</a>
        for
        <a href="https://www.phbern.ch" target="_blank" rel="noopener" class="footer-phbern" title="PHBern"><strong>PH</strong>&thinsp;Bern</a>
      </span>
      <span class="footer-license">
        Licensed under <a href="https://github.com/lbatschelet/wellspace/blob/main/LICENSE" target="_blank" rel="noopener">AGPL-3.0</a>
      </span>
    </div>
    <a class="footer-bug" href="${ISSUE_URL}" target="_blank" rel="noopener" title="Report a bug or request a feature">
      Report a bug
    </a>
  `
  return { element: footer }
}
