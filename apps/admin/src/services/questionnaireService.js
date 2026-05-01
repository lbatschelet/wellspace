/**
 * Questionnaire validation helpers for translations.
 * Exports: validateQuestionTranslations.
 */
export function validateQuestionTranslations({ type, languages, valuesByLang }) {
  for (const language of languages) {
    const entry = valuesByLang[language.lang] || {}
    if (!entry.label) {
      return { ok: false, message: `Missing label (${language.lang})` }
    }
    if (type === 'slider') {
      if (!entry.legend_low || !entry.legend_high) {
        return { ok: false, message: `Missing legends (${language.lang})` }
      }
    }
    if (type === 'influence') {
      if (!entry.legend_negative || !entry.legend_positive) {
        return { ok: false, message: `Missing influence scale labels (${language.lang})` }
      }
    }
  }
  return { ok: true }
}
