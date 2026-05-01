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
      'import.meta.env.VITE_API_BASE': JSON.stringify(brand.apiBase || '/api'),
    },
    build: {
      rollupOptions: {
        input: {
          main: resolve(here, 'index.html'),
          issue: resolve(here, 'issue/index.html'),
        },
      },
    },
    server: {
      port: 5174,
      strictPort: true,
      middlewareMode: false,
    },
    plugins: [
      brandHtmlPlugin(brand),
      {
        name: 'mpa-trailing-slash',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const url = req.url || ''
            if (req.url === '/issue') {
              res.writeHead(301, { Location: '/issue/' })
              res.end()
              return
            }
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
