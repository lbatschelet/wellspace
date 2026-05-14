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
    // Orbit: Maus / Touch reichen; keine extra ↺/↻-Buttons.
    rotateButtonsEnabled: false,
    // Base plate is removed offline in the OBJ->GLB step.
    // Keep runtime base-plane heuristics disabled to avoid hiding valid geometry.
    hideBasePlanes: false,
    // Closed volumes in this export can have inconsistent face winding.
    // Render both sides so walls remain visible from all views.
    materialSide: 'double',
    // Do not recolor the bottom plate at runtime.
    tintGroundPlate: false,
    // Pin placement reference: top side of the bottom plate.
    pinReferenceSurface: 'bottomPlate',
    // Keep close zoom usable even with the large bottom plate in bounds.
    closestZoom: 0.02,
    closestRelativeMin: 0.005,
    defaultViewMult: 0.12,
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
