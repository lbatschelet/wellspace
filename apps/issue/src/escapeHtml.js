/**
 * Escapes a string for safe HTML interpolation (very small helper).
 */
export function escapeHtml(input) {
  const div = document.createElement('div')
  div.textContent = String(input ?? '')
  return div.innerHTML
}

