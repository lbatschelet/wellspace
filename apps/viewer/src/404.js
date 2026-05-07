import './style.css'
import { brand } from '@brand/config.js'

const app = document.querySelector('#app')

function getLang() {
  const url = new URL(window.location.href)
  const q = url.searchParams.get('lang')
  const pick = (q || navigator.language || 'en').slice(0, 2).toLowerCase()
  return pick === 'de' ? 'de' : 'en'
}

const copy = {
  de: {
    title: 'Ups … hier ist gerade kein Wohlfühl‑Pin.',
    body: 'Diese Seite existiert nicht (mehr). Vielleicht hat sie sich im Gebäude verlaufen.',
    home: 'Zur Startseite',
    bug: 'Found a bug? / Feedback',
  },
  en: {
    title: 'Oops … there’s no wellbeing pin here.',
    body: 'This page doesn’t exist (anymore). Maybe it got lost in the building.',
    home: 'Back to home',
    bug: 'Found a bug? / Feedback',
  },
}

const lang = getLang()
const t = copy[lang]

const feedbackUrl = `/feedback/?source=viewer&path=${encodeURIComponent(window.location.pathname)}`

const titleHtml = brand?.wordmarkHtml || (brand?.displayName || brand?.viewerTitle || 'Wellspace')

app.innerHTML = `
  <div class="ws-404">
    <div class="ws-404-card">
      <div class="ws-404-code">HTTP 404</div>
      <div class="ws-404-brand">${titleHtml}</div>
      <h1 class="ws-404-title">${t.title}</h1>
      <p class="ws-404-body">${t.body}</p>
      <div class="ws-404-actions">
        <a class="ws-404-btn" href="/">${t.home}</a>
        <a class="ws-404-link" href="${feedbackUrl}">${t.bug}</a>
      </div>
    </div>
  </div>
`

