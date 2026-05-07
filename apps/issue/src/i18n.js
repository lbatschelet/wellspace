/**
 * Internationalisation for the issue page.
 * Minimal, dependency-free i18n helper.
 */

const translations = {
  de: {
    'page.title': 'Meldung senden',
    'page.subtitle':
      'Melde einen Fehler oder schlage ein Feature vor. Wenn möglich, beschreibe kurz, was du erwartet hast und was passiert ist.',
    'category.label': 'Kategorie',
    'category.bug': 'Fehler',
    'category.feature': 'Feature',
    'category.other': 'Sonstiges',
    'title.label': 'Titel',
    'title.hint': '(kurz)',
    'title.placeholder.bug': 'z.B. Station-QR funktioniert nicht',
    'title.placeholder.feature': 'z.B. Export der Antworten',
    'title.placeholder.other': 'z.B. Frage zum Projekt',
    'description.label': 'Beschreibung',
    'description.hint': '(Details)',
    'description.placeholder.bug': 'Was ist passiert? Was hättest du erwartet?',
    'description.placeholder.feature': 'Was wäre hilfreich und warum?',
    'description.placeholder.other': 'Was möchtest du wissen?',
    'steps.label': 'Schritte',
    'steps.hint': '(optional)',
    'steps.placeholder': 'Wie kann man es reproduzieren?',
    submit: 'Absenden',
    'debug.summary': 'Technische Details (für Support)',
    'error.required': 'Bitte fülle Titel und Beschreibung aus.',
    'error.generic': 'Leider ist etwas schiefgelaufen. Bitte versuche es erneut.',
    'footer.for': 'für',
    'footer.license': 'Lizenziert unter',
    'footer.issues': 'Alle Meldungen',
    'success.title': 'Danke!',
    'success.body': 'Deine Meldung wurde gesendet.',
    'success.again': 'Noch eine Meldung senden',
  },
  en: {
    'page.title': 'Send report',
    'page.subtitle':
      'Report a bug or propose a feature. If possible, briefly describe what you expected and what happened.',
    'category.label': 'Category',
    'category.bug': 'Bug',
    'category.feature': 'Feature',
    'category.other': 'Other',
    'title.label': 'Title',
    'title.hint': '(short)',
    'title.placeholder.bug': 'e.g. station QR not working',
    'title.placeholder.feature': 'e.g. export answers',
    'title.placeholder.other': 'e.g. question about the project',
    'description.label': 'Description',
    'description.hint': '(details)',
    'description.placeholder.bug': 'What happened? What did you expect?',
    'description.placeholder.feature': 'What would help and why?',
    'description.placeholder.other': 'What do you want to know?',
    'steps.label': 'Steps',
    'steps.hint': '(optional)',
    'steps.placeholder': 'How can we reproduce it?',
    submit: 'Submit',
    'debug.summary': 'Technical details (for support)',
    'error.required': 'Please fill in title and description.',
    'error.generic': 'Something went wrong. Please try again.',
    'footer.for': 'for',
    'footer.license': 'Licensed under',
    'footer.issues': 'View all issues',
    'success.title': 'Thanks!',
    'success.body': 'Your report was sent.',
    'success.again': 'Send another report',
  },
}

export function createI18n({ initialLang }) {
  const supported = ['de', 'en']
  let lang = supported.includes(initialLang) ? initialLang : 'en'
  const listeners = new Set()

  const t = (key) => translations[lang]?.[key] ?? translations.en?.[key] ?? key

  const setLang = (next) => {
    if (!supported.includes(next)) return
    lang = next
    listeners.forEach((fn) => fn(lang))
  }

  return {
    t,
    getLang: () => lang,
    setLang,
    onLangChange: (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    getSupportedLanguages: () => supported.slice(),
  }
}

