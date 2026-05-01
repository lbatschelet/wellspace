/**
 * Title component displayed top-left.
 * Brand wordmark heading (per tenant: brands slug folder, config field wordmarkHtml).
 * Exports: createTitleBar.
 */
import { brand } from '@brand/config.js'

/**
 * Creates the title DOM element.
 * @returns {{ ui: HTMLElement }}
 */
export function createTitleBar() {
  const ui = document.createElement('h1')
  ui.className = 'ui ui-title'
  ui.innerHTML = brand?.wordmarkHtml || brand?.displayName || 'App'
  ui.setAttribute('role', 'button')
  ui.tabIndex = 0

  return { ui }
}
