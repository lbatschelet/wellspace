/**
 * Formatting helpers for dates, percentages, and HTML escaping.
 * Exports: formatDate, formatPercent, escapeHtml.
 */
import { TIME_ZONE } from '../time'

function parseUtcLikeTimestamp(value) {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value !== 'string') return new Date(value)

  const s = value.trim()
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) {
    return new Date(s.replace(' ', 'T') + 'Z')
  }
  return new Date(s)
}

export function formatDate(value) {
  if (!value) return '-'
  const date = parseUtcLikeTimestamp(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('de-CH', { timeZone: TIME_ZONE })
}

export function formatPercent(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '-'
  const formatted = numeric.toLocaleString('de-CH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  return `${formatted}%`
}

export function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
