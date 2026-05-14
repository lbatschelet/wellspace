/**
 * Brand configuration for wohlOpti (slug: wohlopti).
 *
 * Current setup uses brand-local viewer assets and a single-floor 3D model.
 */
export const brand = {
  name: 'wohlopti',
  displayName: 'wohlOpti',
  wordmarkHtml: '<em>wohl</em><strong>Opti</strong>',

  routing: 'single-origin',

  domains: {
    primary: 'wohlopti.ch',
  },
  siteUrl: 'https://wohlopti.ch',

  apiBase: '/api',
  adminBase: '/admin/',

  modelDir: '/models',
  viewer: {
    // WohlOpti currently ships as a single-floor model.
    modelFloorIndices: [0],
    floorSelectorEnabled: false,
  },

  viewerTitle: 'wohlOpti',
  adminTitle: 'wohlOpti Admin',

  themeColor: '#f3f4f6',
  backgroundColor: '#f3f4f6',

  manifest: {
    name: 'wohlOpti',
    short_name: 'wohlOpti',
    start_url: '/',
    display: 'standalone',
  },

  analytics: {
    plausibleDomain: 'wohlopti.ch',
  },
}
