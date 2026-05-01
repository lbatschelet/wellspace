#!/usr/bin/env node
/**
 * Brand-aware monorepo build entry point.
 *
 * Hostinger (or any CI) calls `pnpm build`. The behaviour is driven by env vars:
 *
 *   BRAND     required - which brand to build for (e.g. "feelvonroll", "wohlopti").
 *             Forwarded into the per-app vite build so brand assets/config resolve.
 *
 *   APP       required - which app to build:
 *               "viewer" - only apps/viewer/dist
 *               "admin"  - only apps/admin/dist
 *               "all"    - both apps, then merge into a combined dist/
 *                          with viewer at root and admin under dist/admin/.
 *                          Used for single-origin routing (e.g. wohlopti.ch).
 *
 *   OUTPUT    optional - override the final output directory.
 *             Defaults to the per-app dist/ for "viewer"/"admin" and
 *             "dist" at the repo root for "all".
 */

import { execSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(fileURLToPath(import.meta.url), '../../..')

const BRAND = process.env.BRAND
const APP = process.env.APP
const OUTPUT = process.env.OUTPUT

if (!BRAND) {
  console.error('[build] BRAND env var is required (e.g. BRAND=wohlopti)')
  process.exit(1)
}
if (!APP) {
  console.error('[build] APP env var is required (viewer | admin | all)')
  process.exit(1)
}

const validApps = new Set(['viewer', 'admin', 'all'])
if (!validApps.has(APP)) {
  console.error(`[build] APP must be one of: ${[...validApps].join(', ')} (got "${APP}")`)
  process.exit(1)
}

console.log(`[build] BRAND=${BRAND} APP=${APP}`)

const buildOne = (name) => {
  console.log(`[build] building ${name}...`)
  execSync(`pnpm --filter ${name} build`, {
    stdio: 'inherit',
    cwd: repoRoot,
    env: { ...process.env, BRAND },
  })
}

if (APP === 'all') {
  buildOne('viewer')
  buildOne('admin')

  const target = resolve(repoRoot, OUTPUT ?? 'dist')
  const viewerDist = resolve(repoRoot, 'apps/viewer/dist')
  const adminDist = resolve(repoRoot, 'apps/admin/dist')

  if (!existsSync(viewerDist) || !existsSync(adminDist)) {
    console.error('[build] expected viewer and admin dist directories to exist after build')
    process.exit(1)
  }

  console.log(`[build] combining into ${target}`)
  rmSync(target, { recursive: true, force: true })
  mkdirSync(target, { recursive: true })
  cpSync(viewerDist, target, { recursive: true })
  cpSync(adminDist, resolve(target, 'admin'), { recursive: true })

  console.log(`[build] done -> ${target}`)
} else {
  buildOne(APP)
  if (OUTPUT) {
    const source = resolve(repoRoot, `apps/${APP}/dist`)
    const target = resolve(repoRoot, OUTPUT)
    console.log(`[build] copying ${source} -> ${target}`)
    rmSync(target, { recursive: true, force: true })
    mkdirSync(target, { recursive: true })
    cpSync(source, target, { recursive: true })
  }
  console.log(`[build] done -> apps/${APP}/dist${OUTPUT ? ` (mirrored to ${OUTPUT})` : ''}`)
}
