/**
 * @vitest-environment jsdom
 *
 * Tests for the client-side router module.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createRouter } from '../../src/app/router'

/** Matches router withBase: full browser path for a route path like /users */
function withBase(path) {
  const baseUrl = String(import.meta.env.BASE_URL || '/')
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  const p = String(path || '/')
  if (base === '/') return p
  const normalized = p.startsWith('/') ? p.slice(1) : p
  return `${base}${normalized}`.replace(/\/+$/, '') || base
}

describe('router', () => {
  beforeEach(() => {
    // Reset URL to app root (respects Vite base, e.g. /admin/)
    window.history.replaceState(null, '', withBase('/'))
  })

  it('resolves known paths to page keys', () => {
    const router = createRouter()
    expect(router.resolve('/dashboard')).toBe('dashboard')
    expect(router.resolve('/pins')).toBe('pins')
    expect(router.resolve('/users')).toBe('users')
    expect(router.resolve('/audit')).toBe('audit')
    expect(router.resolve('/content')).toBe('content')
    expect(router.resolve('/questionnaire')).toBe('questionnaire')
    expect(router.resolve('/languages')).toBe('languages')
    expect(router.resolve('/')).toBe('dashboard')
  })

  it('returns null for unknown paths', () => {
    const router = createRouter()
    expect(router.resolve('/unknown')).toBeNull()
    expect(router.resolve('/reset')).toBeNull()
  })

  it('identifies public paths', () => {
    const router = createRouter()
    expect(router.isPublic('/reset')).toBe(true)
    expect(router.isPublic('/login')).toBe(true)
    expect(router.isPublic('/dashboard')).toBe(false)
    expect(router.isPublic('/users')).toBe(false)
  })

  it('push updates browser URL', () => {
    const router = createRouter()
    router.push('users')
    expect(window.location.pathname).toBe(withBase('/users'))
  })

  it('push does not pushState if already on that path', () => {
    window.history.replaceState(null, '', withBase('/users'))
    const spy = vi.spyOn(window.history, 'pushState')
    const router = createRouter()
    router.push('users')
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('replace updates URL without creating history entry', () => {
    const spy = vi.spyOn(window.history, 'replaceState')
    const router = createRouter()
    router.replace('pins')
    expect(spy).toHaveBeenCalledWith(null, '', withBase('/pins'))
    spy.mockRestore()
  })

  it('currentPage returns page key for current path', () => {
    window.history.replaceState(null, '', withBase('/audit'))
    const router = createRouter()
    expect(router.currentPage()).toBe('audit')
  })

  it('listen registers popstate callback', () => {
    const router = createRouter()
    const callback = vi.fn()
    const addSpy = vi.spyOn(window, 'addEventListener')
    router.listen(callback)
    expect(addSpy).toHaveBeenCalledWith('popstate', expect.any(Function))
    addSpy.mockRestore()
  })

  it('pathForPage returns the non-root path for a page', () => {
    const router = createRouter()
    expect(router.pathForPage('dashboard')).toBe('/dashboard')
    expect(router.pathForPage('users')).toBe('/users')
    expect(router.pathForPage('unknown')).toBeNull()
  })
})
