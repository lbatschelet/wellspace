/**
 * Canonical public viewer URL origin for QR / capture links from admin.
 *
 * Prefer explicit build override (VITE_WEBAPP_BASE); else brand.siteUrl from
 * @brand/config; else current page origin when running in browser.
 */
import { brand } from '@brand/config.js'

export function getPublicWebappBase() {
  const fromEnv = import.meta.env.VITE_WEBAPP_BASE
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/+$/, '')
  }
  const fromBrand = brand?.siteUrl
  if (typeof fromBrand === 'string' && fromBrand.trim()) {
    return fromBrand.trim().replace(/\/+$/, '')
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return String(window.location.origin).replace(/\/+$/, '')
  }
  return ''
}
