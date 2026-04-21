/**
 * Shared color palette definitions for admin global picker.
 */
export const GLOBAL_COLOR_PALETTES = [
  {
    key: 'default',
    label: 'Red ↔ Blue',
    colors: ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#d1e5f0', '#92c5de', '#4393c3', '#2166ac', '#053061'],
  },
  {
    key: 'brownTeal',
    label: 'Brown ↔ Teal',
    colors: ['#543005', '#8c510a', '#bf812d', '#dfc27d', '#f6e8c3', '#c7eae5', '#80cdc1', '#35978f', '#01665e', '#003c30'],
  },
  {
    key: 'purpleGreen',
    label: 'Purple ↔ Green',
    colors: ['#40004b', '#762a83', '#9970ab', '#c2a5cf', '#e7d4e8', '#d9f0d3', '#a6dba0', '#5aae61', '#1b7837', '#00441b'],
  },
  {
    key: 'orangePurple',
    label: 'Orange ↔ Purple',
    colors: ['#7f3b08', '#b35806', '#e08214', '#fdb863', '#fee0b6', '#d8daeb', '#b2abd2', '#8073ac', '#542788', '#2d004b'],
  },
  {
    key: 'pinkGreen',
    label: 'Pink ↔ Green',
    colors: ['#8e0152', '#c51b7d', '#de77ae', '#f1b6da', '#fde0ef', '#e6f5d0', '#b8e186', '#7fbc41', '#4d9221', '#276419'],
  },
  {
    key: 'warmCool',
    label: 'Warm ↔ Cool',
    colors: ['#b40426', '#d95847', '#f18d6f', '#f7b89c', '#edd1c2', '#c9d7f0', '#a4c2fe', '#7da0f9', '#5977e3', '#3b4cc0'],
  },
  {
    key: 'redYellowBlue',
    label: 'Red ↔ Yellow ↔ Blue',
    colors: ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee090', '#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'],
  },
]

export function getGlobalPaletteByKey(key) {
  return GLOBAL_COLOR_PALETTES.find((palette) => palette.key === key) || GLOBAL_COLOR_PALETTES[0]
}
