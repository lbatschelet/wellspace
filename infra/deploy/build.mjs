#!/usr/bin/env node
/**
 * Brand-aware monorepo build entry point.
 *
 * Hostinger and some CI images run `pnpm run build`, but `pnpm` is not always on `$PATH`
 * inside child shells. This script invokes the local Vite CLI with `process.execPath` instead
 * of `pnpm --filter`, so nested builds succeed.
 *
 * The behaviour is driven by env vars:
 *
 *   BRAND     required - tenant brand slug under brands/ (e.g. feelvonroll, wohlopti).
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

import { execFileSync, execSync } from 'node:child_process'
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

const validApps = new Set(['viewer', 'admin', 'issue', 'all'])
if (!validApps.has(APP)) {
  console.error(`[build] APP must be one of: ${[...validApps].join(', ')} (got "${APP}")`)
  process.exit(1)
}

console.log(`[build] BRAND=${BRAND} APP=${APP}`)

function safeExec(cmd) {
  try {
    return String(execSync(cmd, { cwd: repoRoot, stdio: ['ignore', 'pipe', 'ignore'] })).trim()
  } catch {
    return ''
  }
}

function resolveBuildVersion() {
  // Prefer an exact tag on the current commit (release build).
  const exactTag = safeExec('git describe --tags --exact-match')
  if (exactTag) return exactTag

  // Otherwise show a descriptive string (tag + commits + sha) if available.
  const described = safeExec('git describe --tags --always --dirty')
  if (described) return described

  // Fallback for environments without git metadata.
  const sha = safeExec('git rev-parse --short HEAD')
  return sha || 'dev'
}

const BUILD_VERSION = resolveBuildVersion()
const BUILD_SHA = safeExec('git rev-parse --short HEAD') || ''
console.log(`[build] VERSION=${BUILD_VERSION}${BUILD_SHA ? ` SHA=${BUILD_SHA}` : ''}`)

function resolveViteCli(appSlug) {
  const appRoot = resolve(repoRoot, 'apps', appSlug)
  const candidates = [
    resolve(appRoot, 'node_modules/vite/bin/vite.js'),
    resolve(repoRoot, 'node_modules/vite/bin/vite.js'),
  ]
  for (const p of candidates) {
    if (existsSync(p)) return { appRoot, viteJs: p }
  }
  throw new Error(
    `[build] Could not find vite/bin/vite.js for "${appSlug}". ` +
      `Run pnpm install at the repo root. Tried:\n  ${candidates.join('\n  ')}`,
  )
}

const buildOne = (name) => {
  console.log(`[build] building ${name}...`)
  const { appRoot, viteJs } = resolveViteCli(name)
  execFileSync(process.execPath, [viteJs, 'build'], {
    stdio: 'inherit',
    cwd: appRoot,
    env: {
      ...process.env,
      BRAND,
      // Vite exposes only VITE_* variables to import.meta.env.
      VITE_APP_VERSION: process.env.VITE_APP_VERSION || BUILD_VERSION,
      VITE_APP_GIT_SHA: process.env.VITE_APP_GIT_SHA || BUILD_SHA,
    },
  })
}

if (APP === 'all') {
  buildOne('viewer')
  buildOne('admin')
  buildOne('issue')

  const target = resolve(repoRoot, OUTPUT ?? 'dist')
  const viewerDist = resolve(repoRoot, 'apps/viewer/dist')
  const adminDist = resolve(repoRoot, 'apps/admin/dist')
  const issueDist = resolve(repoRoot, 'apps/issue/dist')

  if (!existsSync(viewerDist) || !existsSync(adminDist) || !existsSync(issueDist)) {
    console.error('[build] expected viewer/admin/issue dist directories to exist after build')
    process.exit(1)
  }

  console.log(`[build] combining into ${target}`)
  rmSync(target, { recursive: true, force: true })
  mkdirSync(target, { recursive: true })
  cpSync(viewerDist, target, { recursive: true })
  cpSync(adminDist, resolve(target, 'admin'), { recursive: true })
  cpSync(issueDist, resolve(target, 'issue'), { recursive: true })

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
