/**
 * Shared Vite helpers for brand-aware monorepo apps.
 *
 *  - resolveBrand(env): pick the active tenant brand (BRAND env > default slug `feelvonroll`).
 *  - loadBrandConfig(brandName): import the brand config module.
 *  - brandPaths(brandName, app, repoRoot): resolve {brandDir, publicDir} for a given app.
 *  - brandHtmlPlugin(brandConfig): Vite plugin that substitutes %BRAND_*%
 *    placeholders in index.html using flat keys from the brand config.
 *
 * The plugin recognizes any %BRAND_<UPPER_SNAKE>% placeholder and looks up the
 * corresponding camelCased property on the brand config (or on
 * brand.analytics for analytics_*). Missing keys leave the placeholder empty.
 */
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export function resolveBrand(env = process.env) {
  return env.BRAND || 'feelvonroll'
}

export async function loadBrandConfig(brandName, repoRoot) {
  const configUrl = pathToFileURL(resolve(repoRoot, 'brands', brandName, 'config.js')).href
  const mod = await import(configUrl)
  if (!mod.brand) {
    throw new Error(`brands/${brandName}/config.js must export a "brand" object`)
  }
  return mod.brand
}

export function brandPaths(brandName, app, repoRoot) {
  const brandDir = resolve(repoRoot, 'brands', brandName)
  const publicDir = resolve(brandDir, app, 'public')
  return { brandDir, publicDir }
}

const camelize = (key) =>
  key.toLowerCase().replace(/_([a-z])/g, (_, c) => c.toUpperCase())

const lookup = (brand, key) => {
  const camel = camelize(key)
  if (camel.startsWith('analytics') && brand.analytics) {
    const sub = camel.slice('analytics'.length)
    const subCamel = sub.charAt(0).toLowerCase() + sub.slice(1)
    return brand.analytics[subCamel]
  }
  return brand[camel]
}

export function brandHtmlPlugin(brand) {
  return {
    name: 'brand-html',
    transformIndexHtml(html) {
      return html.replace(/%BRAND_([A-Z0-9_]+)%/g, (match, key) => {
        const value = lookup(brand, key)
        return value === undefined || value === null ? '' : String(value)
      })
    },
  }
}
