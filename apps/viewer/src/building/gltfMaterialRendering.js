/** Set on materials baked with glTF alphaMode BLEND (MTL `d`). */
export const GLTF_BLEND_PRESERVE = 'gltfBlendPreserve'

function isGltfBlendMaterial(material) {
  if (!material) return false
  const opacity = material.opacity ?? 1
  return material.transparent === true || opacity < 0.999
}

/**
 * GLTF alpha (MTL `d` / alphaMode BLEND) needs explicit depthWrite + renderOrder
 * so semi-transparent geometry sorts correctly over opaque campus meshes.
 */
export function applyGltfMaterialRendering(root) {
  if (!root) return
  root.traverse((obj) => {
    if (!obj?.isMesh || !obj.material) return
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
    materials.forEach((material) => {
      if (!material) return
      const opacity = material.opacity ?? 1
      const isCutout = (material.alphaTest ?? 0) > 0
      const isBlend = isGltfBlendMaterial(material)
      if (isCutout) {
        material.transparent = false
        material.depthWrite = true
        obj.renderOrder = Math.max(obj.renderOrder ?? 0, 2)
        return
      }
      if (isBlend) {
        material.userData[GLTF_BLEND_PRESERVE] = true
        material.userData.gltfOpacity = opacity
        material.transparent = true
        material.depthWrite = false
        if ('premultipliedAlpha' in material) material.premultipliedAlpha = false
        obj.renderOrder = Math.max(obj.renderOrder ?? 0, 2)
      }
    })
  })
}

/**
 * Re-apply GLTF blend after floor visibility toggles (setGroupOpacity forces opaque).
 * @returns {boolean} true if material was restored
 */
export function preserveGltfBlendMaterial(material, { ghostFactor = 1 } = {}) {
  if (!material?.userData?.[GLTF_BLEND_PRESERVE]) return false
  const base = material.userData.gltfOpacity ?? material.opacity ?? 1
  material.transparent = true
  material.opacity = base * ghostFactor
  material.depthWrite = false
  if ('depthTest' in material) material.depthTest = true
  return true
}
