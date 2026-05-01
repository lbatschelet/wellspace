/**
 * Parse LV95 numbers as shown on map.geo.admin.ch, e.g. 2'598'784.10
 * Apostrophe = thousands separator; decimal is usually '.'.
 */
export function parseSwissNumber(raw) {
  if (raw == null) return null
  const s = String(raw).trim()
  if (s === '') return null
  // Remove thousands apostrophes and thin spaces
  let t = s.replace(/'/g, '').replace(/\u2019/g, '').replace(/\s/g, '')
  // If only one comma and it looks like decimal (e.g. 2598784,10)
  if (/^\d+,\d+$/.test(t)) t = t.replace(',', '.')
  const n = parseFloat(t)
  return Number.isFinite(n) ? n : null
}

/**
 * Parse a pasted pair like: 2'598'784.10, 1'200'158.40
 * (comma between E and N; optional spaces)
 */
export function parseSwissLv95Pair(text) {
  if (text == null) return null
  const s = String(text).trim()
  if (!s) return null
  // Split on first comma that separates two numbers (not inside apostrophe groups)
  const commaIdx = s.indexOf(',')
  if (commaIdx === -1) return null
  const left = s.slice(0, commaIdx).trim()
  const right = s.slice(commaIdx + 1).trim()
  const e = parseSwissNumber(left)
  const n = parseSwissNumber(right)
  if (e == null || n == null) return null
  return { e, n }
}
