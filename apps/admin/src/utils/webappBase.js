/**
 * Public viewer origin for QR / capture / "open site" links from admin.
 *
 * 1) `VITE_WEBAPP_BASE` — use when admin is built on a different host than the
 *    public viewer (rare); must point at the viewer origin.
 * 2) `window.location.origin` — same bundle on test.example or example: links
 *    follow the deployed host (single-origin setups).
 * 3) `brand.siteUrl` — fallback when no browser (tests, tooling).
 */
import { brand } from '@brand/config.js'

export function getPublicWebappBase() {
  const fromEnv = import.meta.env.VITE_WEBAPP_BASE
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/+$/, '')
  }
  if (
    typeof window !== 'undefined' &&
    window.location?.origin &&
    window.location.origin !== 'null'
  ) {
    return String(window.location.origin).replace(/\/+$/, '')
  }
  const fromBrand = brand?.siteUrl
  if (typeof fromBrand === 'string' && fromBrand.trim()) {
    return fromBrand.trim().replace(/\/+$/, '')
  }
  return ''
}
