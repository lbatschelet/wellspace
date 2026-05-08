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
  const { brandDir, publicDir } = brandPaths(brandName, 'admin', repoRoot)

  return {
    appType: 'spa',
    base: brand.adminBase || '/',
    publicDir,
    resolve: {
      alias: {
        '@brand': brandDir,
      },
    },
    define: {
      __BRAND__: JSON.stringify(brandName),
      'import.meta.env.VITE_API_BASE': JSON.stringify(brand.apiBase || '/api'),
      'import.meta.env.VITE_BRAND_DISPLAY_NAME': JSON.stringify(
        typeof brand.displayName === 'string' ? brand.displayName : ''
      ),
    },
    server: {
      port: 5173,
      strictPort: true,
    },
    plugins: [brandHtmlPlugin(brand)],
  }
})
