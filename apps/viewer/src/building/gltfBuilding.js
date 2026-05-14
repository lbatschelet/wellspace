/**
 * glTF building provider.
 *
 * Loads a glTF/GLB model and exposes it through the same interface the
 * procedural building uses:
 *   - floorGroups: THREE.Object3D[] (each with userData.floorIndex)
 *   - maxBasements / maxAboveGroundFloors
 *   - setFloorWallMode(group, useLow)
 *   - getFloorSlabTopY(floorIndex)
 *   - getTargetYForFloor(floorIndex)
 *
 * Naming conventions (first iteration):
 * - If the glTF contains objects named `floor_<index>` they are treated as
 *   separate floor groups.
 * - Otherwise the whole model becomes `floor_0`.
 *
 * Slab Y placement:
 * - First iteration returns slab top at Y=0 unless a marker node named
 *   `slabTop` (or `floor_slabTop`) is present inside the floor group.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
import { FLOOR } from '../config'

/** Nur bei sichtbaren Ausblendern: ?noFrustumCull=1 (Standard: Culling an = weniger Draw) */
function disableFrustumCullForDebug(root) {
  if (typeof window === 'undefined') return
  if (new URLSearchParams(window.location.search).get('noFrustumCull') !== '1') return
  root.traverse((obj) => {
    if (obj && obj.isMesh) obj.frustumCulled = false
  })
}

function getFloorIndexFromName(name) {
  const match = /^floor_(-?\d+)$/.exec(name)
  if (!match) return null
  return Number(match[1])
}

function findSlabTopWorldY(floorGroup, { unitScale = 1 } = {}) {
  const slabMarker =
    floorGroup.getObjectByName?.('slabTop') ||
    floorGroup.getObjectByName?.('floor_slabTop') ||
    floorGroup.getObjectByName?.('floor_slab_top')

  if (slabMarker) {
    const v = new THREE.Vector3()
    slabMarker.getWorldPosition(v)
    return v.y
  }

  // Fallback: use the group's world-space bounding box.
  // This is more robust than returning 0, especially for debug multi-floor simulation.
  const box = new THREE.Box3().setFromObject(floorGroup)
  // Sweet Home exports often include a thin baseplate (e.g. 12cm). If we
  // don't have an explicit marker, treat slab top as "base + slabThickness".
  const slabThickness = (FLOOR.slabThickness || 0) * (Number.isFinite(unitScale) ? unitScale : 1)
  return box.min.y + slabThickness
}

function hideBasePlanesForFloorGroups({ floorGroups }) {
  // Heuristic: base planes are usually very thin but cover a large area.
  // Important: keep thresholds narrow so we don't hide walls/markings.
  const minThicknessY = 0.35 // allow thicker exported base plates as well
  const epsilonMinY = 0.08 // hide only meshes that sit at/near the base level (local to each floor)

  floorGroups.forEach((floorGroup) => {
    const groupBox = new THREE.Box3().setFromObject(floorGroup)
    const groupSize = groupBox.getSize(new THREE.Vector3())
    const groupArea = groupSize.x * groupSize.z
    if (!groupArea || !Number.isFinite(groupArea) || groupArea <= 0) return

    const minFootprint = groupArea * 0.75 // only floor-covering footprints
    const baseY = groupBox.min.y

    floorGroup.traverse((obj) => {
      if (!obj || !obj.isMesh) return
      const name = (obj.name || '').toLowerCase()
      if (name.includes('slabtop') || name.includes('slab_top') || name.includes('slab')) return

      const box = new THREE.Box3().setFromObject(obj)
      const size = box.getSize(new THREE.Vector3())
      const thicknessY = size.y
      const footprint = size.x * size.z
      const meshBottomFromBase = box.min.y - baseY

      if (thicknessY < minThicknessY && footprint > minFootprint && meshBottomFromBase <= epsilonMinY) {
        obj.visible = false
        obj.castShadow = false
        obj.receiveShadow = false
      }
    })
  })
}

function hideLargestBottomPlate(root) {
  const rootBox = new THREE.Box3().setFromObject(root)
  if (rootBox.isEmpty()) return
  const size = rootBox.getSize(new THREE.Vector3())
  const minY = rootBox.min.y
  const sceneFootprint = Math.max(size.x * size.z, 1e-6)
  const thicknessLimit = Math.max(0.35, size.y * 0.03)
  const minFootprint = sceneFootprint * 0.8
  const baseTolerance = Math.max(0.08, size.y * 0.01)

  let best = null
  root.traverse((obj) => {
    if (!obj?.isMesh) return
    const box = new THREE.Box3().setFromObject(obj)
    if (box.isEmpty()) return
    const s = box.getSize(new THREE.Vector3())
    const footprint = s.x * s.z
    const thicknessY = s.y
    const bottomOffset = box.min.y - minY
    if (bottomOffset > baseTolerance) return
    if (thicknessY > thicknessLimit) return
    if (footprint < minFootprint) return
    if (!best || footprint > best.footprint) {
      best = { obj, footprint }
    }
  })

  if (best?.obj) {
    best.obj.visible = false
    best.obj.castShadow = false
    best.obj.receiveShadow = false
  }
}

function hideLargestFlatMesh(root) {
  const rootBox = new THREE.Box3().setFromObject(root)
  if (rootBox.isEmpty()) return
  const size = rootBox.getSize(new THREE.Vector3())
  const sceneFootprint = Math.max(size.x * size.z, 1e-6)
  const maxHorizontal = Math.max(size.x, size.z, 1e-6)
  const minFootprint = sceneFootprint * 0.85
  // Explicitly allow paper-thin/flat plates.
  const flatnessThreshold = maxHorizontal * 0.0025

  let best = null
  root.traverse((obj) => {
    if (!obj?.isMesh) return
    const box = new THREE.Box3().setFromObject(obj)
    if (box.isEmpty()) return
    const s = box.getSize(new THREE.Vector3())
    const footprint = s.x * s.z
    if (footprint < minFootprint) return
    if (s.y > flatnessThreshold) return
    if (!best || footprint > best.footprint) {
      best = { obj, footprint }
    }
  })

  if (best?.obj) {
    best.obj.visible = false
    best.obj.castShadow = false
    best.obj.receiveShadow = false
  }
}

function findLargestFlatMesh(root) {
  const rootBox = new THREE.Box3().setFromObject(root)
  if (rootBox.isEmpty()) return null
  const size = rootBox.getSize(new THREE.Vector3())
  const sceneFootprint = Math.max(size.x * size.z, 1e-6)
  const maxHorizontal = Math.max(size.x, size.z, 1e-6)
  const minFootprint = sceneFootprint * 0.85
  // Explicitly allow paper-thin/flat plates.
  const flatnessThreshold = maxHorizontal * 0.0025

  let best = null
  root.traverse((obj) => {
    if (!obj?.isMesh) return
    const box = new THREE.Box3().setFromObject(obj)
    if (box.isEmpty()) return
    const s = box.getSize(new THREE.Vector3())
    const footprint = s.x * s.z
    if (footprint < minFootprint) return
    if (s.y > flatnessThreshold) return
    if (!best || footprint > best.footprint) {
      best = { obj, footprint }
    }
  })

  return best?.obj || null
}

function tintLargestFlatMesh(root, color) {
  if (typeof color !== 'string' || !color) return
  const target = findLargestFlatMesh(root)
  if (!target?.material) return
  const materials = Array.isArray(target.material) ? target.material : [target.material]
  materials.forEach((material) => {
    if (!material) return
    if ('map' in material) material.map = null
    if ('color' in material && material.color) material.color = new THREE.Color(color)
    material.needsUpdate = true
  })
}

function applyMaterialSide(root, materialSide = 'front') {
  const sideByName = {
    front: THREE.FrontSide,
    back: THREE.BackSide,
    double: THREE.DoubleSide,
  }
  const resolved = sideByName[materialSide] ?? THREE.FrontSide
  root.traverse((obj) => {
    if (!obj?.isMesh || !obj.material) return
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
    mats.forEach((mat) => {
      if (!mat || !('side' in mat)) return
      mat.side = resolved
      mat.needsUpdate = true
    })
  })
}

export async function createGltfBuilding(
  scene,
  {
    modelUrl,
    debugSimulateFloors,
    hideBasePlanes = true,
    materialSide = 'front',
    groundPlateColor = null,
  } = {}
) {
  const loader = new GLTFLoader()
  loader.setMeshoptDecoder(MeshoptDecoder)
  const gltf = await loader.loadAsync(modelUrl)

  const root = gltf.scene || gltf.scenes?.[0]
  if (!root) throw new Error(`No scene found in model: ${modelUrl}`)

  // Prototype quality-of-life:
  // Keep meter-scale (no arbitrary scaling). Sweet Home can be calibrated
  // in meters already.
  // Instead:
  // - center in X/Z
  // - move lowest point to Y=0
  // - disable frustum culling for meshes
  // Additionally, we return camera-range hints so huge models are not
  // clipped by the camera far plane.
  const box = new THREE.Box3().setFromObject(root)
  const center = box.getCenter(new THREE.Vector3())
  const minY = box.min.y

  root.position.x -= center.x
  root.position.z -= center.z
  root.position.y -= minY

  const boundsAfter = new THREE.Box3().setFromObject(root)
  const sizeAfterBounds = boundsAfter.getSize(new THREE.Vector3())
  const groundPad = 1.4
  const suggestedGroundSize = Math.max(sizeAfterBounds.x, sizeAfterBounds.z) * groundPad

  const centeredBox = new THREE.Box3().setFromObject(root)
  const sizeAfterCentered = centeredBox.getSize(new THREE.Vector3())
  const radius = sizeAfterCentered.length() / 2
  const suggestedCameraDistance = Math.max(radius * 2.5, 40)
  const suggestedCameraFar = suggestedCameraDistance * 6

  scene.add(root)
  disableFrustumCullForDebug(root)
  applyMaterialSide(root, materialSide)
  tintLargestFlatMesh(root, groundPlateColor)

  // Collect floor groups by name.
  const floorEntries = []
  root.traverse((obj) => {
    if (!obj?.name) return
    const floorIndex = getFloorIndexFromName(obj.name)
    if (floorIndex === null) return
    floorEntries.push({ floorIndex, obj })
  })

  const floorGroups = floorEntries.length
    ? floorEntries.sort((a, b) => a.floorIndex - b.floorIndex).map((e) => {
        e.obj.userData.floorIndex = e.floorIndex
        return e.obj
      })
    : (() => {
        root.userData.floorIndex = 0
        return [root]
      })()

  if (hideBasePlanes) {
    hideBasePlanesForFloorGroups({ floorGroups })
    hideLargestBottomPlate(root)
    hideLargestFlatMesh(root)
  }

  // Debug / prototype helper:
  // If the model only contains `floor_0` (typical for per-floor exports),
  // optionally simulate floors by cloning the detected floor group and
  // offsetting it vertically so the floor selector shows -1 / 1 as well.
  if (Array.isArray(debugSimulateFloors) && floorGroups.length === 1) {
    const baseGroup = floorGroups[0]
    const baseIndex = Number(baseGroup.userData.floorIndex) || 0
    // Derive vertical floor step from the imported geometry itself.
    // This avoids overlaps for models not using procedural scale.
    const baseBox = new THREE.Box3().setFromObject(baseGroup)
    const baseSize = baseBox.getSize(new THREE.Vector3())
    const floorStepY = Math.max(baseSize.y, FLOOR.height + FLOOR.slabThickness)

    const already = new Set(debugSimulateFloors.map((i) => Number(i)))
    // Ensure baseIndex is included.
    already.add(baseIndex)

    // Clone and add additional floor groups.
    const newGroups = []
    Array.from(already)
      .sort((a, b) => a - b)
      .forEach((idx) => {
        if (idx === baseIndex) return
        const clone = baseGroup.clone(true)
        clone.userData.floorIndex = idx
        // Important:
        // clones are always attached to `root`, not to the original parent of
        // baseGroup. Therefore we must reset X/Z to avoid double-applying the
        // centered root transform (which causes the horizontal shift you saw).
        clone.position.set(0, 0, 0)
        clone.position.y = (idx - baseIndex) * floorStepY
        root.add(clone)
        newGroups.push(clone)
      })

    if (newGroups.length) {
      floorGroups.push(...newGroups)
    }
  }

  const floorIndices = floorGroups.map((g) => Number(g.userData.floorIndex))
  const minFloor = Math.min(...floorIndices)
  const maxFloor = Math.max(...floorIndices)

  const maxBasements = minFloor < 0 ? Math.abs(minFloor) : 0
  // Note: floorSelector uses an exclusive upper bound.
  const maxAboveGroundFloors = maxFloor + 1

  const slabTopByFloorIndex = new Map()
  floorGroups.forEach((group) => {
    const idx = Number(group.userData.floorIndex)
    const groupBox = new THREE.Box3().setFromObject(group)
    const groupSize = groupBox.getSize(new THREE.Vector3())
    const footprint = Math.max(groupSize.x, groupSize.z)
    const unitScale = footprint > 2000 ? 100 : 1
    slabTopByFloorIndex.set(idx, findSlabTopWorldY(group, { unitScale }))
  })

  // Baseplane removal is handled in the model pipeline (offline).

  const navigationBounds = new THREE.Box3().setFromObject(root)

  return {
    source: 'gltf',
    floorGroups,
    maxBasements,
    maxAboveGroundFloors,
    setFloorWallMode: () => {
      // Prototype: leave walls as-is.
      // Later we can toggle `walls_low` vs `walls_full` layers using naming conventions.
    },
    getFloorSlabTopY: (floorIndex) => slabTopByFloorIndex.get(Number(floorIndex)) ?? 0,
    getTargetYForFloor: (floorIndex) => {
      const slabTopY = slabTopByFloorIndex.get(Number(floorIndex)) ?? 0
      return slabTopY + FLOOR.wallHeight * 0.55
    },
    suggestedCameraDistance,
    suggestedCameraFar,
    suggestedGroundSize,
    navigationBounds,
  }
}

/**
 * Stacked multi-floor loader for per-floor glTF exports.
 *
 * Assumption for the prototype:
 * - Each floor glb is aligned so its local "min Y" is near the slab/base level.
 * - We then stack floors vertically based on procedural floor step.
 */
export async function createStackedGltfBuilding(
  scene,
  {
    modelUrlsByFloorIndex,
    hideBasePlanes = true,
    materialSide = 'front',
    groundPlateColor = null,
  } = {}
) {
  const debugStack = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('debugStack') === '1'
  const debugFloorMarkers = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('debugFloorMarkers') === '1'

  const entries = Object.entries(modelUrlsByFloorIndex || {})
    .map(([k, v]) => ({ floorIndex: Number(k), modelUrl: v }))
    .filter((e) => Number.isFinite(e.floorIndex) && typeof e.modelUrl === 'string')

  if (!entries.length) {
    throw new Error('Missing modelUrlsByFloorIndex')
  }

  const loader = new GLTFLoader()
  loader.setMeshoptDecoder(MeshoptDecoder)
  // Load the reference floor first so the initial view appears quickly.
  // Other floors are loaded in the background and attached as they arrive.
  const floorIndices = entries.map((e) => e.floorIndex)
  const refIndex = floorIndices.includes(0) ? 0 : Math.min(...floorIndices)
  const refEntry = entries.find((e) => e.floorIndex === refIndex) || entries[0]

  const floorGroups = []
  const slabTopByFloorIndex = new Map()
  const loadPromisesByFloorIndex = new Map()

  const proceduralFloorStepY = FLOOR.height + FLOOR.slabThickness
  let unitScale = 1
  let floorStepY = proceduralFloorStepY
  let refCenter = new THREE.Vector3()

  // Create placeholder groups immediately so UI (floor selector) can render.
  const groupByFloorIndex = new Map()
  entries.forEach(({ floorIndex }) => {
    const g = new THREE.Group()
    g.userData.floorIndex = floorIndex
    groupByFloorIndex.set(floorIndex, g)
    floorGroups.push(g)
    scene.add(g)
  })
  floorGroups.sort((a, b) => Number(a.userData.floorIndex) - Number(b.userData.floorIndex))

  const attachFloorRoot = ({ floorIndex, root, minY }) => {
    // Shared center in X/Z so mixed versions don't shift relative to each other.
    root.position.x -= refCenter.x
    root.position.z -= refCenter.z

    // Normalize base: lowest point to Y=0.
    root.position.y -= minY

    // Stack by floor index relative to the chosen reference floor.
    root.position.y += (floorIndex - refIndex) * floorStepY

    disableFrustumCullForDebug(root)
    applyMaterialSide(root, materialSide)
    tintLargestFlatMesh(root, groundPlateColor)

    const group = groupByFloorIndex.get(floorIndex)
    if (!group) return
    group.clear()
    group.add(root)
    if (hideBasePlanes) {
      hideBasePlanesForFloorGroups({ floorGroups: [group] })
      hideLargestBottomPlate(root)
      hideLargestFlatMesh(root)
    }

    slabTopByFloorIndex.set(floorIndex, findSlabTopWorldY(root, { unitScale }))

    if (debugFloorMarkers) {
      const markerColor =
        floorIndex === 0 ? 0x2b6cff
        : floorIndex === 1 ? 0x22c55e
        : floorIndex === -1 ? 0xef4444
        : 0xf59e0b
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 12, 12),
        new THREE.MeshBasicMaterial({ color: markerColor })
      )
      marker.name = `floorMarker_${floorIndex}`
      marker.position.set(0, 0, 0)
      if ('depthTest' in marker.material) marker.material.depthTest = false
      root.add(marker)
    }
  }

  async function ensureFloorLoaded(floorIndex) {
    const idx = Number(floorIndex)
    if (slabTopByFloorIndex.has(idx)) return
    if (loadPromisesByFloorIndex.has(idx)) return loadPromisesByFloorIndex.get(idx)
    const entry = entries.find((e) => e.floorIndex === idx)
    if (!entry) return
    const p = loader.loadAsync(entry.modelUrl)
      .then((gltf) => {
        const root = gltf.scene || gltf.scenes?.[0]
        if (!root) return
        const box = new THREE.Box3().setFromObject(root)
        const minY = box.min.y
        attachFloorRoot({ floorIndex: idx, root, minY })
        if (debugStack) {
          const slabTopY = slabTopByFloorIndex.get(idx)
          const afterBox = new THREE.Box3().setFromObject(root)
          const afterSize = afterBox.getSize(new THREE.Vector3())
          console.debug('[gltfStack]', {
            floorIndex: idx,
            floorStepY,
            rootY: root.position.y,
            slabTopY,
            afterMinY: afterBox.min.y,
            afterMaxY: afterBox.max.y,
            afterSizeY: afterSize.y,
          })
        }
      })
      .catch(() => {})
    loadPromisesByFloorIndex.set(idx, p)
    return p
  }

  // Load reference floor first (blocking).
  {
    const gltf = await loader.loadAsync(refEntry.modelUrl)
    const root = gltf.scene || gltf.scenes?.[0]
    if (!root) throw new Error('No glTF floors could be loaded')

    const box = new THREE.Box3().setFromObject(root)
    refCenter = box.getCenter(new THREE.Vector3())
    const minY = box.min.y
    const size = box.getSize(new THREE.Vector3())

    const footprint = Math.max(size.x, size.z)
    unitScale = footprint > 2000 ? 100 : 1
    floorStepY = proceduralFloorStepY * unitScale

    attachFloorRoot({ floorIndex: refIndex, root, minY })
  }

  // Background-load remaining floors (non-blocking).
  const preloadOrder = entries
    .map((e) => e.floorIndex)
    .filter((i) => i !== refIndex)
    .sort((a, b) => Math.abs(a - refIndex) - Math.abs(b - refIndex))
  preloadOrder.forEach((i) => {
    void ensureFloorLoaded(i)
  })

  // Baseplane removal is handled in the model pipeline (offline).

  const minFloor = Math.min(...floorIndices)
  const maxFloor = Math.max(...floorIndices)
  const maxBasements = minFloor < 0 ? Math.abs(minFloor) : 0
  const maxAboveGroundFloors = maxFloor + 1

  // Suggested camera bounds based on combined model size.
  const globalBox = new THREE.Box3()
  // Only guaranteed to include the reference floor at init; expands as floors load.
  floorGroups.forEach((g) => globalBox.union(new THREE.Box3().setFromObject(g)))
  const size = globalBox.getSize(new THREE.Vector3())
  const radius = size.length() / 2
  const suggestedCameraDistance = Math.max(radius * 2.5, 40)
  const suggestedCameraFar = suggestedCameraDistance * 6

  const suggestedGroundSize = Math.max(size.x, size.z) * 1.4

  return {
    source: 'gltf',
    floorGroups,
    maxBasements,
    maxAboveGroundFloors,
    setFloorWallMode: () => {},
    getFloorSlabTopY: (floorIndex) => {
      const idx = Number(floorIndex)
      if (slabTopByFloorIndex.has(idx)) return slabTopByFloorIndex.get(idx)
      // Fallback estimate until the floor is loaded.
      return (idx - refIndex) * floorStepY
    },
    getTargetYForFloor: (floorIndex) => {
      const slabTopY = slabTopByFloorIndex.get(Number(floorIndex)) ?? 0
      return slabTopY + FLOOR.wallHeight * 0.55
    },
    suggestedCameraDistance,
    suggestedCameraFar,
    suggestedGroundSize,
    navigationBounds: globalBox.clone(),
    ensureFloorLoaded,
  }
}

