/**
 * Formatting utilities for display values.
 * Exports: formatPercent, formatTimestamp.
 */
import { getLocale, t } from '../i18n'
import { TIME_ZONE } from '../time'

function parseUtcLikeTimestamp(value) {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value !== 'string') return new Date(value)

  const s = value.trim()
  // API returns UTC timestamps like "YYYY-MM-DD HH:MM:SS" (no timezone).
  // Interpret these explicitly as UTC so UI can localize correctly.
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) {
    return new Date(s.replace(' ', 'T') + 'Z')
  }
  // If already ISO (with or without zone), let Date parse it.
  return new Date(s)
}

export function formatPercent(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return t('ui.empty')
  const formatted = numeric.toLocaleString(getLocale(), {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  return `${formatted}%`
}

export function formatTimestamp(value) {
  if (!value) return t('ui.empty')
  const date = parseUtcLikeTimestamp(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(getLocale(), { timeZone: TIME_ZONE })
}
