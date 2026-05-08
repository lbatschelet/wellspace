/**
 * Base API client utilities for JSON requests and error parsing.
 * Exports: API_BASE, getApiBase, requestJson, requestBlob.
 */
export const API_BASE = import.meta.env.VITE_API_BASE || '/api'

export function getApiBase() {
  return API_BASE
}

/**
 * Headers so the API can build correct password-reset URLs and email branding
 * for the tenant that triggered the request (same-origin admin host + base path).
 */
export function withAdminMailHeaders(headers = {}) {
  if (typeof window === 'undefined') {
    return headers
  }
  try {
    const baseRel = String(import.meta.env.BASE_URL || '/')
    const absolute = new URL(baseRel, window.location.origin).href.replace(/\/$/, '')
    const display =
      typeof import.meta.env.VITE_BRAND_DISPLAY_NAME === 'string'
        ? import.meta.env.VITE_BRAND_DISPLAY_NAME.trim()
        : ''
    /** @type {Record<string, string>} */
    const extra = {
      'X-Admin-Public-Base': absolute,
    }
    if (display) {
      extra['X-Admin-Brand-Display'] = display
    }
    return { ...extra, ...headers }
  } catch {
    return headers
  }
}

async function parseError(response) {
  let text = ''
  try {
    text = await response.text()
    const json = JSON.parse(text)
    if (json && json.error) {
      return `HTTP ${response.status}: ${json.error}`
    }
  } catch (error) {
    // ignore parsing errors
  }

  return `HTTP ${response.status}: ${text || response.statusText || 'Unbekannter Fehler'}`
}

export async function requestJson(url, options = {}) {
  const response = await fetch(url, { cache: 'no-store', ...options })
  if (!response.ok) {
    const message = await parseError(response)
    throw new Error(message)
  }
  return response.json()
}

export async function requestBlob(url, options = {}) {
  const response = await fetch(url, { cache: 'no-store', ...options })
  if (!response.ok) {
    const message = await parseError(response)
    throw new Error(message)
  }
  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition') || ''
  const match = disposition.match(/filename="?([^"]+)"?/i)
  return { blob, filename: match ? match[1] : 'export.csv' }
}
