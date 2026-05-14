import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import {
  brandHtmlPlugin,
  brandPaths,
  loadBrandConfig,
  resolveBrand,
} from '../../infra/vite/brand.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../..')

export default defineConfig(async () => {
  const brandName = resolveBrand()
  const brand = await loadBrandConfig(brandName, repoRoot)
  const { brandDir, publicDir } = brandPaths(brandName, 'viewer', repoRoot)

  return {
    appType: 'mpa',
    base: '/',
    publicDir,
    resolve: {
      alias: {
        '@brand': brandDir,
      },
    },
    define: {
      __BRAND__: JSON.stringify(brandName),
      // Allow `.env.local` / shell override for local API testing (falls back to brand config).
      'import.meta.env.VITE_API_BASE': JSON.stringify(
        process.env.VITE_API_BASE || brand.apiBase || '/api'
      ),
    },
    build: {
      rollupOptions: {
        input: {
          main: resolve(here, 'index.html'),
          notFound: resolve(here, '404.html'),
        },
      },
    },
    server: {
      port: 5174,
      strictPort: true,
      middlewareMode: false,
      // Optional: avoid CORS when calling a remote API from localhost, e.g.
      //   VITE_DEV_API_ORIGIN=https://wohlopti.ch pnpm --filter viewer dev
      // Keep `VITE_API_BASE=/api` (default) so requests stay same-origin in dev.
      ...(process.env.VITE_DEV_API_ORIGIN
        ? {
            proxy: {
              '/api': {
                target: process.env.VITE_DEV_API_ORIGIN.replace(/\/$/, ''),
                changeOrigin: true,
                secure: true,
              },
            },
          }
        : {}),
    },
    plugins: [
      brandHtmlPlugin(brand),
      {
        name: 'mpa-trailing-slash',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const url = req.url || ''
            // Dev convenience for iOS-home-screen-friendly path routes:
            // serve the main app entry for /kiosk/<station>, /station/<station>, /s/<station>.
            if (url.startsWith('/kiosk/') || url.startsWith('/station/') || url.startsWith('/s/')) {
              req.url = '/'
            }
            next()
          })
        },
        configurePreviewServer(server) {
          server.middlewares.use((req, _res, next) => {
            const url = req.url || ''
            if (url.startsWith('/kiosk/') || url.startsWith('/station/') || url.startsWith('/s/')) {
              req.url = '/'
            }
            next()
          })
        },
      },
    ],
  }
})
