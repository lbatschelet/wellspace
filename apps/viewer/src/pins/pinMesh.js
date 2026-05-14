/**
 * Pin and cluster mesh creation.
 * Pure factory functions that return THREE.js objects.
 */
import * as THREE from 'three'

/* ── Shared geometry (created once, reused by all pins) ─────────── */

// Slightly larger pins for better legibility.
export const PIN_VISUAL_ORB_RADIUS = 0.24
const SPHERE_RADIUS = PIN_VISUAL_ORB_RADIUS
let _sharedGeo = null

function getSharedSphereGeometry() {
  if (!_sharedGeo) _sharedGeo = new THREE.SphereGeometry(SPHERE_RADIUS, 32, 24)
  return _sharedGeo
}

/* ── Pin mesh (glass orb + hit sphere) ──────────────────────────── */

/**
 * Creates a single pin as a translucent glass orb + invisible hit sphere.
 * Uses MeshPhysicalMaterial with transmission for realistic glass look.
 * @param {object} pin - Pin data.
 * @param {THREE.Color} headColor - Tint color for the glass.
 * @returns {THREE.Group}
 */
export function createPinMesh(pin, headColor) {
  const group = new THREE.Group()
  const halo = new THREE.Mesh(
    getSharedSphereGeometry(),
    new THREE.MeshBasicMaterial({
      color: '#111827',
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  )
  halo.scale.setScalar(1.14)

  const orb = new THREE.Mesh(
    getSharedSphereGeometry(),
    new THREE.MeshLambertMaterial({
      color: headColor,
      emissive: headColor,
      emissiveIntensity: 0.25,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  )
  orb.userData.pinData = pin

  // Slightly larger invisible sphere for easier click/hover targeting
  const hitSphere = new THREE.Mesh(
    new THREE.SphereGeometry(SPHERE_RADIUS * 1.25, 8, 6),
    new THREE.MeshBasicMaterial({ visible: false })
  )
  hitSphere.userData.pinData = pin
  hitSphere.userData.isHitSphere = true

  group.add(halo, orb, hitSphere)
  group.userData.pinData = pin
  group.userData.orb = orb
  return group
}

/**
 * Creates a cluster sprite showing the pin count.
 * @param {object} cluster - Cluster data with `pins` array.
 * @param {Map} textureCache - Cache for cluster textures.
 * @param {THREE.Color|string} [fillColor] - Optional fill color (e.g. averaged cluster color).
 * @returns {THREE.Sprite}
 */
export function createClusterMesh(cluster, textureCache, fillColor) {
  const texture = getClusterTexture(cluster.pins.length, textureCache, fillColor)
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(1, 1, 1)
  sprite.material.depthTest = false
  sprite.material.depthWrite = false
  sprite.renderOrder = 999
  return sprite
}

/**
 * Gets or creates a cluster count texture (cached).
 * @param {number} count - Number of pins in cluster.
 * @param {Map} textureCache - Cache for cluster textures.
 * @param {THREE.Color|string} [fillColor] - Optional fill color.
 * @returns {THREE.CanvasTexture}
 */
function getClusterTexture(count, textureCache, fillColor) {
  const colorValue = normalizeColor(fillColor)
  const cacheKey = `${count}|${colorValue}`
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)
  }
  const size = 192
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = colorValue
  ctx.shadowColor = 'rgba(17, 24, 39, 0.38)'
  ctx.shadowBlur = 14
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2 - 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.fillStyle = getReadableTextColor(colorValue)
  ctx.font = 'bold 72px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(count), size / 2, size / 2)
  const texture = new THREE.CanvasTexture(canvas)
  textureCache.set(cacheKey, texture)
  return texture
}

function normalizeColor(fillColor) {
  if (fillColor instanceof THREE.Color) return fillColor.getStyle()
  if (typeof fillColor === 'string' && fillColor.trim()) return fillColor
  return '#1f2937'
}

function getReadableTextColor(colorValue) {
  const parsed = new THREE.Color(colorValue)
  // Perceived luminance in linear RGB space.
  const luminance = parsed.r * 0.2126 + parsed.g * 0.7152 + parsed.b * 0.0722
  return luminance > 0.55 ? '#0f172a' : '#f9fafb'
}
