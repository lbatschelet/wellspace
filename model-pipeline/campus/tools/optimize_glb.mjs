import process from 'node:process'

import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import {
  dedup,
  prune,
  weld,
  simplify,
} from '@gltf-transform/functions'
import { MeshoptSimplifier } from 'meshoptimizer'

function usage() {
  console.error('Usage: node optimize_glb.mjs <in.glb> <out.glb> [--simplify <ratio>] [--weld <tolerance>]')
  console.error('  --simplify ratio: 0..1 (e.g. 0.7 keeps ~70% triangles). Optional.')
  console.error('  --weld tolerance: float (default 1e-4).')
}

function readFlag(name, { hasValue = false } = {}) {
  const idx = process.argv.indexOf(name)
  if (idx === -1) return { present: false, value: null }
  if (!hasValue) return { present: true, value: true }
  const value = process.argv[idx + 1]
  return { present: true, value }
}

async function main() {
  const inPath = process.argv[2]
  const outPath = process.argv[3]
  if (!inPath || !outPath) {
    usage()
    process.exit(2)
  }

  const simplifyFlag = readFlag('--simplify', { hasValue: true })
  const weldFlag = readFlag('--weld', { hasValue: true })

  const simplifyRatio =
    simplifyFlag.present ? Number(simplifyFlag.value) : null
  const weldTolerance =
    weldFlag.present ? Number(weldFlag.value) : 1e-4

  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
  const doc = await io.read(inPath)

  // Fast + safe: removes unused accessors/textures/materials/etc, and merges duplicates.
  await doc.transform(
    dedup(),
    prune(),
    weld({ tolerance: Number.isFinite(weldTolerance) ? weldTolerance : 1e-4 }),
    prune(),
  )

  // Optional: geometry simplification (can be a big win for SweetHome exports).
  // This uses meshoptimizer under the hood.
  if (simplifyRatio != null) {
    const ratio = THREE_CLAMP(simplifyRatio, 0.05, 1)
    try {
      // Ensure wasm module is ready.
      if (MeshoptSimplifier?.ready) await MeshoptSimplifier.ready
      await doc.transform(
        simplify({ ratio, simplifier: MeshoptSimplifier }),
        prune(),
      )
      console.log(`[optimize_glb] simplified ratio=${ratio}`)
    } catch (err) {
      console.warn('[optimize_glb] simplify skipped:', err?.message || err)
    }
  }

  await io.write(outPath, doc)
}

function THREE_CLAMP(v, min, max) {
  if (!Number.isFinite(v)) return max
  return Math.min(Math.max(v, min), max)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

