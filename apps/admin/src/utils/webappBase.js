/**
 * Canonical public viewer URL origin for QR / capture links from admin.
 *
 * Order: optional build override `VITE_WEBAPP_BASE`, then `brand.siteUrl`
 * from @brand/config (frozen at build time — should match production for
 * prod-identical artifacts); last resort `window.location.origin`.
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
