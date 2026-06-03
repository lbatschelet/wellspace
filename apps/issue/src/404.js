import { brand } from '@brand/config.js'

const STYLE_ID = 'ws-404-style'

const CSS = `
.ws-404 { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; background: #f3f4f6; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
.ws-404-card { width: min(640px, 100%); border-radius: 14px; padding: 24px; background: #fff; border: 1px solid #e5e7eb; box-shadow: 0 10px 30px rgba(15,23,42,0.08); }
.ws-404-code { font-size: 0.78rem; color: #94a3b8; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 8px; }
.ws-404-brand { font-size: 1.05rem; color: #111827; margin-bottom: 10px; }
.ws-404-brand em { font-style: italic; font-weight: 400; }
.ws-404-brand strong { font-weight: 700; font-style: normal; }
.ws-404-title { font-size: 1.6rem; line-height: 1.15; letter-spacing: -0.03em; margin: 0 0 10px; color: #0f172a; }
.ws-404-body { margin: 0 0 16px; color: #475569; max-width: 62ch; }
.ws-404-actions { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; }
.ws-404-btn { display: inline-flex; align-items: center; justify-content: center; padding: 10px 14px; border-radius: 12px; background: #2563eb; color: #fff; text-decoration: none; font-weight: 600; }
.ws-404-btn:hover { background: #1d4ed8; }
.ws-404-link { color: #0f172a; text-decoration: none; border-bottom: 1px solid rgba(15,23,42,0.25); padding-bottom: 1px; }
.ws-404-link:hover { border-bottom-color: rgba(37,99,235,0.9); color: #2563eb; }
`

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = CSS
  document.head.appendChild(style)
}

function pickLang() {
  const url = new URL(window.location.href)
  const q = url.searchParams.get('lang')
  const pick = (q || navigator.language || 'en').slice(0, 2).toLowerCase()
  return pick === 'de' ? 'de' : 'en'
}

const copy = {
  de: {
    title: 'Diese Feedback-Seite gibt es nicht.',
    body: 'Die angeforderte Seite wurde nicht gefunden. Über den Button kommst du zurück zum Feedback-Formular.',
    home: 'Zum Feedback-Formular',
    viewer: 'Zur Startseite',
  },
  en: {
    title: 'This feedback page does not exist.',
    body: 'The page you requested could not be found. Use the button to return to the feedback form.',
    home: 'Back to feedback form',
    viewer: 'Back to home',
  },
}

injectStyles()
const lang = pickLang()
const t = copy[lang] || copy.en
const titleHtml = brand?.wordmarkHtml || brand?.displayName || brand?.viewerTitle || 'Wellspace'

const app = document.querySelector('#app')
app.innerHTML = `
  <div class="ws-404">
    <div class="ws-404-card">
      <div class="ws-404-code">HTTP 404</div>
      <div class="ws-404-brand">${titleHtml}</div>
      <h1 class="ws-404-title">${t.title}</h1>
      <p class="ws-404-body">${t.body}</p>
      <div class="ws-404-actions">
        <a class="ws-404-btn" href="/feedback/">${t.home}</a>
        <a class="ws-404-link" href="/">${t.viewer}</a>
      </div>
    </div>
  </div>
`
