import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { brandHtmlPlugin, loadBrandConfig, resolveBrand } from '../../infra/vite/brand.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../..')

export default defineConfig(async () => {
  const brandName = resolveBrand()
  const brand = await loadBrandConfig(brandName, repoRoot)
  const brandDir = resolve(repoRoot, 'brands', brandName)
  const publicDir = resolve(brandDir, 'viewer', 'public')

  return {
    appType: 'spa',
    base: '/issue/',
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
    plugins: [brandHtmlPlugin(brand)],
    server: {
      port: 5176,
      strictPort: true,
    },
    preview: {
      port: 5176,
      strictPort: true,
    },
    build: {
      outDir: resolve(here, 'dist'),
      emptyOutDir: true,
    },
  }
})

