import process from 'node:process'

import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'

function usage() {
  console.error('Usage: node remove_largest_mesh_from_glb.mjs <in.glb> <out.glb>')
}

function triArea(ax, ay, az, bx, by, bz, cx, cy, cz) {
  const abx = bx - ax, aby = by - ay, abz = bz - az
  const acx = cx - ax, acy = cy - ay, acz = cz - az
  const cxp = aby * acz - abz * acy
  const cyp = abz * acx - abx * acz
  const czp = abx * acy - aby * acx
  return 0.5 * Math.sqrt(cxp * cxp + cyp * cyp + czp * czp)
}

function computePrimitiveArea(prim) {
  const pos = prim.getAttribute('POSITION')
  if (!pos) return 0
  const indices = prim.getIndices()
  const p = pos.getArray()

  const idx = indices ? indices.getArray() : null
  const count = idx ? idx.length : (p.length / 3)
  let area = 0

  if (idx) {
    for (let i = 0; i + 2 < count; i += 3) {
      const ia = idx[i] * 3
      const ib = idx[i + 1] * 3
      const ic = idx[i + 2] * 3
      area += triArea(
        p[ia], p[ia + 1], p[ia + 2],
        p[ib], p[ib + 1], p[ib + 2],
        p[ic], p[ic + 1], p[ic + 2],
      )
    }
    return area
  }

  // Non-indexed triangles.
  for (let i = 0; i + 8 < p.length; i += 9) {
    area += triArea(
      p[i], p[i + 1], p[i + 2],
      p[i + 3], p[i + 4], p[i + 5],
      p[i + 6], p[i + 7], p[i + 8],
    )
  }
  return area
}

function computePrimitiveBounds(prim) {
  const pos = prim.getAttribute('POSITION')
  if (!pos) return null
  const p = pos.getArray()
  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
  for (let i = 0; i + 2 < p.length; i += 3) {
    const x = p[i], y = p[i + 1], z = p[i + 2]
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (z < minZ) minZ = z
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
    if (z > maxZ) maxZ = z
  }
  return { minX, minY, minZ, maxX, maxY, maxZ }
}

async function main() {
  const inPath = process.argv[2]
  const outPath = process.argv[3]
  const debug = process.argv.includes('--debug')
  if (!inPath || !outPath) {
    usage()
    process.exit(2)
  }

  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
  const doc = await io.read(inPath)

  const meshes = doc.getRoot().listMeshes()
  if (!meshes.length) {
    console.error('No meshes found.')
    process.exit(1)
  }

  // Identify baseplate candidates:
  // - very thin in Y
  // - near global minimum Y
  // - large footprint in XZ
  // We pick the mesh with the largest XZ footprint among candidates.
  let globalMinY = Infinity
  let globalMaxDim = 0
  const meshStats = []

  for (const mesh of meshes) {
    let meshMinY = Infinity
    let meshMaxY = -Infinity
    let meshMinX = Infinity, meshMaxX = -Infinity
    let meshMinZ = Infinity, meshMaxZ = -Infinity
    let area = 0

    for (const prim of mesh.listPrimitives()) {
      area += computePrimitiveArea(prim)
      const b = computePrimitiveBounds(prim)
      if (!b) continue
      meshMinY = Math.min(meshMinY, b.minY)
      meshMaxY = Math.max(meshMaxY, b.maxY)
      meshMinX = Math.min(meshMinX, b.minX)
      meshMaxX = Math.max(meshMaxX, b.maxX)
      meshMinZ = Math.min(meshMinZ, b.minZ)
      meshMaxZ = Math.max(meshMaxZ, b.maxZ)
    }

    if (!Number.isFinite(meshMinY)) continue
    const sizeX = meshMaxX - meshMinX
    const sizeY = meshMaxY - meshMinY
    const sizeZ = meshMaxZ - meshMinZ
    const footprint = Math.max(0, sizeX) * Math.max(0, sizeZ)
    const maxDim = Math.max(sizeX, sizeY, sizeZ)
    globalMinY = Math.min(globalMinY, meshMinY)
    globalMaxDim = Math.max(globalMaxDim, maxDim)
    meshStats.push({ mesh, area, meshMinY, sizeX, sizeY, sizeZ, footprint })
  }

  if (!meshStats.length) {
    console.error('No mesh bounds computed.')
    process.exit(1)
  }

  const thinY = Math.max(0.001, globalMaxDim * 0.01)

  // Primary rule (as requested):
  // "Grundplatte ist immer nur die grösste fläche" →
  // remove the largest thin plate by XZ footprint, regardless of Y position.
  const candidates = meshStats.filter((s) => s.sizeY <= thinY)

  const best = (candidates.length ? candidates : meshStats)
    .slice()
    .sort((a, b) => (b.footprint - a.footprint) || (b.area - a.area))[0]

  if (debug) {
    // Debug: print the top candidates for verification.
    const top = (candidates.length ? candidates : meshStats)
      .slice()
      .sort((a, b) => (b.footprint - a.footprint) || (b.area - a.area))
      .slice(0, 5)
      .map((s) => ({
        name: s.mesh.getName() || '(unnamed)',
        footprint: Number(s.footprint.toFixed(2)),
        sizeY: Number(s.sizeY.toFixed(4)),
        minY: Number(s.meshMinY.toFixed(4)),
        area: Number(s.area.toFixed(2)),
      }))
    console.log('Top plate candidates:', top)
  }

  if (!best) {
    console.error('No mesh areas computed.')
    process.exit(1)
  }

  const bestName = best.mesh.getName() || '(unnamed)'
  if (debug) {
    console.log(`Removing baseplate mesh: ${bestName} (footprint=${best.footprint.toFixed(2)}, sizeY=${best.sizeY.toFixed(4)}, minY=${best.meshMinY.toFixed(4)})`)
  }

  // Remove all nodes that reference this mesh.
  for (const node of doc.getRoot().listNodes()) {
    if (node.getMesh() === best.mesh) {
      node.setMesh(null)
    }
  }

  // Remove mesh from root to drop it from output.
  best.mesh.dispose()

  io.write(outPath, doc)
  if (debug) console.log(`Wrote: ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

