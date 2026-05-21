#!/usr/bin/env node
/**
 * GLB cleanup without EXT_meshopt_compression (avoids meshopt write errors on some exports).
 *
 * Usage: node optimize_glb_no_meshopt.mjs <in.glb> <out.glb> [--simplify <ratio>] [--weld <tolerance>]
 */
import process from 'node:process'

import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import {
  dedup,
  flatten,
  join,
  prune,
  weld,
  simplify,
} from '@gltf-transform/functions'
import { MeshoptSimplifier } from 'meshoptimizer'

function usage() {
  console.error('Usage: node optimize_glb_no_meshopt.mjs <in.glb> <out.glb> [--simplify <ratio>] [--weld <tolerance>]')
}

function readFlag(name, { hasValue = false } = {}) {
  const idx = process.argv.indexOf(name)
  if (idx === -1) return { present: false, value: null }
  if (!hasValue) return { present: true, value: true }
  return { present: true, value: process.argv[idx + 1] }
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return max
  return Math.min(Math.max(value, min), max)
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
  const simplifyRatio = simplifyFlag.present ? Number(simplifyFlag.value) : 0.25
  const weldTolerance = weldFlag.present ? Number(weldFlag.value) : 1e-4

  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
  const doc = await io.read(inPath)

  await doc.transform(
    dedup(),
    prune(),
    weld({ tolerance: Number.isFinite(weldTolerance) ? weldTolerance : 1e-4 }),
    flatten(),
    join({ keepNamed: false, keepMeshes: false }),
    prune(),
  )

  if (MeshoptSimplifier?.ready) await MeshoptSimplifier.ready
  const ratio = clamp(simplifyRatio, 0.01, 1)
  await doc.transform(
    simplify({ ratio, simplifier: MeshoptSimplifier }),
    join({ keepNamed: false, keepMeshes: false }),
    prune(),
  )

  await io.write(outPath, doc)
  console.log(`[optimize_glb_no_meshopt] simplified ratio=${ratio}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
