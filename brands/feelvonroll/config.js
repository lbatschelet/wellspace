/**
 * Brand configuration for feelvonroll.
 *
 * Loaded by both apps (viewer, admin) at build time via the `@brand` Vite alias
 * (`brands/<BRAND>/config.js`) and at runtime as `import { brand } from '@brand/config.js'`.
 */
export const brand = {
  name: 'feelvonroll',
  displayName: 'feelvonRoll',
  wordmarkHtml: '<em>feel</em><strong>vonRoll</strong>',

  // For this monorepo deploy we serve viewer+admin+api from one origin:
  //   /        viewer
  //   /admin/  admin panel
  //   /api/    php api
  routing: 'single-origin',

  /** Canonical public origin (viewer + links in admin for QR / open site). Baked in at build time. */
  domains: {
    primary: 'feelvonroll.ch',
  },
  siteUrl: 'https://feelvonroll.ch',

  apiBase: '/api',
  adminBase: '/admin/',

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
