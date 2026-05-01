/**
 * Brand configuration for wohlOpti (slug: wohlopti).
 *
 * Pre-launch: still uses the feelvonroll 3D model and a placeholder theme.
 * Replace assets under brands/wohlopti/{viewer,admin}/public/ when the real
 * branding and the dedicated 3D model are available.
 */
export const brand = {
  name: 'wohlopti',
  displayName: 'wohlOpti',

  routing: 'single-origin',

  domains: {
    primary: 'wohlopti.ch',
  },

  apiBase: '/api',
  adminBase: '/admin/',

  modelDir: '/models',

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
