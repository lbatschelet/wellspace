/**
 * Pin raycasting — handles pointer interactions with the 3D scene.
 * Exports: setupPinRaycaster.
 */
import * as THREE from 'three'

/** Pin mode + touch: cancel tap if finger moved more than this (px). */
const PIN_FLOOR_TAP_MOVE_PX = 14

/**
 * Collect all hit-sphere meshes from a pin group (for hover raycasting).
 * @param {THREE.Group} pinGroup
 * @returns {THREE.Mesh[]}
 */
function getHitSpheres(pinGroup) {
  const spheres = []
  pinGroup.children.forEach((group) => {
    if (!group.children) return
    group.children.forEach((child) => {
      if (child.userData.isHitSphere) spheres.push(child)
    })
  })
  return spheres
}

/**
 * Sets up raycaster-based pointer interaction.
 * @param {object} deps - Dependencies.
 * @param {THREE.Camera} deps.camera
 * @param {HTMLElement} deps.domElement
 * @param {THREE.Group} deps.pinGroup
 * @param {Function} deps.getState - Returns current pin state.
 * @param {Function} deps.getSelectedFloor - Returns the current floor index.
 * @param {Function} deps.getFloorSlabTopY - Returns the slab top Y for a floor.
 * @param {Function} deps.onPinClick - Called when an existing pin is clicked.
 * @param {Function} deps.onFloorClick - Called when the floor is clicked in pin mode.
 */
export function setupPinRaycaster({
  camera,
  domElement,
  pinGroup,
  getState,
  getSelectedFloor,
  getFloorSlabTopY,
  onPinClick,
  onClusterClick,
  onEmptyClick,
  onFloorClick,
}) {
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()

  /**
   * Pin mode + touch pen: defer floor placement until pointerup while holding capture on the canvas.
   * If we opened the modal already on pointerdown, the translucent backdrop sits under the finger and
   * pointerup/synthesized clicks would dismiss the form instantly on many browsers.
   * @type {{ pointerId: number, clientX: number, clientY: number } | null}
   */
  let pendingPinFloorTouch = null

  function releaseFloorTouchCapture(pointerId) {
    try {
      domElement.releasePointerCapture(pointerId)
    } catch (_) {
      /* not captured */
    }
  }

  function clearPendingFloorTouch(pointerId) {
    if (!pendingPinFloorTouch || pendingPinFloorTouch.pointerId !== pointerId) return
    releaseFloorTouchCapture(pointerId)
    pendingPinFloorTouch = null
  }

  function intersectFloorAt(clientX, clientY) {
    const rect = domElement.getBoundingClientRect()
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(pointer, camera)
    const floorIndex = getSelectedFloor()
    const planeY = typeof getFloorSlabTopY === 'function' ? getFloorSlabTopY(floorIndex) : 0
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeY)
    const point = new THREE.Vector3()
    if (!raycaster.ray.intersectPlane(plane, point)) return null
    return { floorIndex, position: point }
  }

  function isDeferredPinFloorTouch(event) {
    return (
      event.pointerType === 'touch' ||
      event.pointerType === 'pen'
    )
  }

  // ── Click handling ─────────────────────────────────────────────
  // `passive: false`: allow preventDefault while a floor-touch placement is deferred.
  domElement.addEventListener(
    'pointerdown',
    (event) => {
      const isPrimaryPointer = event.pointerType !== 'mouse' || event.button === 0
      if (!isPrimaryPointer) return
      if (event.target.closest('.ui')) return

      const rect = domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)

      const state = getState()

      const suppressTouchSynthClick =
        (event.pointerType === 'touch' || event.pointerType === 'pen') && event.cancelable

      if (!state.pinMode) {
        const hits = raycaster.intersectObjects(pinGroup.children, true)
        if (!hits.length) {
          if (typeof onEmptyClick === 'function') onEmptyClick()
          return
        }

        // Walk up the parent chain to find either a pin mesh or a cluster sprite.
        let obj = hits[0].object
        while (obj && !obj.userData?.pinData && !obj.userData?.clusterKey) {
          obj = obj.parent
        }

        if (obj?.userData?.clusterKey && typeof onClusterClick === 'function') {
          onClusterClick(obj.userData.clusterKey)
          return
        }

        const pin = obj?.userData?.pinData
        if (pin) {
          if (suppressTouchSynthClick) event.preventDefault()
          onPinClick(pin)
        }
        return
      }

      // Pin-placement mode — floor intersection
      const hitDown = intersectFloorAt(event.clientX, event.clientY)
      if (!hitDown) return

      const deferToPointerUp = isDeferredPinFloorTouch(event)
      if (deferToPointerUp) {
        if (pendingPinFloorTouch && pendingPinFloorTouch.pointerId !== event.pointerId) {
          clearPendingFloorTouch(pendingPinFloorTouch.pointerId)
        }
        pendingPinFloorTouch = {
          pointerId: event.pointerId,
          clientX: event.clientX,
          clientY: event.clientY,
        }
        try {
          domElement.setPointerCapture(event.pointerId)
        } catch (_) {
          pendingPinFloorTouch = null
          return
        }
        if (event.cancelable) event.preventDefault()
        return
      }

      onFloorClick(hitDown)
    },
    { passive: false }
  )

  domElement.addEventListener('pointermove', (event) => {
    if (!pendingPinFloorTouch || event.pointerId !== pendingPinFloorTouch.pointerId) return
    const dx = event.clientX - pendingPinFloorTouch.clientX
    const dy = event.clientY - pendingPinFloorTouch.clientY
    if (dx * dx + dy * dy > PIN_FLOOR_TAP_MOVE_PX * PIN_FLOOR_TAP_MOVE_PX) {
      clearPendingFloorTouch(event.pointerId)
    }
  })

  domElement.addEventListener('pointerup', (event) => {
    if (!pendingPinFloorTouch || event.pointerId !== pendingPinFloorTouch.pointerId) return
    clearPendingFloorTouch(event.pointerId)

    const hitUp = intersectFloorAt(event.clientX, event.clientY)
    if (!hitUp) return
    if (event.cancelable) event.preventDefault()
    onFloorClick(hitUp)
  })

  domElement.addEventListener('pointercancel', (event) => {
    clearPendingFloorTouch(event.pointerId)
  })

  domElement.addEventListener('lostpointercapture', (event) => {
    if (
      pendingPinFloorTouch !== null &&
      event.pointerId === pendingPinFloorTouch.pointerId
    ) {
      pendingPinFloorTouch = null
    }
  })

  // Second finger: abort pending floor tap (same idea as pinLongPress).
  domElement.addEventListener(
    'pointerdown',
    (event) => {
      if (!pendingPinFloorTouch) return
      if (
        pendingPinFloorTouch.pointerId !== event.pointerId &&
        getState()?.pinMode &&
        isDeferredPinFloorTouch(event)
      ) {
        clearPendingFloorTouch(pendingPinFloorTouch.pointerId)
      }
    },
    true
  )

  // ── Hover detection (desktop only, throttled via rAF) ──────────
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  if (!isTouch) {
    let hoverPending = false
    let _prevHovered = null

    domElement.addEventListener('pointermove', (event) => {
      if (hoverPending) return
      hoverPending = true

      requestAnimationFrame(() => {
        hoverPending = false

        const rect = domElement.getBoundingClientRect()
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(pointer, camera)

        const hitSpheres = getHitSpheres(pinGroup)
        const hits = raycaster.intersectObjects(hitSpheres, false)

        let hitGroup = null
        if (hits.length) {
          const hitObj = hits[0].object
          hitGroup = hitObj.parent
        }

        // Un-hover previous
        if (_prevHovered && _prevHovered !== hitGroup) {
          _prevHovered.userData.hovered = false
        }

        if (hitGroup) {
          hitGroup.userData.hovered = true
          domElement.style.cursor = 'pointer'
        } else {
          domElement.style.cursor = ''
        }

        _prevHovered = hitGroup
      })
    })
  }
}
