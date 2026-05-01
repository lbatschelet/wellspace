/**
 * Minimal client-side router using the History API.
 * Exports: createRouter.
 *
 * Single responsibility: URL ↔ page-key mapping and history management.
 * Knows nothing about views, state, or auth.
 */

const ROUTES = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/pins': 'pins',
  '/questionnaire': 'questionnaire',
  '/questionnaires': 'questionnaires',
  '/stations': 'stations',
  '/calibration': 'calibration',
  '/languages': 'languages',
  '/users': 'users',
  '/audit': 'audit',
  '/content': 'content',
}

const PUBLIC_PATHS = ['/reset', '/login']

export function createRouter() {
  let onChange = null
  const baseUrl = String(import.meta.env.BASE_URL || '/')
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`

  const stripBase = (pathname) => {
    const p = String(pathname || '')
    if (base === '/') return p || '/'
    if (p === base.slice(0, -1)) return '/'
    if (p.startsWith(base)) return `/${p.slice(base.length).replace(/^\/+/, '')}`.replace(/\/+$/, '') || '/'
    return p || '/'
  }

  const withBase = (path) => {
    const p = String(path || '/')
    if (base === '/') return p
    const normalized = p.startsWith('/') ? p.slice(1) : p
    return `${base}${normalized}`.replace(/\/+$/, '') || base
  }

  const resolve = (pathname) => ROUTES[stripBase(pathname)] || null
  const isPublic = (pathname) => PUBLIC_PATHS.includes(stripBase(pathname))
  const currentPath = () => stripBase(window.location.pathname)
  const currentPage = () => resolve(window.location.pathname)

  const pathForPage = (page) => {
    const entry = Object.entries(ROUTES).find(([path, value]) => value === page && path !== '/')
    return entry ? entry[0] : null
  }

  const push = (page) => {
    const path = pathForPage(page)
    if (path && path !== currentPath()) {
      history.pushState(null, '', withBase(path))
    }
  }

  const replace = (page) => {
    const path = pathForPage(page)
    if (path) {
      history.replaceState(null, '', withBase(path))
    }
  }

  const listen = (callback) => {
    onChange = callback
    window.addEventListener('popstate', () => {
      const page = currentPage()
      if (page && onChange) onChange(page)
    })
  }

  return { resolve, isPublic, currentPath, currentPage, pathForPage, push, replace, listen }
}
