/**
 * Brand configuration for feelvonroll.
 *
 * Loaded by both apps (viewer, admin) at build time via the `@brand` Vite alias
 * (`brands/<BRAND>/config.js`) and at runtime as `import { brand } from '@brand/config.js'`.
 */
export const brand = {
  name: 'feelvonroll',
  displayName: 'feelvonRoll',

  routing: 'subdomains',

  domains: {
    viewer: 'app.feelvonroll.ch',
    admin: 'admin.feelvonroll.ch',
    api: 'api.feelvonroll.ch',
  },

  apiBase: 'https://api.feelvonroll.ch',
  adminBase: '/',

  modelDir: '/models',

  viewerTitle: 'feelvonRoll',
  adminTitle: 'feelvonRoll Admin',

  themeColor: '#f3f4f6',
  backgroundColor: '#f3f4f6',

  manifest: {
    name: 'feelvonRoll',
    short_name: 'feelvonRoll',
    start_url: '/',
    display: 'standalone',
  },

  analytics: {
    plausibleDomain: 'feelvonroll.ch',
  },
}
