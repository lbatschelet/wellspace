/**
 * Self-contained 404 renderer for the admin app.
 * Injects its own styles so it does not depend on the main app stylesheet.
 * Exports: render404.
 */

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

/**
 * Renders a branded 404 card.
 * @param {object} opts
 * @param {HTMLElement} opts.mount - Container element.
 * @param {object} opts.brand - Brand config.
 * @param {string} opts.homeHref - Link target for the primary button.
 * @param {object} opts.copy - { de: {title, body, home}, en: {...} }.
 */
export function render404({ mount, brand, homeHref, copy }) {
  if (!mount) return
  injectStyles()
  const lang = pickLang()
  const t = copy[lang] || copy.en
  const titleHtml = brand?.wordmarkHtml || brand?.displayName || brand?.adminTitle || 'Wellspace'
  const feedbackUrl = `/feedback/?source=admin&path=${encodeURIComponent(window.location.pathname)}`
  const feedbackLabel = lang === 'de' ? 'Fehler melden / Feedback' : 'Report a bug / Feedback'

  mount.innerHTML = `
    <div class="ws-404">
      <div class="ws-404-card">
        <div class="ws-404-code">HTTP 404</div>
        <div class="ws-404-brand">${titleHtml}</div>
        <h1 class="ws-404-title">${t.title}</h1>
        <p class="ws-404-body">${t.body}</p>
        <div class="ws-404-actions">
          <a class="ws-404-btn" href="${homeHref}">${t.home}</a>
          <a class="ws-404-link" href="${feedbackUrl}">${feedbackLabel}</a>
        </div>
      </div>
    </div>
  `
}
