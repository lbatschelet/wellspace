/**
 * Collects client-side debug information for issue submissions.
 * Single responsibility: environment introspection.
 *
 * Exports: collectDebugInfo.
 */

function parseBrowser(ua) {
  if (ua.includes('Firefox/')) return 'Firefox ' + ua.split('Firefox/')[1].split(' ')[0]
  if (ua.includes('Edg/')) return 'Edge ' + ua.split('Edg/')[1].split(' ')[0]
  if (ua.includes('Chrome/')) return 'Chrome ' + ua.split('Chrome/')[1].split(' ')[0]
  if (ua.includes('Safari/') && ua.includes('Version/'))
    return 'Safari ' + ua.split('Version/')[1].split(' ')[0]
  return 'Unknown'
}

function parseOS(ua) {
  if (ua.includes('Windows NT')) return 'Windows'
  if (ua.includes('Mac OS X')) return 'macOS'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
  if (ua.includes('Linux')) return 'Linux'
  return 'Unknown'
}

/**
 * @param {{ source: string, language: string }} context
 * @returns {Record<string, string>}
 */
export function collectDebugInfo({ source, language }) {
  const ua = navigator.userAgent
  const version = String(import.meta.env.VITE_APP_VERSION || 'dev')
  const brand = typeof __BRAND__ === 'string' ? __BRAND__ : ''
  const maxTouchPoints = Number(navigator.maxTouchPoints || 0)
  const hasTouch =
    maxTouchPoints > 0 ||
    (typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)')?.matches === true)
  const pointer = typeof window !== 'undefined' ? window.matchMedia?.('(pointer: coarse)') : null
  const hover = typeof window !== 'undefined' ? window.matchMedia?.('(hover: hover)') : null
  return {
    // Where the form runs (this page)
    page: 'feedback',
    // Originating app that opened the feedback form (query param "source")
    sourceApp: source || 'unknown',
    version,
    brand: brand || '(unknown)',
    // Backwards-compatible field name used by the API body builder
    source,
    browser: parseBrowser(ua),
    os: parseOS(ua),
    touch: hasTouch ? 'yes' : 'no',
    maxTouchPoints: String(maxTouchPoints),
    pointerCoarse: pointer?.matches === true ? 'yes' : 'no',
    hover: hover?.matches === true ? 'yes' : 'no',
    devicePixelRatio: String(window.devicePixelRatio || 1),
    screen: `${screen.width}\u00d7${screen.height}`,
    viewport: `${window.innerWidth}\u00d7${window.innerHeight}`,
    language,
    referrer: document.referrer || '(none)',
    timestamp: new Date().toISOString(),
    userAgent: ua,
  }
}

