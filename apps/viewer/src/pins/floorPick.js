import * as THREE from 'three'

/**
 * Pick a floor placement point: prefer ray hits on building meshes (e.g. ground plate),
 * fall back to an infinite horizontal plane at getFloorSlabTopY(floor).
 *
 * @param {THREE.Raycaster} raycaster — already configured (setFromCamera).
 * @param {object} opts
 * @param {() => number} opts.getSelectedFloor
 * @param {(floor: number) => number} opts.getFloorSlabTopY
 * @param {(floor: number) => THREE.Object3D[]} [opts.getFloorIntersectTargets]
 * @returns {{ floorIndex: number, position: THREE.Vector3 } | null}
 */
export function intersectFloorFromRay(raycaster, {
  getSelectedFloor,
  getFloorSlabTopY,
  getFloorIntersectTargets,
}) {
  const floorIndex = getSelectedFloor()
  const targets = typeof getFloorIntersectTargets === 'function'
    ? getFloorIntersectTargets(floorIndex)
    : []
  const list = Array.isArray(targets) ? targets.filter(Boolean) : []

  if (list.length) {
    const hits = raycaster.intersectObjects(list, true)
    const candidates = hits.filter(
      (h) => h.object?.isMesh
        && h.object.visible !== false
        && !h.object.userData?.isHitSphere
    )
    for (const h of candidates) {
      if (!h.face) continue
      const nWorld = h.face.normal.clone().transformDirection(h.object.matrixWorld)
      if (nWorld.y > 0.18) {
        return { floorIndex, position: h.point.clone() }
      }
    }
    if (candidates.length) {
      return { floorIndex, position: candidates[0].point.clone() }
    }
  }

  const planeY = typeof getFloorSlabTopY === 'function' ? getFloorSlabTopY(floorIndex) : 0
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeY)
  const point = new THREE.Vector3()
  if (!raycaster.ray.intersectPlane(plane, point)) return null
  return { floorIndex, position: point.clone() }
}
