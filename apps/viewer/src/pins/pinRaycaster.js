/**
 * Pin raycasting — handles pointer interactions with the 3D scene.
 * Exports: setupPinRaycaster.
 */
import * as THREE from 'three'

// Interaction heuristics:
// - Only a short + stationary tap triggers actions (open pin/cluster, or place pin in pin-mode).
// - Holding longer than TAP_MAX_MS does not trigger anything (prevents accidental opens/creates).
// - Any meaningful movement cancels the tap (treated as navigation).
// Real touchscreens often produce slower taps + a bit more jitter than desktop clicks.
// Keep this strict enough to avoid accidental actions during navigation, but permissive enough
// that a normal finger tap reliably places a pin.
const TAP_MAX_MS = 550
const TAP_MOVE_PX = 18
// Floor placement uses the same movement threshold (keep name for clarity in that path).
const PIN_FLOOR_TAP_MOVE_PX = TAP_MOVE_PX

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
  let lastPointerDownAt = 0

  /** @type {{ pointerId: number, startX: number, startY: number, startedAt: number, candidate: any } | null} */
  let pendingSceneTap = null

  /**
   * Pin mode + touch/pen: place on pointerup, not pointerdown — opening the modal on down leaves
   * the backdrop under the finger and triggers instant dismiss on mobile.
   *
   * `pointerId`/`client` are tracked across `document` in **capture** phase — iOS/WebKit often
   * misroutes `pointerup`/synthetic clicks to the overlay unless we listen globally; also
   * `setPointerCapture` can fail or fire `lostpointercapture` prematurely, so we do not rely on it.
   */
  let pendingPinFloorTouch = null
  /** Cleanup for document-level listeners wired while `pendingPinFloorTouch` is set. */
  let detachDeferredFloorGestures = null

  function releaseFloorTouchCapture(pointerId) {
    try {
      domElement.releasePointerCapture(pointerId)
    } catch (_) {
      /* optional */
    }
  }

  function teardownDeferredFloorTap() {
    if (detachDeferredFloorGestures) {
      detachDeferredFloorGestures()
      detachDeferredFloorGestures = null
    }
    if (pendingPinFloorTouch !== null) {
      releaseFloorTouchCapture(pendingPinFloorTouch.pointerId)
      pendingPinFloorTouch = null
    }
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
    return { floorIndex, position: point.clone() }
  }

  function isDeferredPinFloorTouch(event) {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const type = event.pointerType
    // Some kiosk touch firmwares report taps as `mouse` (left button). Treat those as touch-like
    // on touch-capable devices so we still apply the short-press + no-move rules.
    return type === 'touch' || type === 'pen' || (isTouchDevice && type === 'mouse')
  }

  function cancelPendingSceneTap() {
    pendingSceneTap = null
  }

  function attachSceneTapListeners() {
    const doc = domElement.ownerDocument || document

    const onMove = (e) => {
      if (!pendingSceneTap || e.pointerId !== pendingSceneTap.pointerId) return
      const dx = e.clientX - pendingSceneTap.startX
      const dy = e.clientY - pendingSceneTap.startY
      if (dx * dx + dy * dy > TAP_MOVE_PX * TAP_MOVE_PX) {
        cancelPendingSceneTap()
        // If we cancelled due to movement, detach listeners immediately to avoid leaks.
        detach()
      }
    }

    const detach = () => {
      doc.removeEventListener('pointermove', onMove, true)
      doc.removeEventListener('pointerup', onUpCapture, true)
      doc.removeEventListener('pointercancel', onCancelCapture, true)
    }

    const onUpCapture = (e) => {
      if (!pendingSceneTap || e.pointerId !== pendingSceneTap.pointerId) return
      const { candidate, startedAt } = pendingSceneTap
      cancelPendingSceneTap()
      detach()

      const elapsed = performance.now() - startedAt
      if (elapsed > TAP_MAX_MS) return

      const suppressTouchSynthClick = isDeferredPinFloorTouch(e) && e.cancelable
      if (suppressTouchSynthClick) e.preventDefault()

      if (candidate?.kind === 'cluster' && typeof onClusterClick === 'function') {
        onClusterClick(candidate.clusterKey)
        return
      }
      if (candidate?.kind === 'pin') {
        onPinClick(candidate.pin)
        return
      }
      if (candidate?.kind === 'empty' && typeof onEmptyClick === 'function') {
        onEmptyClick()
      }
    }

    const onCancelCapture = (e) => {
      if (!pendingSceneTap || e.pointerId !== pendingSceneTap.pointerId) return
      cancelPendingSceneTap()
      detach()
    }

    // Use capture so pointerup is observed even if it lands on an overlay.
    doc.addEventListener('pointermove', onMove, true)
    doc.addEventListener('pointerup', onUpCapture, true)
    doc.addEventListener('pointercancel', onCancelCapture, true)
  }

  function attachDeferredFloorTapListeners(startClientX, startClientY) {
    const doc = domElement.ownerDocument || document
    const orphanTimerId = window.setTimeout(() => {
      teardownDeferredFloorTap()
    }, 5500)
    let handled = false

    const onMove = (e) => {
      if (
        pendingPinFloorTouch === null ||
        e.pointerId !== pendingPinFloorTouch.pointerId
      ) {
        return
      }
      const dx = e.clientX - startClientX
      const dy = e.clientY - startClientY
      if (
        dx * dx + dy * dy >
        PIN_FLOOR_TAP_MOVE_PX * PIN_FLOOR_TAP_MOVE_PX
      ) {
        teardownDeferredFloorTap()
      }
    }

    /** Capture phase sees pointerup/cancel before it hits any newly shown modal backdrop. */
    const onUpCapture = (e) => {
      if (
        pendingPinFloorTouch === null ||
        e.pointerId !== pendingPinFloorTouch.pointerId
      ) {
        return
      }
      if (handled) {
        teardownDeferredFloorTap()
        return
      }
      handled = true

      const { clientX: x, clientY: y } = e
      const fallbackHit = pendingPinFloorTouch.fallbackHit
      const startedAt = pendingPinFloorTouch.startedAt

      teardownDeferredFloorTap()

      const elapsed = performance.now() - startedAt
      if (elapsed > TAP_MAX_MS) return

      const hitUp = intersectFloorAt(x, y)
      const hit = hitUp || fallbackHit
      if (!hit) return

      if (e.cancelable) e.preventDefault()
      onFloorClick(hit)
    }

    // Fallback: some kiosk/touch stacks synthesize a click without delivering a matching pointerup.
    // Use capture so we can consume it before the modal backdrop handlers.
    const onClickCapture = (e) => {
      if (!pendingPinFloorTouch || handled) return
      // If a modal is already open, ignore clicks (avoid immediate close/reopen loops).
      const modalOpen =
        typeof document !== 'undefined' &&
        Boolean(document.querySelector('.ui-modal-backdrop.is-visible'))
      if (modalOpen) return
      if (e.target && e.target.closest && e.target.closest('.ui')) return
      const elapsed = performance.now() - pendingPinFloorTouch.startedAt
      if (elapsed > TAP_MAX_MS) return
      handled = true
      teardownDeferredFloorTap()
      const hit = intersectFloorAt(e.clientX, e.clientY) || pendingPinFloorTouch.fallbackHit
      if (!hit) return
      if (e.cancelable) e.preventDefault()
      e.stopPropagation()
      onFloorClick(hit)
    }

    const onCancelCapture = (e) => {
      if (
        pendingPinFloorTouch === null ||
        e.pointerId !== pendingPinFloorTouch.pointerId
      ) {
        return
      }
      handled = true
      teardownDeferredFloorTap()
    }

    const onExtraPointerDownCapture = (e) => {
      if (pendingPinFloorTouch === null) return
      if (e.pointerId === pendingPinFloorTouch.pointerId) return

      // Only cancel on a true second-finger touch/pen interaction.
      // Some kiosk firmwares synthesize a follow-up `mouse` pointerdown for the same tap,
      // which must NOT cancel the pending tap.
      if (e.pointerType === 'touch' || e.pointerType === 'pen') {
        teardownDeferredFloorTap()
      }
    }

    doc.addEventListener('pointermove', onMove, true)
    doc.addEventListener('pointerup', onUpCapture, true)
    doc.addEventListener('click', onClickCapture, true)
    doc.addEventListener('pointercancel', onCancelCapture, true)
    doc.addEventListener('pointerdown', onExtraPointerDownCapture, true)

    detachDeferredFloorGestures = () => {
      clearTimeout(orphanTimerId)
      doc.removeEventListener('pointermove', onMove, true)
      doc.removeEventListener('pointerup', onUpCapture, true)
      doc.removeEventListener('click', onClickCapture, true)
      doc.removeEventListener('pointercancel', onCancelCapture, true)
      doc.removeEventListener('pointerdown', onExtraPointerDownCapture, true)
    }
  }

  // ── Click handling ─────────────────────────────────────────────
  domElement.addEventListener(
    'pointerdown',
    (event) => {
      lastPointerDownAt = performance.now()
      const isPrimaryPointer = event.pointerType !== 'mouse' || event.button === 0
      if (!isPrimaryPointer) return
      if (event.target.closest('.ui')) return

      const rect = domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)

      const state = getState()

      const suppressTouchSynthClick = isDeferredPinFloorTouch(event) && event.cancelable

      if (!state.pinMode) {
        const hits = raycaster.intersectObjects(pinGroup.children, true)
        let candidate = { kind: 'empty' }
        if (hits.length) {
          let obj = hits[0].object
          while (obj && !obj.userData?.pinData && !obj.userData?.clusterKey) {
            obj = obj.parent
          }
          if (obj?.userData?.clusterKey) {
            candidate = { kind: 'cluster', clusterKey: obj.userData.clusterKey }
          } else if (obj?.userData?.pinData) {
            candidate = { kind: 'pin', pin: obj.userData.pinData }
          }
        }

        // Defer all opens to pointerup and cancel on move/hold.
        pendingSceneTap = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          startedAt: performance.now(),
          candidate,
        }
        attachSceneTapListeners()
        try {
          domElement.setPointerCapture?.(event.pointerId)
        } catch (_) {}
        if (suppressTouchSynthClick) event.preventDefault()

        // Outside pin-mode: short touch on empty floor should create a pin.
        // We only arm this on touch-like pointers to avoid mouse users creating pins while navigating.
        if (candidate.kind === 'empty' && isDeferredPinFloorTouch(event)) {
          const modalOpen =
            typeof document !== 'undefined' &&
            Boolean(document.querySelector('.ui-modal-backdrop.is-visible'))
          if (!modalOpen) {
            const hitDown = intersectFloorAt(event.clientX, event.clientY)
            if (hitDown) {
              teardownDeferredFloorTap()
              pendingPinFloorTouch = {
                pointerId: event.pointerId,
                clientX: event.clientX,
                clientY: event.clientY,
                startedAt: performance.now(),
                fallbackHit: hitDown,
                pointerType: event.pointerType,
              }
              attachDeferredFloorTapListeners(
                pendingPinFloorTouch.clientX,
                pendingPinFloorTouch.clientY
              )
            }
          }
        }
        return
      }

      const hitDown = intersectFloorAt(event.clientX, event.clientY)
      if (!hitDown) return

      const deferToPointerUp = isDeferredPinFloorTouch(event)
      if (deferToPointerUp) {
        teardownDeferredFloorTap()
        pendingPinFloorTouch = {
          pointerId: event.pointerId,
          clientX: event.clientX,
          clientY: event.clientY,
          startedAt: performance.now(),
          fallbackHit: hitDown,
          pointerType: event.pointerType,
        }
        attachDeferredFloorTapListeners(
          pendingPinFloorTouch.clientX,
          pendingPinFloorTouch.clientY
        )
        try {
          domElement.setPointerCapture?.(event.pointerId)
        } catch (_) {
          /* optional; gestures still tracked via document capture */
        }
        if (event.cancelable) event.preventDefault()
        return
      }

      onFloorClick(hitDown)
    },
    { passive: false }
  )

  // ── Mouse-event fallback (some kiosk stacks don't emit PointerEvents reliably) ──────────
  // Used for floor taps (pin-mode or touch-style "tap to create" outside pin-mode).
  // Keeps the same short-press + no-move rule.
  let mouseTap = null
  domElement.addEventListener('mousedown', (event) => {
    // If PointerEvents fired for this interaction, ignore the mouse fallback.
    if (performance.now() - lastPointerDownAt < 80) return
    if (event.button !== 0) return
    if (event.target.closest && event.target.closest('.ui')) return
    const state = getState()
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (!state?.pinMode && !isTouchDevice) return

    const hitDown = intersectFloorAt(event.clientX, event.clientY)
    if (!hitDown) return
    mouseTap = {
      startX: event.clientX,
      startY: event.clientY,
      startedAt: performance.now(),
      moved: false,
      fallbackHit: hitDown,
    }
  }, true)

  domElement.addEventListener('mousemove', (event) => {
    if (!mouseTap) return
    const dx = event.clientX - mouseTap.startX
    const dy = event.clientY - mouseTap.startY
    if (dx * dx + dy * dy > TAP_MOVE_PX * TAP_MOVE_PX) {
      mouseTap.moved = true
    }
  }, true)

  domElement.addEventListener('mouseup', (event) => {
    if (!mouseTap) return
    if (event.button !== 0) {
      mouseTap = null
      return
    }
    const state = getState()
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (!state?.pinMode && !isTouchDevice) {
      mouseTap = null
      return
    }
    const elapsed = performance.now() - mouseTap.startedAt
    const moved = mouseTap.moved
    const fallbackHit = mouseTap.fallbackHit
    mouseTap = null
    if (moved) return
    if (elapsed > TAP_MAX_MS) return
    const hit = intersectFloorAt(event.clientX, event.clientY) || fallbackHit
    if (!hit) return
    onFloorClick(hit)
  }, true)

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

        const r = domElement.getBoundingClientRect()
        pointer.x = ((event.clientX - r.left) / r.width) * 2 - 1
        pointer.y = -((event.clientY - r.top) / r.height) * 2 + 1
        raycaster.setFromCamera(pointer, camera)

        const hitSpheres = getHitSpheres(pinGroup)
        const hits = raycaster.intersectObjects(hitSpheres, false)

        let hitGroup = null
        if (hits.length) {
          const hitObj = hits[0].object
          hitGroup = hitObj.parent
        }

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
